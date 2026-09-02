import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getStatieForUser } from "@/lib/get-user-statie";
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
import { CalendarProgramari } from "@/components/dashboard/calendar-programari";
import { ExpirareCurande } from "@/components/dashboard/expirare-curande";
import { GraficLunar, type ZiData } from "@/components/dashboard/grafic-lunar";
import { ActivitateRecenta } from "@/components/dashboard/activitate-recenta";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { SmartPageWidget } from "@/components/dashboard/smart-page-widget";
import { SmartPageBanner } from "@/components/dashboard/smart-page-banner";
import { FadeUp } from "@/components/layout/fade-up";
import { createServiceClient } from "@/lib/supabase/service";

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

  const [profileResult, statie] = await Promise.all([
    (supabase as any).from("profiles").select("full_name, role").eq("id", user.id).single(),
    getStatieForUser(),
  ]);
  const profile = profileResult?.data as { full_name: string | null; role: string } | null;

  if (!statie) {
    // Employees without a station should be signed out (deactivated/removed)
    if ((profile as any)?.role === "angajat") {
      await supabase.auth.signOut();
      redirect("/login");
    }
    redirect("/setari/statii/noua");
  }

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
        "id, ora_start, ora_sfarsit, status, tip_serviciu, client:clienti(id,nume,prenume,telefon), vehicul:vehicule(id,nr_inmatriculare,marca,model), rezultate_itp(rezultat)"
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

  // Smart Page stats
  const svc = createServiceClient();
  const now = new Date();
  const ago7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const ago30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const todayStr = now.toISOString().slice(0, 10);

  const [smartPageResult, smartViewsResult] = await Promise.all([
    (svc as any).from("smart_page").select("id").eq("statie_id", statie.id).maybeSingle(),
    (svc as any).from("smart_page_views").select("viewed_at").eq("statie_id", statie.id).gte("viewed_at", ago30).order("viewed_at", { ascending: true }),
  ]);

  const hasSmartPage = !!smartPageResult?.data;
  const smartViews = (smartViewsResult?.data ?? []) as { viewed_at: string }[];

  const smartTotalToday = smartViews.filter((r) => r.viewed_at.slice(0, 10) === todayStr).length;
  const smartTotal7d = smartViews.filter((r) => r.viewed_at >= ago7).length;
  const smartTotal30d = smartViews.length;

  // Build last 7 days sparkline
  const smartByDay7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    return { date: dateStr, views: smartViews.filter((r) => r.viewed_at.slice(0, 10) === dateStr).length };
  });

  // Compute KPI values
  const programariAzi = programariAziResult.data ?? [];
  const programariAziCount = programariAzi.length;
  const finalizateAziArr = finalizateAziResult.data ?? [];
  const finalizateAziCount = finalizateAziArr.length;

  // Venitul contorizează toate programările active (nu anulate/neprezent)
  const contorizeazaVenit = (s: string) => s !== "anulat" && s !== "neprezent";

  // Luna curentă stats
  const programariLuna = programariLunaResult.data ?? [];
  const venitLuna = programariLuna
    .filter((p) => contorizeazaVenit(p.status))
    .reduce((s, p) => s + Number(p.pret ?? 0), 0);
  const finalizateLuna = programariLuna.filter((p) => p.status === "finalizat").length;

  // Luna trecută stats
  const programariLunaPre = programariLunaPreResult.data ?? [];
  const venitLunaPre = programariLunaPre
    .filter((p) => contorizeazaVenit(p.status))
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
        .filter((p) => contorizeazaVenit(p.status))
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
          {dataAziCap} · {statie.nume}
        </p>
      </FadeUp>

      {/* Banner Smart Page / Programări */}
      {hasSmartPage && statie.slug && (
        <FadeUp delay={0.08}>
          <SmartPageBanner slug={statie.slug} />
        </FadeUp>
      )}

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

      {/* Calendar programări — vezi programările existente și fă altele noi */}
      <FadeUp delay={0.26}>
        <CalendarProgramari statieId={statie.id} />
      </FadeUp>

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

        <div className="flex flex-col gap-6">
          {hasSmartPage && statie.slug && (
            <FadeUp delay={0.52}>
              <SmartPageWidget
                slug={statie.slug}
                totalToday={smartTotalToday}
                total7d={smartTotal7d}
                total30d={smartTotal30d}
                byDay7={smartByDay7}
              />
            </FadeUp>
          )}

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
      </div>

      <QuickActions statieId={statie.id} />
    </div>
  );
}
