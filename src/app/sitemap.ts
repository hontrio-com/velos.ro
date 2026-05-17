import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient();

  // Get all active smart pages
  const { data: smartPages } = await (supabase as any)
    .from("smart_page")
    .select("statie_id, updated_at")
    .eq("activa", true);

  if (!smartPages || smartPages.length === 0) return [];

  const statieIds = (smartPages as { statie_id: string; updated_at: string | null }[]).map((p) => p.statie_id);

  const { data: statii } = await supabase
    .from("statii")
    .select("id, slug")
    .in("id", statieIds)
    .eq("activa", true);

  if (!statii) return [];

  const smartMap = new Map(
    (smartPages as { statie_id: string; updated_at: string | null }[]).map((p) => [p.statie_id, p.updated_at])
  );

  return statii.map((s) => ({
    url: `https://velos.ro/${s.slug}`,
    lastModified: new Date(smartMap.get(s.id) ?? Date.now()),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
}
