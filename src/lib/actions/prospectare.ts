"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { telefonE164 } from "@/lib/phone";
import { revalidatePath } from "next/cache";

/**
 * Server actions sunt endpoint-uri publice: oricine afla id-ul actiunii din
 * bundle-ul JS o poate apela. Actiunile de aici trimit SMS-uri pe cheia SMSO a
 * platformei si scriu in CRM-ul comercial, deci fiecare trebuie sa verifice
 * singura ca apelantul este administrator — interfata /admin nu e o protectie.
 */
async function cereAdmin(): Promise<{ id: string; email: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Neautentificat");

  const { data: profil } = await supabase
    .from("profiles")
    .select("is_admin, email")
    .eq("id", user.id)
    .single();

  if (!profil?.is_admin) throw new Error("Acces interzis");
  return { id: user.id, email: profil.email };
}

export type StatusCrm =
  | "necontactat"
  | "contactat"
  | "interesat"
  | "client"
  | "refuzat"
  | "foloseste_alt_soft"
  | "are_soft_custom";

export type CanalContact = "sms" | "whatsapp" | "apel" | "email" | "vizita" | "telefon";

export interface CrmUpdatePayload {
  statieRarId: string;
  status: StatusCrm;
  canal?: CanalContact | null;
  note?: string | null;
}

export async function updateCrmStatus(payload: CrmUpdatePayload) {
  await cereAdmin();

  const supabase = createServiceClient();

  const { error } = await (supabase as any).from("statii_rar_crm").upsert(
    {
      statie_rar_id: payload.statieRarId,
      status: payload.status,
      canal_contact: payload.canal ?? null,
      note: payload.note ?? null,
      data_contact:
        payload.status !== "necontactat" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "statie_rar_id" }
  );

  if (error) throw new Error(error.message);
  revalidatePath("/admin/prospectare");
  return { success: true };
}

// ─── SMS Prospectare ──────────────────────────────────────────────────────────

export interface SmsSendResult {
  statieRarId: string;
  telefon: string;
  success: boolean;
  error?: string;
}

export async function sendProspectareBulkSms(
  statieIds: string[],
  mesaj: string
): Promise<{ trimise: number; erori: number; results: SmsSendResult[] }> {
  const admin = await cereAdmin();

  // Plafon de siguranta: o singura apasare nu poate declansa mii de SMS-uri.
  const LIMITA_PE_TRIMITERE = 250;
  if (statieIds.length > LIMITA_PE_TRIMITERE) {
    throw new Error(
      `Prea multe destinatii intr-o singura trimitere (${statieIds.length}). ` +
      `Maxim ${LIMITA_PE_TRIMITERE} — trimite in transe.`
    );
  }

  console.info(`[prospectare] ${admin.email} trimite ${statieIds.length} SMS-uri`);

  const apiKey = process.env.SMSO_API_KEY;
  if (!apiKey) throw new Error("SMSO_API_KEY lipsă");

  const supabase = createServiceClient();

  // Fetch phone numbers
  const { data: statii } = await (supabase as any)
    .from("statii_rar")
    .select("id, telefon")
    .in("id", statieIds);

  if (!statii?.length) return { trimise: 0, erori: 0, results: [] };

  const sender = process.env.SMSO_SENDER_NAME;
  const results: SmsSendResult[] = [];

  // Send one by one (sequential to respect rate limits)
  for (const statie of statii as { id: string; telefon: string }[]) {
    if (!statie.telefon) {
      results.push({ statieRarId: statie.id, telefon: "", success: false, error: "Fără telefon" });
      continue;
    }

    const telefon = telefonE164(statie.telefon);
    if (!telefon) {
      results.push({ statieRarId: statie.id, telefon: statie.telefon, success: false, error: "Numar invalid" });
      continue;
    }

    try {
      const payload: Record<string, string> = { to: telefon, body: mesaj };
      if (sender) payload.sender = sender;

      const res = await fetch("https://app.smso.ro/api/v1/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Authorization": apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`SMSO ${res.status}: ${err}`);
      }

      const data = await res.json();
      const smso_id = data.id ?? data.messageId ?? String(data);

      // Log
      await (supabase as any).from("prospectare_sms_log").insert({
        statie_rar_id: statie.id,
        telefon,
        mesaj,
        status: "trimis",
        smso_id,
      });

      // Update CRM status → contactat, canal → sms
      await (supabase as any).from("statii_rar_crm").upsert(
        {
          statie_rar_id: statie.id,
          status: "contactat",
          canal_contact: "sms",
          data_contact: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "statie_rar_id" }
      );

      results.push({ statieRarId: statie.id, telefon, success: true });
    } catch (err) {
      const error = (err as Error).message;
      await (supabase as any).from("prospectare_sms_log").insert({
        statie_rar_id: statie.id,
        telefon,
        mesaj,
        status: "eroare",
        eroare: error,
      });
      results.push({ statieRarId: statie.id, telefon, success: false, error });
    }
  }

  const trimise = results.filter((r) => r.success).length;
  const erori = results.filter((r) => !r.success).length;

  revalidatePath("/admin/prospectare");
  return { trimise, erori, results };
}

// Formatarea numerelor traieste in @/lib/phone.
