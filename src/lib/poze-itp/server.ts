import "server-only";

import { randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { deleteObjects, isR2Configured, type InfoObiect } from "@/lib/r2";

/**
 * Logica server pentru pozele ITP, comună server actions și cron-ului.
 * NU este fișier "use server": nimic de aici nu devine endpoint public.
 *
 * Invariantul de care depinde curățarea R2:
 *  - orice cheie a unui rând ACTIV (sters_la IS NULL) există în R2;
 *  - orice cheie a unui rând marcat ca șters / șters fizic ajunge în coada
 *    r2_chei_de_sters (trigger, în aceeași tranzacție) și de acolo e ștearsă.
 * De aceea ordinea este mereu: întâi baza de date, apoi R2 — niciodată invers.
 */

type ServiceClient = ReturnType<typeof createServiceClient>;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const CHEIE_POZA = new RegExp(`^itp/(${UUID})/(${UUID})/${UUID}\\.jpg$`);
/** Câte valori punem într-un filtru `in.(...)` — URL-ul PostgREST rămâne sub ~8 KB. */
const BUCATA_IN = 50;
/** Câte chei din coadă procesează cron-ul pe lot. */
const LOT_COADA = 500;
/** Câte poze expirate marchează cron-ul pe lot. */
const LOT_EXPIRARE = 500;
/** Câte zile păstrăm evidența plafonului zilnic de încărcare (poze_incarcari_emise). */
const ZILE_EVIDENTA_PLAFON = 30;

// ── Chei ─────────────────────────────────────────────────────────────────────

/** Chei noi, generate EXCLUSIV pe server. Fără date personale (doar UUID-uri). */
export function genereazaCheiPoza(statieId: string, programareId: string) {
  const baza = `itp/${statieId}/${programareId}/${randomUUID()}`;
  return { cheie: `${baza}.jpg`, cheieThumb: `${baza}_t.jpg` };
}

export function cheieThumbPentru(cheie: string): string {
  return `${cheie.slice(0, -".jpg".length)}_t.jpg`;
}

/** Cheie principală (nu miniatură) aflată EXACT în folderul acestei programări. */
export function esteCheiaProgramarii(
  cheie: unknown,
  statieId: string,
  programareId: string
): cheie is string {
  if (typeof cheie !== "string") return false;
  const m = CHEIE_POZA.exec(cheie);
  return !!m && m[1] === statieId && m[2] === programareId;
}

/** JPEG real: mărime în limite, Content-Type image/jpeg, începe cu FF D8 FF. */
export function esteJpegValid(info: InfoObiect, marimeMaxima: number): boolean {
  const tip = (info.tip ?? "").split(";")[0].trim().toLowerCase();
  return (
    info.marime > 0 &&
    info.marime <= marimeMaxima &&
    tip === "image/jpeg" &&
    info.inceput.length >= 3 &&
    info.inceput[0] === 0xff &&
    info.inceput[1] === 0xd8 &&
    info.inceput[2] === 0xff
  );
}

/** Data fotografierii raportată de browser — păstrată doar dacă e plauzibilă. */
export function dataFacereValida(ms: number | null): string | null {
  if (ms === null || !Number.isFinite(ms)) return null;
  const acum = Date.now();
  if (ms < acum - 60 * 24 * 60 * 60 * 1000 || ms > acum + 5 * 60 * 1000) return null;
  return new Date(ms).toISOString();
}

// ── Utilitare ────────────────────────────────────────────────────────────────

export async function mapCuConcurenta<T, R>(
  elemente: T[],
  limita: number,
  fn: (element: T, index: number) => Promise<R>
): Promise<R[]> {
  const rezultate = new Array<R>(elemente.length);
  let urmator = 0;
  async function lucrator() {
    while (urmator < elemente.length) {
      const i = urmator++;
      rezultate[i] = await fn(elemente[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limita, elemente.length) }, lucrator));
  return rezultate;
}

export function bucati<T>(elemente: T[], marime: number = BUCATA_IN): T[][] {
  const rezultat: T[][] = [];
  for (let i = 0; i < elemente.length; i += marime) rezultat.push(elemente.slice(i, i + marime));
  return rezultat;
}

// ── Coada de ștergere R2 ─────────────────────────────────────────────────────

/**
 * Pune în coadă chei care nu au (și nu vor avea) rând activ în programari_poze —
 * ex. obiecte urcate dar respinse la confirmare. Cheile rândurilor ajung în
 * coadă singure, prin trigger.
 */
export async function punInCoadaDeStergere(chei: string[]): Promise<void> {
  const unice = [...new Set(chei)];
  if (!unice.length) return;
  const svc = createServiceClient();
  const { error } = await svc
    .from("r2_chei_de_sters")
    .upsert(
      unice.map((cheie) => ({ cheie })),
      { onConflict: "cheie", ignoreDuplicates: true }
    );
  // Nu e fatal: regula de lifecycle din R2 (15 zile pe itp/) le prinde oricum.
  if (error) console.error("[PozeITP] coada de stergere:", error.message);
}

async function scoateDinCoada(svc: ServiceClient, chei: string[]): Promise<void> {
  for (const b of bucati(chei)) {
    const { error } = await svc.from("r2_chei_de_sters").delete().in("cheie", b);
    if (error) console.error("[PozeITP] scoatere din coada:", error.message);
  }
}

async function noteazaEsecuri(
  svc: ServiceClient,
  esuate: { cheie: string; eroare: string }[]
): Promise<void> {
  const deNotat = esuate.slice(0, 50);
  if (!deNotat.length) return;
  const { data } = await svc
    .from("r2_chei_de_sters")
    .select("cheie, incercari")
    .in("cheie", deNotat.map((e) => e.cheie));
  const incercari = new Map((data ?? []).map((r) => [r.cheie, r.incercari]));
  await mapCuConcurenta(deNotat, 5, async (e) => {
    if (!incercari.has(e.cheie)) return;
    await svc
      .from("r2_chei_de_sters")
      .update({ incercari: (incercari.get(e.cheie) ?? 0) + 1, ultima_eroare: e.eroare.slice(0, 300) })
      .eq("cheie", e.cheie);
  });
}

/**
 * Plasă de siguranță înainte de orice ștergere din R2: elimină cheile încă
 * folosite de un rând ACTIV. Dacă verificarea eșuează, nu ștergem nimic
 * („fail closed”) — o cheie rămasă în coadă se reîncearcă la rularea următoare.
 */
async function separaCheiReferite(
  svc: ServiceClient,
  chei: string[]
): Promise<{ libere: string[]; referite: string[] }> {
  const principale = [
    ...new Set(chei.map((k) => (k.endsWith("_t.jpg") ? `${k.slice(0, -"_t.jpg".length)}.jpg` : k))),
  ];
  const folosite = new Set<string>();
  for (const b of bucati(principale)) {
    const { data, error } = await svc
      .from("programari_poze")
      .select("r2_key, r2_key_thumb")
      .in("r2_key", b)
      .is("sters_la", null);
    if (error) throw new Error(`verificare chei: ${error.message}`);
    for (const r of data ?? []) {
      folosite.add(r.r2_key);
      if (r.r2_key_thumb) folosite.add(r.r2_key_thumb);
    }
  }
  return {
    libere: chei.filter((k) => !folosite.has(k)),
    referite: chei.filter((k) => folosite.has(k)),
  };
}

/**
 * Șterge din R2 cheile date (deja puse în coadă de trigger sau de
 * punInCoadaDeStergere) și le scoate din coadă pe cele reușite. Pentru after()
 * din server actions: nu aruncă niciodată; ce eșuează rămâne pentru cron.
 */
export async function purjeazaChei(chei: string[]): Promise<void> {
  const unice = [...new Set(chei.filter(Boolean))];
  if (!unice.length || !isR2Configured()) return;
  const svc = createServiceClient();
  try {
    const { libere, referite } = await separaCheiReferite(svc, unice);
    if (referite.length) {
      console.warn(`[PozeITP] ${referite.length} chei din coada sunt inca folosite — nu se sterg`);
      await scoateDinCoada(svc, referite);
    }
    const { sterse, esuate } = await deleteObjects(libere);
    await scoateDinCoada(svc, sterse);
    if (esuate.length) {
      console.error(`[PozeITP] ${esuate.length} obiecte R2 nesterse acum (raman pentru cron)`);
      await noteazaEsecuri(svc, esuate);
    }
  } catch (e) {
    console.error("[PozeITP] purjare:", e instanceof Error ? e.message : e);
  }
}

/**
 * Cron: marchează pozele expirate (pe loturi). Trigger-ul din migrația 013 pune
 * cheile lor în coadă în aceeași tranzacție. Idempotent.
 */
export async function expiraPozeVechi(termenMs: number): Promise<{ expirate: number; incompleta: boolean }> {
  const svc = createServiceClient();
  let expirate = 0;

  while (Date.now() < termenMs) {
    const acum = new Date().toISOString();
    const { data, error } = await svc
      .from("programari_poze")
      .select("id")
      .is("sters_la", null)
      .lte("expira_la", acum)
      .order("expira_la", { ascending: true })
      .limit(LOT_EXPIRARE);
    if (error) throw new Error(`citire expirate: ${error.message}`);
    if (!data?.length) return { expirate, incompleta: false };

    for (const b of bucati(data.map((r) => r.id))) {
      const { count, error: errMarcare } = await svc
        .from("programari_poze")
        .update({ sters_la: acum, motiv_stergere: "expirat" }, { count: "exact" })
        .in("id", b)
        .is("sters_la", null);
      if (errMarcare) throw new Error(`marcare expirate: ${errMarcare.message}`);
      expirate += count ?? 0;
    }

    if (data.length < LOT_EXPIRARE) return { expirate, incompleta: false };
  }
  return { expirate, incompleta: true };
}

/**
 * Cron: golește coada. Parcurge cheile în ordine (keyset pe cheie), deci o
 * cheie care eșuează nu blochează restul și nu e reîncercată în aceeași rulare.
 */
export async function golesteCoadaR2(termenMs: number): Promise<{
  procesate: number;
  sterse: number;
  esuate: number;
  referite: number;
  incompleta: boolean;
}> {
  const svc = createServiceClient();
  let dupa: string | null = null;
  let procesate = 0;
  let sterse = 0;
  let esuate = 0;
  let referite = 0;

  while (Date.now() < termenMs) {
    let q = svc
      .from("r2_chei_de_sters")
      .select("cheie")
      .order("cheie", { ascending: true })
      .limit(LOT_COADA);
    if (dupa) q = q.gt("cheie", dupa);
    const { data, error } = await q;
    if (error) throw new Error(`citire coada: ${error.message}`);
    if (!data?.length) return { procesate, sterse, esuate, referite, incompleta: false };

    dupa = data[data.length - 1].cheie;
    procesate += data.length;

    const separate = await separaCheiReferite(svc, data.map((r) => r.cheie));
    if (separate.referite.length) {
      referite += separate.referite.length;
      await scoateDinCoada(svc, separate.referite);
    }
    // Nicio ștergere nouă după termen: cu R2 lent, un lot întreg (până la 10 s pe
    // cheie) ar depăși maxDuration și rularea ar fi oprită fără raport.
    const rez = await deleteObjects(separate.libere, 8, termenMs);
    await scoateDinCoada(svc, rez.sterse);
    await noteazaEsecuri(svc, rez.esuate);
    sterse += rez.sterse.length;
    esuate += rez.esuate.length;

    // Termenul a oprit lotul: cheile neîncercate rămân în coadă (fără încercare
    // notată) pentru rularea următoare.
    if (rez.sterse.length + rez.esuate.length < separate.libere.length) {
      return { procesate, sterse, esuate, referite, incompleta: true };
    }
    if (data.length < LOT_COADA) return { procesate, sterse, esuate, referite, incompleta: false };
  }
  return { procesate, sterse, esuate, referite, incompleta: true };
}

/**
 * Cron: șterge evidența plafonului zilnic mai veche de 30 de zile (rezervarea
 * folosește doar rândul zilei curente). Best effort: nu aruncă niciodată —
 * întoarce numărul de rânduri șterse, sau null la eroare.
 */
export async function curataEvidentaPlafon(): Promise<number | null> {
  try {
    const svc = createServiceClient();
    const prag = new Date(Date.now() - ZILE_EVIDENTA_PLAFON * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { count, error } = await svc
      .from("poze_incarcari_emise")
      .delete({ count: "exact" })
      .lt("zi", prag);
    if (error) {
      console.error("[PozeITP] curatare plafon zilnic:", error.message);
      return null;
    }
    return count ?? 0;
  } catch (e) {
    console.error("[PozeITP] curatare plafon zilnic:", e instanceof Error ? e.message : e);
    return null;
  }
}

/** Cheile pozelor ACTIVE ale unei programări (pentru ștergerea programării). Nu aruncă. */
export async function citesteCheiPozeActive(programareId: string): Promise<string[]> {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("programari_poze")
    .select("r2_key, r2_key_thumb")
    .eq("programare_id", programareId)
    .is("sters_la", null);
  if (error) {
    // Ex. migrația 013 încă neaplicată — trigger-ul + cron-ul acoperă oricum ștergerea.
    console.error("[PozeITP] citire chei:", error.message);
    return [];
  }
  return (data ?? []).flatMap((r) => (r.r2_key_thumb ? [r.r2_key, r.r2_key_thumb] : [r.r2_key]));
}

// ── Nume de fișiere (ora României) ──────────────────────────────────────────

const FORMAT_RO = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Bucharest",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** Nr. de înmatriculare curățat pentru nume de fișier: „B 123 ABC” → „B123ABC”. */
export function nrPentruFisier(nr: string | null): string {
  const curat = (nr ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 20);
  return curat || "FARA-NR";
}

/** ITP_<NR>_<YYYY-MM-DD>_<HH-mm>_<nn>.jpg, în ora României. */
export function numeFisierPoza(nr: string, data: Date, index: number): string {
  const p: Record<string, string> = {};
  for (const parte of FORMAT_RO.formatToParts(data)) p[parte.type] = parte.value;
  const nn = String(index).padStart(2, "0");
  return `ITP_${nr}_${p.year}-${p.month}-${p.day}_${p.hour}-${p.minute}_${nn}.jpg`;
}

/**
 * ITP_<NR>_<data programării>_<HH-mm-ss>.zip, cu ora pregătirii (ora României):
 * fiecare descărcare are alt nume, deci pe iPhone „Salvează în Fișiere” nu
 * propune „Înlocuiește” peste arhiva unei descărcări anterioare (ale cărei poze
 * sunt deja șterse de pe server). Fără „:”, nepermis în nume de fișiere pe iOS.
 */
export function numeArhivaPoze(nr: string, dataProgramare: string, pregatitaLa: Date): string {
  const data = /^\d{4}-\d{2}-\d{2}$/.test(dataProgramare) ? dataProgramare : "poze";
  const p: Record<string, string> = {};
  for (const parte of FORMAT_RO.formatToParts(pregatitaLa)) p[parte.type] = parte.value;
  return `ITP_${nr}_${data}_${p.hour}-${p.minute}-${p.second}.zip`;
}
