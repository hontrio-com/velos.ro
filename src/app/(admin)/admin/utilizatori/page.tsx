import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { UtilizatoriClient } from "@/components/admin/utilizatori-client";

export const metadata: Metadata = { title: "Admin - Utilizatori" };

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

  const enriched = users?.map((u) => ({
    ...u,
    statiiCount: countMap[u.id] ?? 0,
    smsTrimise: quotaMap[u.id]?.trimise ?? 0,
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
