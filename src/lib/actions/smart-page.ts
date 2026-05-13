"use server";

import { createClient } from "@/lib/supabase/server";

export type SmartServicii = {
  id: string;
  nume: string;
  pret?: number;
  durata?: number;
  descriere?: string;
};

export type ChatbotQA = {
  id: string;
  intrebare: string;
  raspuns: string;
};

export type SmartPageData = {
  id: string;
  statie_id: string;
  activa: boolean;
  culoare_primara: string;
  whatsapp_nr: string | null;
  tagline: string | null;
  galerie_urls: string[];
  servicii: SmartServicii[];
  chatbot_qa: ChatbotQA[];
  seo_description: string | null;
};

export async function getSmartPageAction(statieId: string): Promise<SmartPageData | null> {
  const supabase = await createClient();
  const { data } = await (supabase as any)
    .from("smart_page")
    .select("*")
    .eq("statie_id", statieId)
    .maybeSingle();
  return data as SmartPageData | null;
}

export async function upsertSmartPageAction(
  statieId: string,
  update: Partial<Omit<SmartPageData, "id" | "statie_id">>
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await (supabase as any)
    .from("smart_page")
    .upsert({ statie_id: statieId, ...update }, { onConflict: "statie_id" });
  if (error) return { error: error.message };
  return { success: true };
}
