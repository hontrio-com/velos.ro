import "server-only";

import type { createServiceClient } from "@/lib/supabase/service";
import { esteRpcLipsa } from "@/lib/sms-disponibil";

type Db = ReturnType<typeof createServiceClient>;

export interface AchizitieSms {
  sessionId: string;
  profileId: string;
  cantitate: number;
  /** Suma plătită, în moneda sesiunii (EUR): amount_total / 100. */
  pretTotal: number;
  paymentIntent: string | null;
}

/**
 * Creditează o achiziție de SMS-uri EXACT O DATĂ, oricâte căi o procesează:
 * webhook-ul Stripe, reîncercările lui și fallback-ul de pe pagina de succes.
 *
 * @returns true dacă acest apel a creditat contul,
 *          false dacă achiziția era deja înregistrată.
 * @throws  la eroare de bază de date — webhook-ul răspunde 500 și Stripe reîncearcă
 *          (sigur: funcția e idempotentă).
 */
export async function crediteazaAchizitieSms(db: Db, a: AchizitieSms): Promise<boolean> {
  const { data, error } = await db.rpc("adauga_credit_sms_achizitie", {
    p_session_id: a.sessionId,
    p_profile_id: a.profileId,
    p_cantitate: a.cantitate,
    p_pret_total: a.pretTotal,
    p_payment_intent: a.paymentIntent ?? undefined,
  });

  if (!error) return data === true;
  if (!esteRpcLipsa(error)) {
    throw new Error(`adauga_credit_sms_achizitie: ${error.message}`);
  }

  // ── Fallback: migrația 012 nu e aplicată încă ─────────────────────────────
  // Ca înainte (citire-scriere, non-atomic), dar înregistrăm achiziția ÎNAINTE de
  // creditare: UNIQUE(stripe_session_id) face ca doar o cale să treacă de insert.
  console.warn("[sms-achizitii] adauga_credit_sms_achizitie lipsește — fallback non-atomic:", a.sessionId);

  const { error: insertErr } = await db.from("sms_purchases").insert({
    profile_id: a.profileId,
    stripe_session_id: a.sessionId,
    stripe_payment_intent: a.paymentIntent,
    cantitate: a.cantitate,
    pret_total: a.pretTotal,
    status: "completed",
    completed_at: new Date().toISOString(),
  });
  if (insertErr) {
    // 23505: cealaltă cale a înregistrat sesiunea între timp → nu mai creditam.
    if (insertErr.code === "23505") return false;
    throw new Error(`sms_purchases: ${insertErr.message}`);
  }

  const { data: prof } = await db
    .from("profiles")
    .select("sms_credit")
    .eq("id", a.profileId)
    .maybeSingle();
  await db
    .from("profiles")
    .update({ sms_credit: (prof?.sms_credit ?? 0) + a.cantitate })
    .eq("id", a.profileId);
  return true;
}
