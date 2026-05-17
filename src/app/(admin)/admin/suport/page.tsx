import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { SuportAdminClient } from "@/components/admin/suport/suport-admin-client";
import type { Tichet } from "@/lib/actions/ajutor";

export const metadata: Metadata = { title: "Admin — Suport" };

export default async function AdminSuportPage() {
  const supabase = createServiceClient();

  const { data: tichete } = await (supabase as any)
    .from("tichete")
    .select("*, profiles(email, full_name)")
    .order("updated_at", { ascending: false });

  const rows = (tichete ?? []) as Tichet[];

  const total = rows.length;
  const deschise = rows.filter((r) => r.status === "deschis").length;
  const inLucru = rows.filter((r) => r.status === "in_lucru").length;
  const rezolvate = rows.filter((r) => r.status === "rezolvat").length;
  const urgente = rows.filter((r) => r.prioritate === "urgenta" && r.status !== "inchis").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#111318]">Suport & Tichete</h1>
        <p className="text-sm text-[#6B7280] mt-1">Gestionează solicitările utilizatorilor</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <p className="text-xs text-[#6B7280] font-medium">Total</p>
          <p className="text-2xl font-bold text-[#111318] mt-1">{total}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <p className="text-xs text-[#1877F2] font-medium">Deschise</p>
          <p className="text-2xl font-bold text-[#1877F2] mt-1">{deschise}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <p className="text-xs text-[#D97706] font-medium">În lucru</p>
          <p className="text-2xl font-bold text-[#D97706] mt-1">{inLucru}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <p className="text-xs text-[#059669] font-medium">Rezolvate</p>
          <p className="text-2xl font-bold text-[#059669] mt-1">{rezolvate}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <p className="text-xs text-[#DC2626] font-medium">Urgente</p>
          <p className="text-2xl font-bold text-[#DC2626] mt-1">{urgente}</p>
        </div>
      </div>

      <SuportAdminClient rows={rows} />
    </div>
  );
}
