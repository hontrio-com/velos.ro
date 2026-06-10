"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

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

  const { data: { publicUrl: rawUrl } } = supabase.storage
    .from("smart-page-media")
    .getPublicUrl(path);

  // Add cache-buster so browsers don't show stale versions after re-upload
  const publicUrl = type === "galerie"
    ? rawUrl
    : `${rawUrl}?v=${Date.now()}`;

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

// ── Analytics ─────────────────────────────────────────────────────────────────

export type SmartPageDayStat = { date: string; views: number };
export type SmartPageSourceStat = { source: string; views: number };
export type SmartPageDeviceStat = { device: string; views: number };

export type SmartPageStats = {
  totalAllTime: number;
  total30d: number;
  total7d: number;
  totalToday: number;
  byDay: SmartPageDayStat[];
  bySource: SmartPageSourceStat[];
  byDevice: SmartPageDeviceStat[];
};

export async function getSmartPageStatsAction(
  statieId: string
): Promise<SmartPageStats | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  // Verify ownership
  const { data: statie } = await supabase
    .from("statii")
    .select("id")
    .eq("id", statieId)
    .eq("owner_id", user.id)
    .single();
  if (!statie) return { error: "Acces interzis" };

  const svc = createServiceClient();

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const ago7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const ago30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // All-time count
  const { count: totalAllTime } = await (svc as any)
    .from("smart_page_views")
    .select("id", { count: "exact", head: true })
    .eq("statie_id", statieId);

  // Last 30 days rows (for all other aggregations)
  const { data: rows30 } = await (svc as any)
    .from("smart_page_views")
    .select("viewed_at, source, device")
    .eq("statie_id", statieId)
    .gte("viewed_at", ago30)
    .order("viewed_at", { ascending: true });

  const all = (rows30 ?? []) as { viewed_at: string; source: string; device: string }[];

  // Aggregate: by day (last 30 days)
  const dayMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dayMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of all) {
    const day = r.viewed_at.slice(0, 10);
    if (dayMap.has(day)) dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }
  const byDay: SmartPageDayStat[] = Array.from(dayMap.entries()).map(([date, views]) => ({ date, views }));

  // Aggregate: by source
  const sourceMap = new Map<string, number>();
  for (const r of all) {
    sourceMap.set(r.source, (sourceMap.get(r.source) ?? 0) + 1);
  }
  const bySource: SmartPageSourceStat[] = Array.from(sourceMap.entries())
    .map(([source, views]) => ({ source, views }))
    .sort((a, b) => b.views - a.views);

  // Aggregate: by device
  const deviceMap = new Map<string, number>();
  for (const r of all) {
    deviceMap.set(r.device, (deviceMap.get(r.device) ?? 0) + 1);
  }
  const byDevice: SmartPageDeviceStat[] = Array.from(deviceMap.entries())
    .map(([device, views]) => ({ device, views }))
    .sort((a, b) => b.views - a.views);

  // Period counts
  const total30d = all.length;
  const total7d = all.filter((r) => r.viewed_at >= ago7).length;
  const totalToday = all.filter((r) => r.viewed_at.slice(0, 10) === todayStr).length;

  return {
    totalAllTime: totalAllTime ?? 0,
    total30d,
    total7d,
    totalToday,
    byDay,
    bySource,
    byDevice,
  };
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
