import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database.types";
import {
  MESAJ_FARA_SMS_PLAN,
  MESAJ_FARA_SMS_TRIAL,
  type SmsDisponibil,
} from "@/lib/sms-disponibil-shared";

/**
 * SMS-uri disponibile pentru un cont — întotdeauna profilul PROPRIETARULUI
 * stației: angajații nu au SMS-uri proprii, totul se consumă din contul owner-ului.
 *
 * Două surse, consumate în ordine de sendSms:
 *  1. SMS-urile incluse în plan — funcția SQL get_sms_quota.
 *  2. Creditul cumpărat — profiles.sms_credit, nu expiră.
 *
 * Trialul nou (migrația 012): conturile create după lansare au
 * trial_fara_sms = true. Cât timp sunt pe planul "trial" NU au SMS-uri incluse.
 * get_sms_quota întoarce deja 0 pentru ele; regula de aici e apărare în
 * profunzime: 0 incluse, orice ar scrie în sms_quota.
 */

type Db = ReturnType<typeof createServiceClient>;
type ProfilRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface InfoTrial {
  trialFaraSms: boolean;
  trialExpiresAt: string | null;
  createdAt: string | null;
}

/** Regula de cohortă — singura sursă de adevăr, folosită și pentru SMS și pentru texte. */
export function areTrialFaraSms(
  profil: Pick<ProfilRow, "plan" | "trial_fara_sms"> | null | undefined
): boolean {
  // `=== true`: înainte de migrația 012 coloana lipsește (undefined) => cont vechi.
  return profil?.plan === "trial" && profil?.trial_fara_sms === true;
}

/** Mesajul salvat / afișat când un cont fără SMS incluse nu mai are nici credit. */
export function mesajFaraSms(subscriptionStatus: string): string {
  return subscriptionStatus === "trial" ? MESAJ_FARA_SMS_TRIAL : MESAJ_FARA_SMS_PLAN;
}

/**
 * Funcția RPC nu există încă (migrația 012 neaplicată sau cache-ul PostgREST
 * nereîncărcat): PGRST202 de la PostgREST sau 42883 de la Postgres.
 */
export function esteRpcLipsa(error: { code?: string } | null | undefined): boolean {
  return error?.code === "PGRST202" || error?.code === "42883";
}

/**
 * Profilul complet, cu service client. `*` intenționat: înainte de migrația 012
 * coloana trial_fara_sms nu există, iar un select explicit ar eșua — așa lipsa
 * ei înseamnă pur și simplu „cont vechi". Eroare => null (ca înainte: credit 0).
 */
async function citesteProfil(db: Db, profileId: string): Promise<ProfilRow | null> {
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();
  if (error) {
    console.error("[sms-disponibil] Profil necitit:", profileId, error.message);
    return null;
  }
  return data;
}

export async function getSmsDisponibil(
  profileId: string,
  db: Db = createServiceClient()
): Promise<SmsDisponibil> {
  // În paralel, ca înainte în sendSms: pentru conturile existente nu adăugăm latență.
  const [profil, { data: quotaRows, error: quotaError }] = await Promise.all([
    citesteProfil(db, profileId),
    db.rpc("get_sms_quota", { p_profile_id: profileId }),
  ]);
  if (quotaError) {
    console.error("[sms-disponibil] get_sms_quota:", profileId, quotaError.message);
  }

  const credit = profil?.sms_credit ?? 0;
  const trialFaraSms = areTrialFaraSms(profil);
  const comun = {
    credit,
    trialFaraSms,
    plan: profil?.plan ?? "trial",
    subscriptionStatus: profil?.subscription_status ?? "trial",
    trialExpiresAt: profil?.trial_expires_at ?? null,
  };

  if (trialFaraSms) {
    return {
      ...comun,
      trimise: 0,
      limita: 0,
      ramase: 0,
      quotaCitita: true,
      totalDisponibil: Math.max(0, credit),
    };
  }

  // Conturile existente: exact datele pe care sendSms le folosea și până acum
  // (valori brute, ca mesajul de eroare vechi să rămână identic).
  const quota = quotaRows?.[0];
  const ramase = quota?.ramase ?? 0;
  return {
    ...comun,
    trimise: quota?.trimise ?? 0,
    limita: quota?.limita ?? 0,
    ramase,
    quotaCitita: !!quota,
    totalDisponibil: Math.max(0, ramase) + Math.max(0, credit),
  };
}

/**
 * Marcajul de cohortă pentru afișaj (layout, Abonament, onboarding). Separat de
 * select-urile existente: dacă migrația lipsește, un select explicit pe coloană
 * ar eșua, iar în layout asta ar porni bucla /onboarding <-> /dashboard.
 * Orice problemă => trialFaraSms: false, adică exact afișajul de azi.
 */
export async function getInfoTrial(profileId: string): Promise<InfoTrial> {
  const profil = await citesteProfil(createServiceClient(), profileId);
  return {
    trialFaraSms: areTrialFaraSms(profil),
    trialExpiresAt: profil?.trial_expires_at ?? null,
    createdAt: profil?.created_at ?? null,
  };
}
