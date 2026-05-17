import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { FacturiAdminClient } from "@/components/admin/facturi/facturi-admin-client";

export const metadata: Metadata = { title: "Admin — Facturi SmartBill" };

export interface FacturaRow {
  id: string;
  profile_id: string;
  tip: "sms_purchase" | "subscription_new" | "subscription_renewal";
  referinta: string;
  smartbill_serie: string | null;
  smartbill_numar: string | null;
  suma: number;
  moneda: string;
  eroare: string | null;
  created_at: string;
  profiles: { email: string; full_name: string | null } | null;
}

export default async function AdminFacturiPage() {
  const supabase = createServiceClient();

  const { data: facturi } = await (supabase as any)
    .from("facturi")
    .select("*, profiles(email, full_name)")
    .order("created_at", { ascending: false });

  const rows = (facturi ?? []) as FacturaRow[];

  const total = rows.length;
  const emise = rows.filter((r) => !r.eroare).length;
  const erori = rows.filter((r) => !!r.eroare).length;

  const acumLuna = new Date();
  acumLuna.setDate(1);
  acumLuna.setHours(0, 0, 0, 0);

  const lunaRows = rows.filter((r) => new Date(r.created_at) >= acumLuna && !r.eroare);
  const sumaLunaRON = lunaRows.filter((r) => r.moneda === "RON").reduce((s, r) => s + Number(r.suma), 0);
  const sumaLunaEUR = lunaRows.filter((r) => r.moneda === "EUR").reduce((s, r) => s + Number(r.suma), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#111318]">Facturi SmartBill</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Toate facturile emise automat prin integrarea SmartBill
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <p className="text-xs text-[#6B7280] font-medium">Total facturi</p>
          <p className="text-2xl font-bold text-[#111318] mt-1">{total}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <p className="text-xs text-[#059669] font-medium">Emise cu succes</p>
          <p className="text-2xl font-bold text-[#059669] mt-1">{emise}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <p className="text-xs text-[#DC2626] font-medium">Erori</p>
          <p className="text-2xl font-bold text-[#DC2626] mt-1">{erori}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <p className="text-xs text-[#6B7280] font-medium">Valoare luna curentă</p>
          <div className="mt-1">
            {sumaLunaRON > 0 && (
              <p className="text-lg font-bold text-[#111318]">{sumaLunaRON.toFixed(2)} RON</p>
            )}
            {sumaLunaEUR > 0 && (
              <p className="text-lg font-bold text-[#111318]">{sumaLunaEUR.toFixed(2)} EUR</p>
            )}
            {sumaLunaRON === 0 && sumaLunaEUR === 0 && (
              <p className="text-lg font-bold text-[#9CA3AF]">—</p>
            )}
          </div>
        </div>
      </div>

      <FacturiAdminClient rows={rows} />
    </div>
  );
}
