// IMPORTANT: Fișier SERVER-SIDE only. Nu importa în componente client.
// Cheia SMSO este în .env și nu ajunge niciodată în browser.

import { createServiceClient } from "@/lib/supabase/service";

export {
  formatPhoneForSmso,
  interpolateTemplate,
  countSmsChars,
  getPrenume,
  buildTemplateVars,
} from "./sms-utils";

const SMSO_API_URL = "https://app.smso.ro/api/v1/send";

export interface SmsResult {
  success: boolean;
  smso_id?: string;
  error?: string;
  quotaDepasita?: boolean;
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

  // ── Verificare quota ───────────────────────────────────────────
  const { data: quotaRows } = await supabase
    .rpc("get_sms_quota", { p_profile_id: profileId });

  const quota = quotaRows?.[0];
  if (!quota || quota.ramase <= 0) {
    const msg = `Quota SMS epuizată (${quota?.trimise ?? 0}/${quota?.limita ?? 0} SMS/lună)`;
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
    return { success: false, quotaDepasita: true, error: msg };
  }

  // ── Trimitere SMSO ─────────────────────────────────────────────
  try {
    const payload: Record<string, string> = {
      to: formatPhoneRaw(telefon),
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

    const data = await response.json();
    const smso_id = data.id ?? data.messageId ?? String(data);

    // ── Increment quota ────────────────────────────────────────────
    await supabase.rpc("increment_sms_quota", { p_profile_id: profileId, p_count: 1 });

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
    const error = (err as Error).message;
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
    return { success: false, error };
  }
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

function formatPhoneRaw(telefon: string): string {
  const clean = telefon.replace(/\D/g, "");
  if (clean.startsWith("40")) return "+" + clean;
  if (clean.startsWith("0")) return "+4" + clean;
  return "+4" + clean;
}

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
