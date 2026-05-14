import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { SmsAdminClient } from "@/components/admin/sms-admin-client";

export const metadata: Metadata = { title: "Admin - SMS Quota" };

export default async function AdminSmsPage() {
  const supabase = createServiceClient();
  const thisMonth = new Date().toISOString().substring(0, 7) + "-01";

  const [{ data: profiles }, { data: quotas }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, plan, sms_credit, trial_expires_at")
      .order("email"),
    (supabase as any)
      .from("sms_quota")
      .select("profile_id, sms_trimise, sms_limita, luna")
      .eq("luna", thisMonth),
  ]);

  const quotaMap: Record<string, { trimise: number; limita: number }> = {};
  (quotas as any[])?.forEach((q: any) => {
    quotaMap[q.profile_id] = { trimise: q.sms_trimise, limita: q.sms_limita };
  });

  const enriched = profiles?.map((p) => ({
    ...p,
    smsTrimise: quotaMap[p.id]?.trimise ?? 0,
    smsLimita: quotaMap[p.id]?.limita ?? 0,
  })) ?? [];

  const totalTrimise = enriched.reduce((sum, p) => sum + p.smsTrimise, 0);
  const totalCredit = enriched.reduce((sum, p) => sum + (p.sms_credit ?? 0), 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111318]">SMS Quota</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          {totalTrimise.toLocaleString("ro-RO")} SMS trimise luna aceasta · {totalCredit.toLocaleString("ro-RO")} credite cumpărate în total
        </p>
      </div>
      <SmsAdminClient users={enriched} />
    </div>
  );
}
