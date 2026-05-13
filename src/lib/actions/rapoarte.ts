"use server";

import { createClient } from "@/lib/supabase/server";
import { format, parseISO, differenceInDays, subDays } from "date-fns";

// ─── Helpers ──────────────────────────────────────────────────

function getPrevRange(from: string, to: string) {
  const f = parseISO(from);
  const t = parseISO(to);
  const days = differenceInDays(t, f) + 1;
  const prevTo = subDays(f, 1);
  const prevFrom = subDays(prevTo, days - 1);
  return { from: format(prevFrom, "yyyy-MM-dd"), to: format(prevTo, "yyyy-MM-dd") };
}

function calcTrend(current: number, prev: number): number {
  if (prev === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prev) / prev) * 100);
}

// ─── Types ────────────────────────────────────────────────────

export interface ZiFinanciar {
  data: string;
  total: number;
  finalizate: number;
  venit: number;
}

export interface TipVehiculStat {
  tip: string;
  nr: number;
  venit: number;
  pret_mediu: number;
}

export interface KpiFinanciar {
  venit_total: number;
  itp_platite: number;
  pret_mediu: number;
  rata_colectare: number;
  trend_venit: number;
  trend_itp: number;
}

export interface RaportFinanciar {
  zilnic: ZiFinanciar[];
  tipVehicul: TipVehiculStat[];
  kpi: KpiFinanciar;
}

export interface ZiProgramari {
  data: string;
  total: number;
  finalizate: number;
  neprezent: number;
  anulate: number;
  venit: number;
  rata: number;
}

export interface StatusDist {
  status: string;
  label: string;
  count: number;
  color: string;
}

export interface KpiProgramari {
  total: number;
  finalizate: number;
  neprezent: number;
  rata_prezenta: number;
  trend_total: number;
  trend_finalizate: number;
}

export interface RaportProgramari {
  zilnic: ZiProgramari[];
  statusDist: StatusDist[];
  kpi: KpiProgramari;
}

export interface RezultatStat {
  rezultat: string;
  label: string;
  count: number;
  color: string;
}

export interface ItpListItem {
  id: string;
  data_inspectie: string;
  data_programare: string;
  vehicul: string;
  client: string;
  rezultat: string;
  inspector: string | null;
}

export interface KpiItp {
  total: number;
  admise: number;
  respinse: number;
  rata_admitere: number;
  trend_total: number;
}

export interface RaportItp {
  rezultate: RezultatStat[];
  lista: ItpListItem[];
  kpi: KpiItp;
}

export interface ZiSms {
  data: string;
  total: number;
  livrate: number;
  erori: number;
}

export interface TipReminderStat {
  tip: string;
  label: string;
  count: number;
}

export interface QuotaLuna {
  luna: string;
  trimise: number;
  limita: number;
}

export interface SmsListItem {
  id: string;
  created_at: string;
  client: string;
  telefon: string;
  mesaj: string;
  status: string;
}

export interface KpiSms {
  total: number;
  livrate: number;
  erori: number;
  rata_livrare: number;
}

export interface RaportSms {
  zilnic: ZiSms[];
  tipDist: TipReminderStat[];
  quotaHistory: QuotaLuna[];
  lista: SmsListItem[];
  kpi: KpiSms;
  quota: { trimise: number; limita: number; ramase: number } | null;
}

export interface AngajatRow {
  id: string;
  nume: string;
  functie: string | null;
  email: string | null;
  telefon: string | null;
  activ: boolean;
  programari_total: number;
  programari_finalizate: number;
  venit: number;
}

export interface RaportAngajati {
  angajati: AngajatRow[];
}

// ─── FINANCIAR ────────────────────────────────────────────────

export async function getRaportFinanciarAction(
  statieId: string,
  from: string,
  to: string
): Promise<RaportFinanciar | null> {
  const supabase = await createClient();
  const prev = getPrevRange(from, to);

  const [{ data: rows }, { data: prevRows }] = await Promise.all([
    supabase
      .from("programari")
      .select("data_programare, status, pret, vehicule!inner(tip_vehicul)")
      .eq("statie_id", statieId)
      .gte("data_programare", from)
      .lte("data_programare", to),
    supabase
      .from("programari")
      .select("status, pret")
      .eq("statie_id", statieId)
      .gte("data_programare", prev.from)
      .lte("data_programare", prev.to),
  ]);

  if (!rows) return null;

  // Daily grouping
  const byDate: Record<string, ZiFinanciar> = {};
  for (const r of rows) {
    const d = r.data_programare;
    if (!byDate[d]) byDate[d] = { data: d, total: 0, finalizate: 0, venit: 0 };
    byDate[d].total++;
    if (r.status === "finalizat") {
      byDate[d].finalizate++;
      byDate[d].venit += Number(r.pret ?? 0);
    }
  }
  const zilnic = Object.values(byDate).sort((a, b) => a.data.localeCompare(b.data));

  // By tip_vehicul
  const byTip: Record<string, { nr: number; venit: number }> = {};
  for (const r of rows) {
    const veh = Array.isArray(r.vehicule) ? r.vehicule[0] : r.vehicule;
    const tip = (veh as { tip_vehicul?: string | null })?.tip_vehicul ?? "Necunoscut";
    if (!byTip[tip]) byTip[tip] = { nr: 0, venit: 0 };
    byTip[tip].nr++;
    if (r.status === "finalizat") byTip[tip].venit += Number(r.pret ?? 0);
  }
  const tipVehicul: TipVehiculStat[] = Object.entries(byTip)
    .map(([tip, d]) => ({ tip, nr: d.nr, venit: d.venit, pret_mediu: d.nr > 0 ? Math.round(d.venit / d.nr) : 0 }))
    .sort((a, b) => b.venit - a.venit);

  // KPIs
  const finalizate = rows.filter((r) => r.status === "finalizat");
  const cuPret = finalizate.filter((r) => r.pret && r.pret > 0);
  const venit_total = finalizate.reduce((s, r) => s + Number(r.pret ?? 0), 0);
  const itp_platite = cuPret.length;
  const pret_mediu = itp_platite > 0 ? Math.round(venit_total / itp_platite) : 0;
  const rata_colectare = finalizate.length > 0 ? Math.round((itp_platite / finalizate.length) * 100) : 0;

  const prevFinalizate = (prevRows ?? []).filter((r) => r.status === "finalizat");
  const prevVenit = prevFinalizate.reduce((s, r) => s + Number(r.pret ?? 0), 0);

  return {
    zilnic,
    tipVehicul,
    kpi: {
      venit_total,
      itp_platite,
      pret_mediu,
      rata_colectare,
      trend_venit: calcTrend(venit_total, prevVenit),
      trend_itp: calcTrend(itp_platite, prevFinalizate.filter((r) => r.pret && r.pret > 0).length),
    },
  };
}

// ─── PROGRAMĂRI ───────────────────────────────────────────────

export async function getRaportProgramariAction(
  statieId: string,
  from: string,
  to: string
): Promise<RaportProgramari | null> {
  const supabase = await createClient();
  const prev = getPrevRange(from, to);

  const [{ data: rows }, { data: prevRows }] = await Promise.all([
    supabase
      .from("programari")
      .select("data_programare, status, pret")
      .eq("statie_id", statieId)
      .gte("data_programare", from)
      .lte("data_programare", to),
    supabase
      .from("programari")
      .select("status")
      .eq("statie_id", statieId)
      .gte("data_programare", prev.from)
      .lte("data_programare", prev.to),
  ]);

  if (!rows) return null;

  const byDate: Record<string, ZiProgramari> = {};
  for (const r of rows) {
    const d = r.data_programare;
    if (!byDate[d]) byDate[d] = { data: d, total: 0, finalizate: 0, neprezent: 0, anulate: 0, venit: 0, rata: 0 };
    byDate[d].total++;
    if (r.status === "finalizat") { byDate[d].finalizate++; byDate[d].venit += Number(r.pret ?? 0); }
    if (r.status === "neprezent") byDate[d].neprezent++;
    if (r.status === "anulat") byDate[d].anulate++;
  }
  const zilnic = Object.values(byDate).sort((a, b) => a.data.localeCompare(b.data)).map((z) => ({
    ...z,
    rata: z.total > 0 ? Math.round((z.finalizate / z.total) * 100) : 0,
  }));

  const STATUS_CONFIG = [
    { status: "finalizat", label: "Finalizat", color: "#16A34A" },
    { status: "in_lucru", label: "În lucru", color: "#1877F2" },
    { status: "programat", label: "Programat", color: "#9CA3AF" },
    { status: "neprezent", label: "Neprezent", color: "#EA580C" },
    { status: "anulat", label: "Anulat", color: "#DC2626" },
  ];

  const statusCounts: Record<string, number> = {};
  for (const r of rows) {
    statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
  }
  const statusDist = STATUS_CONFIG.map((s) => ({
    ...s,
    count: statusCounts[s.status] ?? 0,
  }));

  const total = rows.length;
  const finalizate = statusCounts["finalizat"] ?? 0;
  const neprezent = statusCounts["neprezent"] ?? 0;
  const anulate = statusCounts["anulat"] ?? 0;
  const rata_prezenta = total > 0 ? Math.round(((total - neprezent - anulate) / total) * 100) : 0;

  const prevTotal = prevRows?.length ?? 0;
  const prevFinalizate = prevRows?.filter((r) => r.status === "finalizat").length ?? 0;

  return {
    zilnic,
    statusDist,
    kpi: {
      total,
      finalizate,
      neprezent,
      rata_prezenta,
      trend_total: calcTrend(total, prevTotal),
      trend_finalizate: calcTrend(finalizate, prevFinalizate),
    },
  };
}

// ─── ITP ──────────────────────────────────────────────────────

export async function getRaportItpAction(
  statieId: string,
  from: string,
  to: string
): Promise<RaportItp | null> {
  const supabase = await createClient();
  const prev = getPrevRange(from, to);

  // Get programare IDs in range
  const { data: progIds } = await supabase
    .from("programari")
    .select("id, data_programare, clienti!inner(nume, prenume), vehicule!inner(nr_inmatriculare, marca, model)")
    .eq("statie_id", statieId)
    .gte("data_programare", from)
    .lte("data_programare", to);

  if (!progIds) return null;

  const ids = progIds.map((p) => p.id);

  const [{ data: rezultate }, { data: prevProgIds }] = await Promise.all([
    ids.length > 0
      ? supabase
          .from("rezultate_itp")
          .select("id, rezultat, inspector, data_inspectie, programare_id")
          .in("programare_id", ids)
      : Promise.resolve({ data: [] }),
    supabase
      .from("programari")
      .select("id")
      .eq("statie_id", statieId)
      .gte("data_programare", prev.from)
      .lte("data_programare", prev.to),
  ]);

  const r = rezultate ?? [];

  const REZULTAT_CONFIG = [
    { rezultat: "admis", label: "Admis", color: "#16A34A" },
    { rezultat: "readmis", label: "Readmis", color: "#1877F2" },
    { rezultat: "respins", label: "Respins", color: "#DC2626" },
  ];

  const rezCounts: Record<string, number> = {};
  for (const rez of r) {
    rezCounts[rez.rezultat] = (rezCounts[rez.rezultat] ?? 0) + 1;
  }
  const rezultateStats = REZULTAT_CONFIG.map((c) => ({ ...c, count: rezCounts[c.rezultat] ?? 0 }));

  // Build program map for joins
  const progMap = Object.fromEntries(progIds.map((p) => [p.id, p]));

  const lista: ItpListItem[] = r.map((rez) => {
    const prog = progMap[rez.programare_id];
    const client = prog?.clienti
      ? (() => {
          const c = Array.isArray(prog.clienti) ? prog.clienti[0] : prog.clienti;
          return `${(c as { nume: string; prenume?: string | null }).nume} ${(c as { prenume?: string | null }).prenume ?? ""}`.trim();
        })()
      : "—";
    const veh = prog?.vehicule
      ? (() => {
          const v = Array.isArray(prog.vehicule) ? prog.vehicule[0] : prog.vehicule;
          const vt = v as { nr_inmatriculare: string; marca?: string | null; model?: string | null };
          return `${vt.nr_inmatriculare}${vt.marca ? ` · ${vt.marca}` : ""}${vt.model ? ` ${vt.model}` : ""}`;
        })()
      : "—";
    return {
      id: rez.id,
      data_inspectie: rez.data_inspectie,
      data_programare: prog?.data_programare ?? rez.data_inspectie,
      vehicul: veh,
      client,
      rezultat: rez.rezultat,
      inspector: rez.inspector,
    };
  }).sort((a, b) => b.data_inspectie.localeCompare(a.data_inspectie));

  const total = r.length;
  const admise = (rezCounts["admis"] ?? 0) + (rezCounts["readmis"] ?? 0);
  const respinse = rezCounts["respins"] ?? 0;
  const rata_admitere = total > 0 ? Math.round((admise / total) * 100) : 0;

  // Previous period count
  const prevIds = prevProgIds?.map((p) => p.id) ?? [];
  const prevTotal = prevIds.length > 0
    ? ((await supabase.from("rezultate_itp").select("id", { count: "exact", head: true }).in("programare_id", prevIds)).count ?? 0)
    : 0;

  return {
    rezultate: rezultateStats,
    lista,
    kpi: {
      total,
      admise,
      respinse,
      rata_admitere,
      trend_total: calcTrend(total, prevTotal),
    },
  };
}

// ─── SMS ──────────────────────────────────────────────────────

const TIP_REMINDER_LABELS: Record<string, string> = {
  "30_zile": "ITP 30 zile",
  "15_zile": "ITP 15 zile",
  "7_zile": "ITP 7 zile",
  "1_zi": "ITP 1 zi",
  "expirat": "ITP Expirat",
  "confirmare_programare": "Confirmare programare",
  "ziua_programarii": "Ziua programării",
};

export async function getRaportSmsAction(
  statieId: string,
  profileId: string,
  from: string,
  to: string
): Promise<RaportSms | null> {
  const supabase = await createClient();
  const fromTs = from + "T00:00:00";
  const toTs = to + "T23:59:59";

  const [{ data: mesaje }, { data: remindereData }, quotaResult] = await Promise.all([
    supabase
      .from("mesaje")
      .select("id, created_at, status, tip, telefon, mesaj, clienti(nume, prenume)")
      .eq("statie_id", statieId)
      .eq("directie", "trimis")
      .gte("created_at", fromTs)
      .lte("created_at", toTs),
    supabase
      .from("remindere")
      .select("tip, status, trimis_la")
      .eq("statie_id", statieId)
      .not("trimis_la", "is", null)
      .gte("trimis_la", fromTs)
      .lte("trimis_la", toTs),
    supabase.rpc("get_sms_quota", { p_profile_id: profileId }),
  ]);

  const msgs = mesaje ?? [];
  const rems = remindereData ?? [];

  // Daily grouping
  const byDate: Record<string, ZiSms> = {};
  for (const m of msgs) {
    const d = m.created_at.split("T")[0];
    if (!byDate[d]) byDate[d] = { data: d, total: 0, livrate: 0, erori: 0 };
    byDate[d].total++;
    if (m.status === "livrat" || m.status === "trimis") byDate[d].livrate++;
    if (m.status === "eroare") byDate[d].erori++;
  }
  const zilnic = Object.values(byDate).sort((a, b) => a.data.localeCompare(b.data));

  // Reminder tip distribution
  const tipCounts: Record<string, number> = {};
  for (const r of rems) {
    tipCounts[r.tip] = (tipCounts[r.tip] ?? 0) + 1;
  }
  const tipDist: TipReminderStat[] = Object.entries(tipCounts)
    .map(([tip, count]) => ({ tip, label: TIP_REMINDER_LABELS[tip] ?? tip, count }))
    .sort((a, b) => b.count - a.count);

  // SMS list
  const lista: SmsListItem[] = msgs.map((m) => {
    const c = m.clienti ? (Array.isArray(m.clienti) ? m.clienti[0] : m.clienti) : null;
    const client = c
      ? `${(c as { nume: string; prenume?: string | null }).nume} ${(c as { prenume?: string | null }).prenume ?? ""}`.trim()
      : "—";
    return {
      id: m.id,
      created_at: m.created_at,
      client,
      telefon: m.telefon,
      mesaj: m.mesaj,
      status: m.status,
    };
  }).sort((a, b) => b.created_at.localeCompare(a.created_at));

  // KPIs
  const total = msgs.length;
  const livrate = msgs.filter((m) => m.status === "livrat" || m.status === "trimis").length;
  const erori = msgs.filter((m) => m.status === "eroare").length;
  const rata_livrare = total > 0 ? Math.round((livrate / total) * 100) : 0;

  // Quota
  const quota = quotaResult.data?.[0] ?? null;

  // Quota history — query sms_quota table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: histData } = await (supabase as any)
    .from("sms_quota")
    .select("luna, trimise, limita")
    .eq("profile_id", profileId)
    .order("luna", { ascending: false })
    .limit(6);

  const quotaHistory: QuotaLuna[] = (histData ?? []).map(
    (h: { luna: string; trimise: number; limita: number }) => h
  );

  return { zilnic, tipDist, quotaHistory, lista, kpi: { total, livrate, erori, rata_livrare }, quota };
}

// ─── ANGAJAȚI ────────────────────────────────────────────────

export async function getRaportAngajatiAction(
  statieId: string,
  from?: string,
  to?: string
): Promise<RaportAngajati | null> {
  const supabase = await createClient();

  const [{ data: angajatiRaw }, { data: programariRaw }] = await Promise.all([
    supabase
      .from("angajati")
      .select("id, nume, functie, email, telefon, activ")
      .eq("statie_id", statieId)
      .order("activ", { ascending: false })
      .order("nume"),
    supabase
      .from("programari")
      .select("angajat_id, status, pret")
      .eq("statie_id", statieId)
      .not("angajat_id", "is", null)
      .gte("data_programare", from ?? "2000-01-01")
      .lte("data_programare", to ?? "2099-12-31"),
  ]);

  if (!angajatiRaw) return null;

  // Build stats map per angajat
  const statsMap: Record<string, { total: number; finalizate: number; venit: number }> = {};
  for (const p of programariRaw ?? []) {
    if (!p.angajat_id) continue;
    if (!statsMap[p.angajat_id]) statsMap[p.angajat_id] = { total: 0, finalizate: 0, venit: 0 };
    statsMap[p.angajat_id].total++;
    if (p.status === "finalizat") {
      statsMap[p.angajat_id].finalizate++;
      statsMap[p.angajat_id].venit += Number(p.pret ?? 0);
    }
  }

  const angajati: AngajatRow[] = angajatiRaw.map((a) => ({
    ...a,
    programari_total: statsMap[a.id]?.total ?? 0,
    programari_finalizate: statsMap[a.id]?.finalizate ?? 0,
    venit: statsMap[a.id]?.venit ?? 0,
  }));

  return { angajati };
}
