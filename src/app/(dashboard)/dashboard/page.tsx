import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  getDaysInMonth,
} from "date-fns";
import { ro } from "date-fns/locale";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { ProgramariAzi } from "@/components/dashboard/programari-azi";
import { ExpirareCurande } from "@/components/dashboard/expirare-curande";
import { GraficLunar, type ZiData } from "@/components/dashboard/grafic-lunar";
import { ActivitateRecenta } from "@/components/dashboard/activitate-recenta";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { FadeUp } from "@/components/layout/fade-up";

export const metadata: Metadata = { title: "Dashboard" };

function getGreeting(name: string | null | undefined): string {
  const hour = new Date().getHours();
  const firstName = name?.split(" ")[0] ?? null;
  const salut =
    hour >= 5 && hour < 12
      ? "Bună dimineața"
      : hour >= 12 && hour < 18
        ? "Bună ziua"
        : hour >= 18 && hour < 22
          ? "Bună seara"
          : "Noapte bună";
  return firstName ? `${salut}, ${firstName}!` : `${salut}!`;
}

function calcTrend(current: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((current - prev) / prev) * 100);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: statie } = await supabase
    .from("statii")
    .select("id, nume")
    .eq("owner_id", user.id)
    .eq("activa", true)
    .order("created_at")
    .limit(1)
    .single();

  if (!statie) redirect("/setari/statii/noua");

  const azi = format(new Date(), "yyyy-MM-dd");
  const ieri = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
  const lunaStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const lunaEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const lunaPreStart = format(startOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd");
  const lunaPreEnd = format(endOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd");
  const in30 = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
  const lunaLabel = format(new Date(), "MMMM yyyy", { locale: ro });
  const lunaLabelCap = lunaLabel.charAt(0).toUpperCase() + lunaLabel.slice(1);
  const dataAzi = format(new Date(), "EEEE, d MMMM yyyy", { locale: ro });
  const dataAziCap = dataAzi.charAt(0).toUpperCase() + dataAzi.slice(1);

  const [
    programariAziResult,
    finalizateAziResult,
    finalizateIeriResult,
    programariIeriResult,
    remindereResult,
    vehiculeExpiraResult,
    vehiculeExpirateResult,
    programariLunaResult,
    programariLunaPreResult,
    activitateResult,
  ] = await Promise.all([
    supabase
      .from("programari")
      .select(
        "id, ora_start, ora_sfarsit, status, tip_serviciu, client:clienti(id,nume,prenume,telefon), vehicul:vehicule(id,nr_inmatriculare,marca,model)"
      )
      .eq("statie_id", statie.id)
      .eq("data_programare", azi)
      .order("ora_start"),

    supabase
      .from("programari")
      .select("pret")
      .eq("statie_id", statie.id)
      .eq("data_programare", azi)
      .eq("status", "finalizat"),

    supabase
      .from("programari")
      .select("id", { count: "exact", head: true })
      .eq("statie_id", statie.id)
      .eq("data_programare", ieri)
      .eq("status", "finalizat"),

    supabase
      .from("programari")
      .select("id", { count: "exact", head: true })
      .eq("statie_id", statie.id)
      .eq("data_programare", ieri),

    supabase
      .from("remindere")
      .select("id", { count: "exact", head: true })
      .eq("statie_id", statie.id)
      .eq("data_trimitere", azi)
      .eq("trimis", false),

    supabase
      .from("vehicule")
      .select(
        "id, nr_inmatriculare, marca, model, expirare_itp, client:clienti(id,nume,prenume,telefon)"
      )
      .eq("statie_id", statie.id)
      .gte("expirare_itp", azi)
      .lte("expirare_itp", in30)
      .order("expirare_itp")
      .limit(8),

    supabase
      .from("vehicule")
      .select(
        "id, nr_inmatriculare, marca, model, expirare_itp, client:clienti(id,nume,prenume,telefon)"
      )
      .eq("statie_id", statie.id)
      .not("expirare_itp", "is", null)
      .lt("expirare_itp", azi)
      .order("expirare_itp", { ascending: false })
      .limit(5),

    supabase
      .from("programari")
      .select("data_programare, status, pret")
      .eq("statie_id", statie.id)
      .gte("data_programare", lunaStart)
      .lte("data_programare", lunaEnd),

    supabase
      .from("programari")
      .select("status, pret")
      .eq("statie_id", statie.id)
      .gte("data_programare", lunaPreStart)
      .lte("data_programare", lunaPreEnd),

    supabase
      .from("programari")
      .select(
        "id, status, updated_at, client:clienti(nume, prenume), vehicul:vehicule(nr_inmatriculare)"
      )
      .eq("statie_id", statie.id)
      .order("updated_at", { ascending: false })
      .limit(8),
  ]);

  // Compute KPI values
  const programariAzi = programariAziResult.data ?? [];
  const programariAziCount = programariAzi.length;
  const finalizateAziArr = finalizateAziResult.data ?? [];
  const finalizateAziCount = finalizateAziArr.length;

  // Luna curentă stats
  const programariLuna = programariLunaResult.data ?? [];
  const venitLuna = programariLuna
    .filter((p) => p.status === "finalizat")
    .reduce((s, p) => s + Number(p.pret ?? 0), 0);
  const finalizateLuna = programariLuna.filter((p) => p.status === "finalizat").length;

  // Luna trecută stats
  const programariLunaPre = programariLunaPreResult.data ?? [];
  const venitLunaPre = programariLunaPre
    .filter((p) => p.status === "finalizat")
    .reduce((s, p) => s + Number(p.pret ?? 0), 0);
  const finalizateLunaPre = programariLunaPre
    .filter((p) => p.status === "finalizat").length;

  // Trends
  const trendProgramari = calcTrend(
    programariAziCount,
    programariIeriResult.count ?? 0
  );
  const trendFinalizate = calcTrend(
    finalizateAziCount,
    finalizateIeriResult.count ?? 0
  );
  const trendVenit = calcTrend(venitLuna, venitLunaPre);

  // Grafic lunar: one entry per day of month
  const daysInMonth = getDaysInMonth(new Date());
  const monthStr = format(new Date(), "yyyy-MM");
  const graficData: ZiData[] = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateKey = `${monthStr}-${String(dayNum).padStart(2, "0")}`;
    const rows = programariLuna.filter((p) => p.data_programare === dateKey);
    return {
      zi: String(dayNum),
      programari: rows.length,
      finalizate: rows.filter((p) => p.status === "finalizat").length,
      venit: rows
        .filter((p) => p.status === "finalizat")
        .reduce((s, p) => s + Number(p.pret ?? 0), 0),
    };
  });

  // Rezumat lună
  const totalLuna = programariLuna.length;
  const anulateLuna = programariLuna.filter((p) => p.status === "anulat").length;
  const neprezentLuna = programariLuna.filter((p) => p.status === "neprezent").length;
  const rataSucces =
    totalLuna - anulateLuna > 0
      ? Math.round((finalizateLuna / (totalLuna - anulateLuna)) * 100)
      : 0;

  // Normalize activitate data (Supabase returns object or array for relations)
  type RawActivitate = {
    id: string;
    status: string;
    updated_at: string;
    client: { nume: string; prenume: string | null } | { nume: string; prenume: string | null }[] | null;
    vehicul: { nr_inmatriculare: string } | { nr_inmatriculare: string }[] | null;
  };

  const activitate = (activitateResult.data ?? []).map((item: RawActivitate) => ({
    id: item.id,
    status: item.status,
    updated_at: item.updated_at,
    client: Array.isArray(item.client)
      ? (item.client[0] ?? null)
      : item.client,
    vehicul: Array.isArray(item.vehicul)
      ? (item.vehicul[0] ?? null)
      : item.vehicul,
  }));

  return (
    <div className="space-y-6">
      {/* Salut */}
      <FadeUp delay={0}>
        <h1 className="text-xl font-semibold text-[#111318] tracking-tight">
          {getGreeting(profile?.full_name)}
        </h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          {dataAziCap} — {statie.nume}
        </p>
      </FadeUp>

      {/* KPI Cards */}
      <KpiCards
        programariAzi={programariAziCount}
        finalizateAzi={finalizateAziCount}
        venitLuna={venitLuna}
        remindereAzi={remindereResult.count ?? 0}
        trendProgramari={trendProgramari}
        trendFinalizate={trendFinalizate}
        trendVenit={trendVenit}
        lunaCurenta={lunaLabelCap}
      />

      {/* Programări azi + ITP atenție */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <FadeUp delay={0.32} className="xl:col-span-3">
          <ProgramariAzi programari={programariAzi} />
        </FadeUp>
        <FadeUp delay={0.38} className="xl:col-span-2">
          <ExpirareCurande
            vehiculeExpira={vehiculeExpiraResult.data ?? []}
            vehiculeExpirate={vehiculeExpirateResult.data ?? []}
          />
        </FadeUp>
      </div>

      {/* Grafic lunar */}
      <FadeUp delay={0.44}>
        <GraficLunar data={graficData} lunaLabel={lunaLabelCap} />
      </FadeUp>

      {/* Activitate + rezumat */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <FadeUp delay={0.5}>
          <ActivitateRecenta items={activitate} />
        </FadeUp>

        <FadeUp delay={0.54}>
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 h-full">
            <p className="text-base font-semibold text-[#111318] mb-4">
              Rezumat {lunaLabelCap}
            </p>
            <div className="grid grid-cols-2 gap-px bg-[#F7F8FA] rounded-lg overflow-hidden border border-[#E5E7EB]">
              {[
                { label: "Programate", value: totalLuna },
                { label: "Finalizate", value: finalizateLuna },
                { label: "No-show", value: neprezentLuna },
                { label: "Rată succes", value: `${rataSucces}%` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white px-4 py-4">
                  <p className="text-2xl font-semibold text-[#111318] leading-none mb-1">
                    {value}
                  </p>
                  <p className="text-[11px] text-[#6B7280] font-medium">{label}</p>
                </div>
              ))}
            </div>
            {finalizateLunaPre > 0 && (
              <p className="text-xs text-[#9CA3AF] mt-3 text-center">
                Luna trecută: {finalizateLunaPre} finalizate ·{" "}
                {venitLunaPre.toLocaleString("ro-RO")} RON
              </p>
            )}
          </div>
        </FadeUp>
      </div>

      <QuickActions statieId={statie.id} />
    </div>
  );
}
