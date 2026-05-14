import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { StatiiAdminClient } from "@/components/admin/statii-admin-client";

export const metadata: Metadata = { title: "Admin - Stații" };

export default async function AdminStatiiPage() {
  const supabase = createServiceClient();

  const { data: statii } = await (supabase as any)
    .from("statii")
    .select(`
      id, nume, slug, oras, judet, activa, booking_activ, created_at,
      profiles!owner_id(id, email, full_name)
    `)
    .order("created_at", { ascending: false });

  const normalized = statii?.map((s) => ({
    ...s,
    owner: Array.isArray(s.profiles) ? s.profiles[0] : s.profiles,
  })) ?? [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111318]">Stații ITP</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">{normalized.length} stații înregistrate</p>
      </div>
      <StatiiAdminClient statii={normalized} />
    </div>
  );
}
