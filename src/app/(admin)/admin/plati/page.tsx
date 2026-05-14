import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { PlatiAdminClient } from "@/components/admin/plati-admin-client";

export const metadata: Metadata = { title: "Admin - Plăți SMS" };

export default async function AdminPlatiPage() {
  const supabase = createServiceClient();

  const { data: payments } = await (supabase as any)
    .from("sms_purchases")
    .select(`
      id, profile_id, stripe_session_id, stripe_payment_intent,
      cantitate, pret_total, status, completed_at, created_at,
      profiles!profile_id(id, email, full_name)
    `)
    .order("created_at", { ascending: false });

  const normalized = (payments as any[])?.map((p: any) => ({
    ...p,
    profile: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
  })) ?? [];

  const totalRevenue = normalized
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.pret_total ?? 0), 0);

  const totalSms = normalized
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + (p.cantitate ?? 0), 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111318]">Plăți SMS</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          {normalized.length} tranzacții — total €{totalRevenue.toFixed(2)} ({totalSms.toLocaleString("ro-RO")} SMS)
        </p>
      </div>
      <PlatiAdminClient payments={normalized} />
    </div>
  );
}
