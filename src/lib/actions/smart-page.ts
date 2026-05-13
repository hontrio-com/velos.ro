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
  logo_url: string | null;
  banner_url: string | null;
  galerie_urls: string[];
  sectiuni_ordine: string[];
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

export async function uploadSmartMediaAction(
  statieId: string,
  type: "logo" | "banner" | "galerie",
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const file = formData.get("file") as File;
  if (!file) return { error: "Niciun fișier selectat" };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = type === "galerie"
    ? `${user.id}/${statieId}/galerie/${Date.now()}.${ext}`
    : `${user.id}/${statieId}/${type}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("smart-page-media")
    .upload(path, file, { upsert: type !== "galerie" });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage
    .from("smart-page-media")
    .getPublicUrl(path);

  if (type === "galerie") {
    const { data: existing } = await (supabase as any)
      .from("smart_page")
      .select("galerie_urls")
      .eq("statie_id", statieId)
      .maybeSingle();
    const urls = [...(existing?.galerie_urls ?? []), publicUrl];
    await (supabase as any)
      .from("smart_page")
      .upsert({ statie_id: statieId, galerie_urls: urls }, { onConflict: "statie_id" });
  } else {
    await (supabase as any)
      .from("smart_page")
      .upsert(
        { statie_id: statieId, [type === "logo" ? "logo_url" : "banner_url"]: publicUrl },
        { onConflict: "statie_id" }
      );
  }

  return { url: publicUrl };
}

export async function deleteSmartGalerieImageAction(
  statieId: string,
  url: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();

  const { data: existing } = await (supabase as any)
    .from("smart_page")
    .select("galerie_urls")
    .eq("statie_id", statieId)
    .maybeSingle();

  const urls = (existing?.galerie_urls ?? []).filter((u: string) => u !== url);
  await (supabase as any)
    .from("smart_page")
    .upsert({ statie_id: statieId, galerie_urls: urls }, { onConflict: "statie_id" });

  // Remove from storage
  const parts = url.split("/smart-page-media/");
  if (parts[1]) {
    await supabase.storage.from("smart-page-media").remove([parts[1]]);
  }

  return { success: true };
}

export async function deleteSmartMediaAction(
  statieId: string,
  type: "logo" | "banner"
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const { data: existing } = await (supabase as any)
    .from("smart_page")
    .select(type === "logo" ? "logo_url" : "banner_url")
    .eq("statie_id", statieId)
    .maybeSingle();

  const currentUrl = type === "logo" ? existing?.logo_url : existing?.banner_url;
  if (currentUrl) {
    const parts = currentUrl.split("/smart-page-media/");
    if (parts[1]) {
      await supabase.storage.from("smart-page-media").remove([parts[1]]);
    }
  }

  await (supabase as any)
    .from("smart_page")
    .upsert(
      { statie_id: statieId, [type === "logo" ? "logo_url" : "banner_url"]: null },
      { onConflict: "statie_id" }
    );

  return { success: true };
}
