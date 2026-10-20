import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { fetchAll } from "@/lib/fetch-all";
import { UtilizatoriClient } from "@/components/admin/utilizatori-client";

export const metadata: Metadata = { title: "Admin - Utilizatori" };

/**
 * SMS-uri trimise luna aceasta, numărate din mesaje — și cele plătite din credit,
 * pe care sms_quota nu le numără (acolo intră doar cele incluse în plan). Pe
 * proprietar prin statii.owner_id. null dacă citirea eșuează.
 */
async function smsTrimiseLuna(supabase: ReturnType<typeof createServiceClient>, luna: string) {
  try {
    const [statii, mesaje] = await Promise.all([
      fetchAll((from, to) =>
        supabase.from("statii").select("id, owner_id").order("id", { ascending: true }).range(from, to)
      ),
      fetchAll((from, to) =>
        supabase
          .from("mesaje")
          .select("statie_id")
          .eq("tip", "sms")
          .eq("directie", "trimis")
          .in("status", ["trimis", "livrat"])
          .gte("created_at", `${luna}T00:00:00Z`) // luna în UTC, ca sms_quota
          .order("id", { ascending: true })
          .range(from, to)
      ),
    ]);
    const ownerStatie = new Map(statii.map((s) => [s.id, s.owner_id]));
    const peOwner: Record<string, number> = {};
    for (const m of mesaje) {
      const owner = ownerStatie.get(m.statie_id);
      if (owner) peOwner[owner] = (peOwner[owner] ?? 0) + 1;
    }
    return { total: mesaje.length, peOwner };
  } catch (err) {
    console.error("[admin] Nu am putut număra SMS-urile trimise din mesaje:", (err as Error).message);
    return null;
  }
}

export default async function AdminUtilizatoriPage() {
  const supabase = createServiceClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, plan, sms_credit, trial_expires_at, is_admin, suspended_at, suspend_reason, created_at")
    .order("created_at", { ascending: false });

  // Get statii count per user
  const { data: statiiCounts } = await supabase
    .from("statii")
    .select("owner_id");

  const countMap: Record<string, number> = {};
  statiiCounts?.forEach((s) => {
    countMap[s.owner_id] = (countMap[s.owner_id] ?? 0) + 1;
  });

  // Get SMS quota for current month
  const thisMonth = new Date().toISOString().substring(0, 7) + "-01";
  const { data: quotas } = await (supabase as any)
    .from("sms_quota")
    .select("profile_id, sms_trimise, sms_limita")
    .eq("luna", thisMonth);

  const quotaMap: Record<string, { trimise: number; limita: number }> = {};
  (quotas as any[])?.forEach((q: any) => {
    quotaMap[q.profile_id] = { trimise: q.sms_trimise, limita: q.sms_limita };
  });

  // SMS trimise luna aceasta: toate (incluse + din credit), din mesaje. Dacă citirea
  // eșuează, cifra din sms_quota, ca înainte. Limita rămâne cea din sms_quota.
  const trimiseLuna = await smsTrimiseLuna(supabase, thisMonth);

  const enriched = users?.map((u) => ({
    ...u,
    statiiCount: countMap[u.id] ?? 0,
    // Cel puțin cifra din sms_quota: rândurile din mesaje dispar odată cu stația ștearsă
    // (ON DELETE CASCADE) sau lipsesc dacă salvarea lor a eșuat.
    smsTrimise: trimiseLuna ? Math.max(trimiseLuna.peOwner[u.id] ?? 0, quotaMap[u.id]?.trimise ?? 0) : (quotaMap[u.id]?.trimise ?? 0),
    // Incluse în plan consumate luna aceasta (sms_quota); null = niciun rând pe luna aceasta.
    smsIncluse: quotaMap[u.id] ? quotaMap[u.id].trimise : null,
    smsLimita: quotaMap[u.id]?.limita ?? 0,
  })) ?? [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111318]">Utilizatori</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">{enriched.length} conturi înregistrate</p>
      </div>
      <UtilizatoriClient users={enriched} />
    </div>
  );
}
