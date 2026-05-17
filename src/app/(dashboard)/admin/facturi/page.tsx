import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { PageTransition } from "@/components/layout/page-transition";
import { FacturiAdminClient } from "@/components/admin/facturi/facturi-admin-client";

export const metadata: Metadata = { title: "Admin — Facturi SmartBill" };

export default async function AdminFacturiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verifică is_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!(profile as any)?.is_admin) redirect("/dashboard");

  const serviceClient = createServiceClient();

  // Toate facturile cu date utilizator
  const { data: facturi } = await (serviceClient as any)
    .from("facturi")
    .select("*, profiles(email, full_name)")
    .order("created_at", { ascending: false });

  const rows = (facturi ?? []) as FacturaRow[];

  // KPI stats
  const total = rows.length;
  const emise = rows.filter((r) => !r.eroare).length;
  const erori = rows.filter((r) => !!r.eroare).length;

  const acumLuna = new Date();
  acumLuna.setDate(1);
  acumLuna.setHours(0, 0, 0, 0);

  const lunaRows = rows.filter((r) => new Date(r.created_at) >= acumLuna);
  const sumaLunaRON = lunaRows
    .filter((r) => !r.eroare && r.moneda === "RON")
    .reduce((s, r) => s + Number(r.suma), 0);
  const sumaLunaEUR = lunaRows
    .filter((r) => !r.eroare && r.moneda === "EUR")
    .reduce((s, r) => s + Number(r.suma), 0);

  return (
    <PageTransition>
      <div className="space-y-6">
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
            <div className="mt-1 space-y-0.5">
              {sumaLunaRON > 0 && (
                <p className="text-lg font-bold text-[#111318]">
                  {sumaLunaRON.toFixed(2)} RON
                </p>
              )}
              {sumaLunaEUR > 0 && (
                <p className="text-lg font-bold text-[#111318]">
                  {sumaLunaEUR.toFixed(2)} EUR
                </p>
              )}
              {sumaLunaRON === 0 && sumaLunaEUR === 0 && (
                <p className="text-lg font-bold text-[#9CA3AF]">—</p>
              )}
            </div>
          </div>
        </div>

        <FacturiAdminClient rows={rows} />
      </div>
    </PageTransition>
  );
}

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
