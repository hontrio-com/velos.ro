import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClientiTable } from "@/components/clienti/clienti-table";
import type { ClientRow } from "@/components/clienti/clienti-columns";
import { FadeUp } from "@/components/layout/fade-up";

export const metadata: Metadata = { title: "Clienți" };

export default async function ClientiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: statie } = await supabase
    .from("statii")
    .select("id, nume")
    .eq("owner_id", user.id)
    .eq("activa", true)
    .order("created_at")
    .limit(1)
    .single();

  if (!statie) redirect("/setari");

  // Fetch clients with aggregate data
  const { data: clientiRaw } = await supabase
    .from("clienti")
    .select(`
      id, statie_id, nume, prenume, telefon, email, sms_optin, created_at,
      vehicule!client_id(id),
      programari!client_id(id, status, pret, data_programare, statie_id)
    `)
    .eq("statie_id", statie.id)
    .order("created_at", { ascending: false });

  const clienti: ClientRow[] = (clientiRaw ?? []).map((c) => {
    const vehicule = Array.isArray(c.vehicule) ? c.vehicule : [];
    const programari = (Array.isArray(c.programari) ? c.programari : []).filter(
      (p) => p.statie_id === statie.id
    );

    const nr_programari = programari.length;
    const total_cheltuit = programari
      .filter((p) => p.status === "finalizat")
      .reduce((s: number, p) => s + Number(p.pret ?? 0), 0);
    const dateProg = programari
      .map((p) => p.data_programare)
      .filter(Boolean)
      .sort()
      .reverse();
    const ultima_programare = dateProg[0] ?? null;

    return {
      id: c.id,
      statie_id: c.statie_id,
      nume: c.nume,
      prenume: c.prenume,
      telefon: c.telefon,
      email: c.email,
      sms_optin: c.sms_optin ?? true,
      created_at: c.created_at,
      nr_vehicule: vehicule.length,
      nr_programari,
      ultima_programare,
      total_cheltuit,
    };
  });

  // KPI stats
  const totalClienti = clienti.length;
  const lunaStart = new Date();
  lunaStart.setDate(1);
  const lunaStartStr = lunaStart.toISOString().split("T")[0];
  const activiLuna = clienti.filter((c) => c.ultima_programare && c.ultima_programare >= lunaStartStr).length;
  const cuSms = clienti.filter((c) => c.sms_optin).length;
  const pctSms = totalClienti > 0 ? Math.round((cuSms / totalClienti) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeUp delay={0}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-[#111318] tracking-tight">Clienți</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">
              {totalClienti} clienți
            </span>
          </div>
        </div>
      </FadeUp>

      {/* KPI cards */}
      <FadeUp delay={0.06}>
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: totalClienti, label: "Total clienți" },
            { value: activiLuna, label: "Activi luna curentă" },
            { value: `${pctSms}%`, label: "Cu SMS activ" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-white border border-[#F3F4F6] rounded-xl p-4">
              <p className="text-2xl font-semibold text-[#111318] leading-none">{value}</p>
              <p className="text-xs text-[#6B7280] mt-1">{label}</p>
            </div>
          ))}
        </div>
      </FadeUp>

      {/* Table */}
      <FadeUp delay={0.12}>
        <ClientiTable data={clienti} statieId={statie.id} />
      </FadeUp>
    </div>
  );
}
