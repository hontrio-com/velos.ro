"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export type StatusCrm =
  | "necontactat"
  | "contactat"
  | "interesat"
  | "client"
  | "refuzat"
  | "foloseste_alt_soft"
  | "are_soft_custom";

export type CanalContact = "telefon" | "email" | "whatsapp" | "vizita";

export interface CrmUpdatePayload {
  statieRarId: string;
  status: StatusCrm;
  canal?: CanalContact | null;
  note?: string | null;
}

export async function updateCrmStatus(payload: CrmUpdatePayload) {
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
