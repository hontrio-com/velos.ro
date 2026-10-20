// IMPORTANT: Fișier SERVER-SIDE only. Nu importa în componente client.
// Cheia SMSO este în .env și nu ajunge niciodată în browser.

import { createServiceClient } from "@/lib/supabase/service";
import { telefonE164 } from "@/lib/phone";
import { getSmsDisponibil, mesajFaraSms, esteRpcLipsa } from "@/lib/sms-disponibil";

export {
  formatPhoneForSmso,
  interpolateTemplate,
  countSmsChars,
  getPrenume,
  buildTemplateVars,
} from "./sms-utils";

const SMSO_API_URL = "https://app.smso.ro/api/v1/send";

type Db = ReturnType<typeof createServiceClient>;

export interface SmsResult {
  success: boolean;
  smso_id?: string;
  error?: string;
  quotaDepasita?: boolean;
  /** Contul care plătește nu are SMS-uri incluse (trialul nou): UI-ul oferă „Cumpără SMS-uri". */
  trialFaraSms?: boolean;
}

export interface SendSmsParams {
  telefon: string;
  mesaj: string;
  profileId: string;   // owner-ul stației — pentru quota
  statieId?: string;   // pentru logging în mesaje
  clientId?: string;   // pentru logging în mesaje
}

export async function sendSms(params: SendSmsParams): Promise<SmsResult> {
  const { telefon, mesaj, profileId, statieId, clientId } = params;

  const apiKey = process.env.SMSO_API_KEY;
  if (!apiKey) {
    console.error("[SMS] SMSO_API_KEY lipsă din .env");
    return { success: false, error: "SMS neconfigurat pe platformă" };
  }

  const supabase = createServiceClient();

  // Rândul din mesaje pentru o trimitere refuzată sau eșuată (doar cu statieId).
  const logEroare = async () => {
    if (statieId) {
      await supabase.from("mesaje").insert({
        statie_id: statieId,
        client_id: clientId ?? null,
        telefon,
        mesaj,
        tip: "sms",
        directie: "trimis",
        status: "eroare",
      });
    }
  };

  // ── Verificare SMS disponibile: incluse în plan + credit cumpărat ──────
  // Pentru conturile existente e exact calculul de până acum (get_sms_quota +
  // profiles.sms_credit). Conturile din trialul nou (migrația 012) nu au SMS-uri
  // incluse cât sunt pe planul "trial" — trimit doar din credit.
  const disp = await getSmsDisponibil(profileId, supabase);
  const useCredit = disp.ramase <= 0 && disp.credit > 0;

  // Refuzul „fără SMS": aici, la citirea soldului, și la rezervarea de mai jos,
  // când o trimitere simultană a consumat deja creditul (atunci creditul e 0).
  const refuzFaraSms = async (credit: number): Promise<SmsResult> => {
    const msg = disp.trialFaraSms
      ? mesajFaraSms(disp.subscriptionStatus)
      : `Quota SMS epuizată (${disp.trimise}/${disp.limita} SMS/lună, ${credit} credite)`;
    await logEroare();
    return { success: false, quotaDepasita: true, trialFaraSms: disp.trialFaraSms, error: msg };
  };

  if (disp.ramase <= 0 && disp.credit <= 0) {
    return refuzFaraSms(disp.credit);
  }

  // ── Credit cumpărat: rezervat ÎNAINTE de trimitere ─────────────
  // Soldul de mai sus e doar citit: fără rezervare, trimiterile simultane ar
  // trece toate de verificare și ar pleca mai multe SMS-uri decât creditul.
  // Număr invalid: nu rezervăm nimic — eroarea de mai jos, ca până acum.
  let creditRezervat = false;
  if (useCredit && telefonE164(telefon)) {
    const rezervare = await rezervaCreditSms(supabase, profileId);
    if (rezervare === "insuficient") {
      return refuzFaraSms(0);
    }
    if (rezervare === "eroare") {
      // Nu știm dacă mai e credit => nu trimitem.
      await logEroare();
      return { success: false, error: "Nu am putut verifica creditul SMS. Încearcă din nou." };
    }
    // "lipsa" (migrația 012 neaplicată): ordinea veche, creditul se scade după trimitere.
    creditRezervat = rezervare === "rezervat";
  }

  // ── Trimitere SMSO ─────────────────────────────────────────────
  let acceptat = false;
  try {
    const destinatar = telefonE164(telefon);
    if (!destinatar) {
      throw new Error(`Numar de telefon invalid: ${telefon}`);
    }

    const payload: Record<string, string> = {
      to: destinatar,
      body: mesaj,
    };
    const sender = process.env.SMSO_SENDER_NAME;
    if (sender) payload.sender = sender;

    const response = await fetch(SMSO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Authorization": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`SMSO ${response.status}: ${errText}`);
    }
    // SMSO a acceptat mesajul: de aici SMS-ul se socotește trimis, iar creditul
    // rezervat nu se mai dă înapoi (nici dacă răspunsul nu se poate citi).
    acceptat = true;

    const data = await response.json();
    const smso_id = data.id ?? data.messageId ?? String(data);

    // ── Deduct quota sau credit ────────────────────────────────────
    if (useCredit) {
      // Creditul rezervat e deja scăzut; fără rezervare (calea veche), acum.
      if (!creditRezervat) await scadeCreditSms(supabase, profileId, disp.credit);
    } else {
      await supabase.rpc("increment_sms_quota", { p_profile_id: profileId, p_count: 1 });
    }

    // ── Log în mesaje ──────────────────────────────────────────────
    if (statieId) {
      await supabase.from("mesaje").insert({
        statie_id: statieId,
        client_id: clientId ?? null,
        telefon,
        mesaj,
        tip: "sms",
        directie: "trimis",
        status: "trimis",
      });
    }

    return { success: true, smso_id };
  } catch (err) {
    // SMSO nu a acceptat mesajul (răspuns de eroare sau niciun răspuns): SMS-ul
    // nu a plecat, deci creditul rezervat se dă înapoi.
    if (creditRezervat && !acceptat) {
      await restituieCreditSms(supabase, profileId);
    }
    const error = (err as Error).message;
    await logEroare();
    return { success: false, error };
  }
}

type RezervareCredit = "rezervat" | "insuficient" | "lipsa" | "eroare";

/**
 * Rezervă 1 credit ATOMIC (consuma_credit_sms, migrația 012) ÎNAINTE de
 * trimitere, ca trimiterile simultane să nu poată trimite mai multe SMS-uri
 * decât creditul:
 *  - "rezervat": creditul e scăzut (se dă înapoi dacă SMS-ul nu pleacă);
 *  - "insuficient": o trimitere simultană a consumat ultimul credit;
 *  - "lipsa": funcția nu există încă (migrație neaplicată / cache PostgREST vechi);
 *  - "eroare": nu știm dacă mai e credit, deci nu trimitem.
 */
async function rezervaCreditSms(supabase: Db, profileId: string): Promise<RezervareCredit> {
  try {
    const { data, error } = await supabase.rpc("consuma_credit_sms", {
      p_profile_id: profileId,
      p_count: 1,
    });
    if (!error) return data === -1 ? "insuficient" : "rezervat";
    if (esteRpcLipsa(error)) return "lipsa";
    console.error(`[SMS] consuma_credit_sms a eșuat pentru profile ${profileId}:`, error.message);
  } catch (err) {
    console.error(`[SMS] consuma_credit_sms a eșuat pentru profile ${profileId}:`, err);
  }
  return "eroare";
}

/**
 * Dă înapoi creditul rezervat când SMS-ul NU a plecat (SMSO a răspuns cu eroare
 * sau nu a răspuns deloc). Nu aruncă: o restituire eșuată doar se loghează.
 */
async function restituieCreditSms(supabase: Db, profileId: string) {
  try {
    const { data, error } = await supabase.rpc("restituie_credit_sms", {
      p_profile_id: profileId,
      p_count: 1,
    });
    if (error) {
      console.error(`[SMS] restituie_credit_sms a eșuat pentru profile ${profileId}:`, error.message);
    } else if (data === -1) {
      console.error(`[SMS] restituie_credit_sms: profilul ${profileId} nu există`);
    }
  } catch (err) {
    console.error(`[SMS] restituie_credit_sms a eșuat pentru profile ${profileId}:`, err);
  }
}

/**
 * Calea veche, fără rezervare: doar când consuma_credit_sms lipsea la rezervare
 * (migrația 012 neaplicată / cache PostgREST vechi). Creditul se scade DUPĂ ce
 * SMSO a acceptat mesajul, ca înainte: atomic dacă funcția a apărut între timp,
 * altfel citire-scriere. Până la migrație, trimiterile simultane pot trimite mai
 * multe SMS-uri decât creditul.
 */
async function scadeCreditSms(supabase: Db, profileId: string, creditCitit: number) {
  const { data, error } = await supabase.rpc("consuma_credit_sms", {
    p_profile_id: profileId,
    p_count: 1,
  });

  if (!error) {
    if (data === -1) {
      // Funcția a apărut abia după rezervare, iar o trimitere simultană a consumat
      // între timp ultimul credit: SMS-ul acesta a plecat deja, fără scădere.
      console.warn(`[SMS] Credit insuficient la decontare pentru profile ${profileId} (trimiteri simultane)`);
    }
    return;
  }

  if (esteRpcLipsa(error)) {
    await supabase
      .from("profiles")
      .update({ sms_credit: Math.max(0, creditCitit - 1) })
      .eq("id", profileId);
    return;
  }

  // Nu rescriem creditul „pe ghicite": am putea șterge o cumpărare abia creditată.
  console.error(`[SMS] consuma_credit_sms a eșuat pentru profile ${profileId}:`, error.message);
}

// Helper: obține profileId (owner_id) dintr-un statieId
export async function getProfileIdForStatie(statieId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("statii")
    .select("owner_id")
    .eq("id", statieId)
    .single();
  return data?.owner_id ?? null;
}

// Formatarea numerelor traieste in @/lib/phone (suporta orice tara, nu doar RO).

// Legacy — pentru backward compat
export async function sendSmsConfirmare(
  phone: string, date: string, time: string, station: string
): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: "Folosește sendSms() cu profileId" };
}
export async function sendSmsAnulare(
  phone: string, date: string
): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: "Folosește sendSms() cu profileId" };
}
