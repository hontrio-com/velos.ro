"use server";

import { after } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import type { TablesInsert } from "@/types/database.types";
import { autorizeazaProgramare } from "@/lib/autorizare-programare";
import { inspecteazaObiect, isR2Configured, presignGet, presignPut } from "@/lib/r2";
import {
  cheieThumbPentru,
  dataFacereValida,
  esteCheiaProgramarii,
  esteJpegValid,
  genereazaCheiPoza,
  mapCuConcurenta,
  nrPentruFisier,
  numeArhivaPoze,
  numeFisierPoza,
  punInCoadaDeStergere,
  purjeazaChei,
} from "@/lib/poze-itp/server";
import {
  MESAJ_FARA_POZE_DE_DESCARCAT,
  POZA_MAX_BYTES,
  POZA_THUMB_MAX_BYTES,
  POZE_MAX_ACTIVE,
  POZE_MAX_PE_APEL,
  POZE_PLAFON_ZILNIC_OCTETI,
  formatPoze,
  type DescarcarePregatita,
  type EroareLista,
  type FisierDeIncarcat,
  type IncarcarePregatita,
  type ListaPozeRezultat,
  type MotivStergere,
  type PozaDeDescarcat,
  type PozaIncarcata,
  type PozaItp,
  type RezultatConfirmare,
  type RezumatPozeSterse,
} from "@/lib/poze-itp/shared";

// Poze ITP pe programare, stocate în Cloudflare R2.
// Fiecare acțiune: validare input → autorizeazaProgramare (stația și
// proprietarul se deduc din programare, pe server) → service client.
// Fișierele NU trec prin server: browserul urcă/descarcă direct din R2 cu
// URL-uri presemnate de scurtă durată. Fără revalidatePath: lista e un query TanStack.

const NECONFIGURAT = "Stocarea pozelor nu este încă configurată.";
const EROARE = "A apărut o eroare. Încearcă din nou.";
const EROARE_LISTA = "Nu s-au putut încărca pozele.";
const MESAJ_LIMITA = `Programarea are deja ${formatPoze(POZE_MAX_ACTIVE)}. Descarcă sau șterge din ele înainte de a adăuga altele.`;
const MESAJ_PLAFON_ZILNIC =
  "Ai atins limita zilnică de încărcare a pozelor pentru acest cont. Încearcă din nou mâine sau scrie-ne la contact@velos.ro.";
const MESAJ_STATIE_SUSPENDATA = "Contul stației este suspendat.";
const MESAJ_URCATA_DEMULT = "Poza nu a fost salvată la timp. Apasă „Reîncearcă” ca să o urci din nou.";
/**
 * O poză urcată în R2 se confirmă cel târziu după 12 ore. Rândul primește 14 zile
 * de la confirmare, dar regula de lifecycle din R2 șterge obiectul la 15 zile de
 * la URCARE: sub 24 de ore, poza nu poate rămâne în listă fără fișier.
 */
const VECHIME_MAX_URCARE_MS = 12 * 60 * 60 * 1000;
const ORDINE_MOTIVE: MotivStergere[] = ["descarcat", "manual", "expirat"];

type ServiceClient = ReturnType<typeof createServiceClient>;

const schemaFisiere = z
  .array(
    z
      .object({
        mime: z.literal("image/jpeg"),
        marime: z.number().int().min(1).max(POZA_MAX_BYTES),
        marimeThumb: z.number().int().min(1).max(POZA_THUMB_MAX_BYTES).nullable(),
      })
      .strict()
  )
  .min(1)
  .max(POZE_MAX_PE_APEL);

const schemaConfirmare = z
  .array(
    z
      .object({
        cheie: z.string().max(200),
        cheieThumb: z.string().max(200).nullable(),
        facutaLa: z.number().nullable(),
        latime: z.number().int().min(1).max(20000).nullable(),
        inaltime: z.number().int().min(1).max(20000).nullable(),
      })
      .strict()
  )
  .min(1)
  .max(POZE_MAX_PE_APEL);

const schemaId = z.guid();
const schemaIduri = z.array(z.guid()).min(1).max(POZE_MAX_ACTIVE * 2);

async function numarPozeActive(db: ServiceClient, programareId: string): Promise<number | null> {
  const { count, error } = await db
    .from("programari_poze")
    .select("id", { count: "exact", head: true })
    .eq("programare_id", programareId)
    .is("sters_la", null)
    .gt("expira_la", new Date().toISOString());
  if (error) {
    console.error("[PozeITP] numarare:", error.message);
    return null;
  }
  return count ?? 0;
}

async function numeProfile(db: ServiceClient, iduri: string[]): Promise<Map<string, string>> {
  const nume = new Map<string, string>();
  const unice = [...new Set(iduri)].slice(0, 50);
  if (!unice.length) return nume;
  const { data, error } = await db.from("profiles").select("id, full_name").in("id", unice);
  if (error) {
    console.error("[PozeITP] nume:", error.message);
    return nume;
  }
  // Doar numele afișat — fără email.
  for (const p of data ?? []) if (p.full_name) nume.set(p.id, p.full_name);
  return nume;
}

const timp = (iso: string | null) => (iso ? Date.parse(iso) : 0);

// ── listeazaPozeProgramareAction ─────────────────────────────────────────────

export async function listeazaPozeProgramareAction(
  programareId: string
): Promise<ListaPozeRezultat | EroareLista> {
  // R2 se verifică ÎNAINTEA autorizării: răspunsul e același pentru orice apelant și orice
  // programare (nu dezvăluie nimic), iar secțiunea rămâne ascunsă pentru toți — inclusiv
  // pentru angajatul fără permisiunea „Programări”, care ajunge la programări din /dashboard.
  if (!isR2Configured()) return { configurat: false };
  const auth = await autorizeazaProgramare(programareId);
  if (!auth.ok) return { error: auth.error, faraAcces: !auth.tranzitoriu };
  const { ctx } = auth;

  const db = createServiceClient();
  const acum = new Date().toISOString();
  const [activeRes, sterseRes, expirateRes] = await Promise.all([
    db
      .from("programari_poze")
      .select(
        "id, r2_key, r2_key_thumb, facuta_la, incarcata_la, incarcata_de, expira_la, latime, inaltime, marime_bytes"
      )
      .eq("programare_id", ctx.programare.id)
      .is("sters_la", null)
      .gt("expira_la", acum)
      .order("incarcata_la", { ascending: true })
      .limit(POZE_MAX_ACTIVE * 2),
    db
      .from("programari_poze")
      .select("sters_la, motiv_stergere, sters_de")
      .eq("programare_id", ctx.programare.id)
      .not("sters_la", "is", null)
      .order("sters_la", { ascending: false })
      .limit(500),
    // Expirate, dar încă nemarcate: cron-ul rulează o dată pe zi.
    db
      .from("programari_poze")
      .select("expira_la")
      .eq("programare_id", ctx.programare.id)
      .is("sters_la", null)
      .lte("expira_la", acum)
      .limit(500),
  ]);

  if (activeRes.error || sterseRes.error || expirateRes.error) {
    console.error(
      "[PozeITP] listare:",
      activeRes.error?.message ?? sterseRes.error?.message ?? expirateRes.error?.message
    );
    return { error: EROARE_LISTA, faraAcces: false };
  }

  // Apărare în adâncime: nu presemnăm nicio cheie din afara folderului programării.
  const active = (activeRes.data ?? [])
    .filter((r) => esteCheiaProgramarii(r.r2_key, ctx.statieId, ctx.programare.id))
    .sort((a, b) => timp(a.facuta_la ?? a.incarcata_la) - timp(b.facuta_la ?? b.incarcata_la));
  // Pozele expirate și nemarcate intră deja în rezumat ca „șterse automat”, cu
  // momentul expirării — altfel, până la cron, sertarul ar arăta „Nicio poză încă”.
  const sterse = [
    ...(sterseRes.data ?? []),
    ...(expirateRes.data ?? []).map((r) => ({ sters_la: r.expira_la, motiv_stergere: "expirat", sters_de: null })),
  ];

  const nume = await numeProfile(db, [
    ...active.map((r) => r.incarcata_de),
    ...sterse.map((r) => r.sters_de),
  ].filter((x): x is string => !!x));

  let poze: PozaItp[];
  try {
    // Semnarea e locală (HMAC), fără apel la R2 — nu depinde de disponibilitatea R2.
    poze = await Promise.all(
      active.map(async (r): Promise<PozaItp> => {
        const [urlFull, urlThumb] = await Promise.all([
          presignGet(r.r2_key),
          r.r2_key_thumb ? presignGet(r.r2_key_thumb) : Promise.resolve(null),
        ]);
        return {
          id: r.id,
          urlFull,
          urlThumb: urlThumb ?? urlFull,
          facutaLa: r.facuta_la,
          incarcataLa: r.incarcata_la,
          expiraLa: r.expira_la,
          latime: r.latime,
          inaltime: r.inaltime,
          marime: r.marime_bytes,
          incarcataDe: r.incarcata_de ? nume.get(r.incarcata_de) ?? null : null,
        };
      })
    );
  } catch (e) {
    console.error("[PozeITP] semnare:", e instanceof Error ? e.message : e);
    return { error: EROARE_LISTA, faraAcces: false };
  }

  // Rezumatul pozelor șterse, pe motiv. Cea mai recentă ștergere se caută explicit:
  // rândurile expirate nemarcate nu vin în ordinea după sters_la.
  const rezumat: RezumatPozeSterse[] = [];
  for (const motiv of ORDINE_MOTIVE) {
    const grup = sterse.filter((r) => r.motiv_stergere === motiv && r.sters_la);
    if (!grup.length) continue;
    const ultima = grup.reduce((a, b) => (timp(b.sters_la) > timp(a.sters_la) ? b : a));
    rezumat.push({
      motiv,
      numar: grup.length,
      ultimaLa: ultima.sters_la as string,
      deNume: motiv !== "expirat" && ultima.sters_de ? nume.get(ultima.sters_de) ?? null : null,
    });
  }

  return { configurat: true, poze, sterse: rezumat, modAdmin: ctx.impersonare };
}

// ── pregatesteIncarcarePozeAction ────────────────────────────────────────────

export async function pregatesteIncarcarePozeAction(
  programareId: string,
  fisiere: FisierDeIncarcat[]
): Promise<{ incarcari: IncarcarePregatita[] } | { error: string }> {
  const parsed = schemaFisiere.safeParse(fisiere);
  if (!parsed.success) {
    return { error: `Poți încărca cel mult ${formatPoze(POZE_MAX_PE_APEL)} JPEG odată, de maximum 8 MB fiecare.` };
  }

  const auth = await autorizeazaProgramare(programareId);
  if (!auth.ok) return { error: auth.error };
  if (!isR2Configured()) return { error: NECONFIGURAT };
  const { ctx } = auth;
  if (ctx.ownerSuspendat) return { error: MESAJ_STATIE_SUSPENDATA };

  const db = createServiceClient();
  const active = await numarPozeActive(db, ctx.programare.id);
  if (active === null) return { error: EROARE };

  const loc = POZE_MAX_ACTIVE - active;
  if (parsed.data.length > loc) {
    return {
      error:
        loc > 0
          ? `Mai poți adăuga ${formatPoze(loc)} la această programare (maximum ${POZE_MAX_ACTIVE}).`
          : MESAJ_LIMITA,
    };
  }

  // Plafonul zilnic al proprietarului: rezervăm octeții semnați ÎNAINTE de a emite
  // URL-urile, atomic în SQL — se numără și încărcările care nu se confirmă niciodată.
  const octeti = parsed.data.reduce((total, f) => total + f.marime + (f.marimeThumb ?? 0), 0);
  const { data: rezervat, error: errRezervare } = await db.rpc("rezerva_incarcare_poze", {
    p_owner_id: ctx.ownerId,
    p_octeti: octeti,
    p_max_octeti: POZE_PLAFON_ZILNIC_OCTETI,
  });
  if (errRezervare) {
    console.error("[PozeITP] rezervare plafon:", errRezervare.message);
    return { error: EROARE };
  }
  if (rezervat !== true) return { error: MESAJ_PLAFON_ZILNIC };

  try {
    const incarcari = await Promise.all(
      parsed.data.map(async (f): Promise<IncarcarePregatita> => {
        const { cheie, cheieThumb } = genereazaCheiPoza(ctx.statieId, ctx.programare.id);
        const [urlPut, urlPutThumb] = await Promise.all([
          presignPut(cheie, { contentType: "image/jpeg", contentLength: f.marime }),
          f.marimeThumb
            ? presignPut(cheieThumb, { contentType: "image/jpeg", contentLength: f.marimeThumb })
            : Promise.resolve(null),
        ]);
        return { cheie, cheieThumb: urlPutThumb ? cheieThumb : null, urlPut, urlPutThumb };
      })
    );
    return { incarcari };
  } catch (e) {
    console.error("[PozeITP] pregatire:", e instanceof Error ? e.message : e);
    return { error: EROARE };
  }
}

// ── confirmaIncarcarePozeAction ──────────────────────────────────────────────

type Verificare =
  | { p: PozaIncarcata; stare: "ok"; marime: number; thumb: boolean }
  | { p: PozaIncarcata; stare: "lipsa" | "invalid" | "veche" | "eroare" };

/**
 * Verifică obiectele urcate și salvează rândurile. Idempotentă: o cheie deja
 * salvată (răspuns pierdut, reîncercare) e raportată ca „confirmată” fără să fie
 * reverificată și fără să ajungă vreodată în coada de ștergere.
 */
export async function confirmaIncarcarePozeAction(
  programareId: string,
  poze: PozaIncarcata[]
): Promise<RezultatConfirmare | { error: string }> {
  const parsed = schemaConfirmare.safeParse(poze);
  if (!parsed.success) return { error: "Date invalide pentru confirmare." };

  const auth = await autorizeazaProgramare(programareId);
  if (!auth.ok) return { error: auth.error };
  if (!isR2Configured()) return { error: NECONFIGURAT };
  const { ctx } = auth;
  if (ctx.ownerSuspendat) return { error: MESAJ_STATIE_SUSPENDATA };
  const db = createServiceClient();

  const rezultat: RezultatConfirmare = { confirmate: [], respinse: [], reincearca: [] };

  // 1. Doar chei din folderul EXACT al acestei programări, miniatura derivată din
  //    cheie. O cheie străină se respinge și NU se șterge (ar putea fi a altcuiva).
  const vazute = new Set<string>();
  const candidate: PozaIncarcata[] = [];
  for (const p of parsed.data) {
    if (vazute.has(p.cheie)) continue;
    vazute.add(p.cheie);
    const valida =
      esteCheiaProgramarii(p.cheie, ctx.statieId, ctx.programare.id) &&
      (p.cheieThumb === null || p.cheieThumb === cheieThumbPentru(p.cheie));
    if (valida) candidate.push(p);
    else rezultat.respinse.push({ cheie: p.cheie, motiv: "Date de încărcare invalide." });
  }
  if (!candidate.length) return rezultat;

  // 2. Idempotență.
  const { data: existente, error: errExistente } = await db
    .from("programari_poze")
    .select("r2_key")
    .in("r2_key", candidate.map((p) => p.cheie));
  if (errExistente) {
    console.error("[PozeITP] confirmare (existente):", errExistente.message);
    return { error: EROARE };
  }
  const dejaConfirmate = new Set((existente ?? []).map((r) => r.r2_key));
  rezultat.confirmate.push(...dejaConfirmate);
  const noi = candidate.filter((p) => !dejaConfirmate.has(p.cheie));
  if (!noi.length) return rezultat;

  // 3. Limita de poze active, verificată din nou (două telefoane pot urca deodată).
  const active = await numarPozeActive(db, ctx.programare.id);
  if (active === null) return { error: EROARE };
  let libere = Math.max(0, POZE_MAX_ACTIVE - active);

  // 4. Obiectul chiar există în R2, e JPEG și are mărimea permisă (poza și
  //    miniatura se verifică în paralel). Fără loc liber nu mai verificăm nimic.
  const verificari: Verificare[] =
    libere === 0
      ? []
      : await mapCuConcurenta(noi, 6, async (p): Promise<Verificare> => {
          const [mare, mica] = await Promise.allSettled([
            inspecteazaObiect(p.cheie),
            p.cheieThumb ? inspecteazaObiect(p.cheieThumb) : Promise.resolve(null),
          ]);
          if (mare.status === "rejected") return { p, stare: "eroare" }; // tranzitoriu — clientul reconfirmă
          if (!mare.value) return { p, stare: "lipsa" };
          if (!esteJpegValid(mare.value, POZA_MAX_BYTES)) return { p, stare: "invalid" };
          // Urcată de prea mult timp (confirmare reluată după ore / zile): se urcă din nou.
          const { modificatLa } = mare.value;
          if (modificatLa !== null && Date.now() - modificatLa > VECHIME_MAX_URCARE_MS) return { p, stare: "veche" };
          // Miniatură lipsă / invalidă / neverificabilă acum → fără miniatură (se afișează poza mare).
          const thumb =
            mica.status === "fulfilled" && !!mica.value && esteJpegValid(mica.value, POZA_THUMB_MAX_BYTES);
          return { p, stare: "ok", marime: mare.value.marime, thumb };
        });

  const deSters: string[] = [];
  const randuri: TablesInsert<"programari_poze">[] = [];

  if (libere === 0) {
    for (const p of noi) {
      rezultat.respinse.push({ cheie: p.cheie, motiv: MESAJ_LIMITA });
      deSters.push(p.cheie, cheieThumbPentru(p.cheie));
    }
  }

  for (const v of verificari) {
    const cheie = v.p.cheie;
    if (v.stare === "ok") {
      if (libere <= 0) {
        rezultat.respinse.push({ cheie, motiv: MESAJ_LIMITA });
        deSters.push(cheie, cheieThumbPentru(cheie));
        continue;
      }
      libere--;
      if (!v.thumb) deSters.push(cheieThumbPentru(cheie)); // miniatura nefolosită
      randuri.push({
        programare_id: ctx.programare.id,
        statie_id: ctx.statieId,
        r2_key: cheie,
        r2_key_thumb: v.thumb ? v.p.cheieThumb : null,
        mime: "image/jpeg",
        marime_bytes: v.marime,
        latime: v.p.latime,
        inaltime: v.p.inaltime,
        facuta_la: dataFacereValida(v.p.facutaLa),
        incarcata_de: ctx.userId,
      });
    } else if (v.stare === "invalid") {
      rezultat.respinse.push({ cheie, motiv: "Fișierul nu este o poză JPEG validă." });
      deSters.push(cheie, cheieThumbPentru(cheie));
    } else if (v.stare === "veche") {
      // Nu ocupă un loc liber; clientul o urcă din nou, cu chei noi.
      rezultat.respinse.push({ cheie, motiv: MESAJ_URCATA_DEMULT });
      deSters.push(cheie, cheieThumbPentru(cheie));
    } else if (v.stare === "lipsa") {
      rezultat.respinse.push({ cheie, motiv: "Poza nu a ajuns pe server." });
      deSters.push(cheieThumbPentru(cheie));
    } else {
      rezultat.reincearca.push(cheie);
    }
  }

  // Obiectele respinse din folderul programării se șterg prin coadă (sigur, chiar
  // dacă R2 cade acum). Cheile valide NU intră niciodată aici.
  if (deSters.length) {
    await punInCoadaDeStergere(deSters);
    after(() => purjeazaChei(deSters));
  }

  if (randuri.length) {
    const { error } = await db
      .from("programari_poze")
      .upsert(randuri, { onConflict: "r2_key", ignoreDuplicates: true });
    if (error) {
      // Obiectele valide rămân în R2 (nu sunt în coadă) — clientul poate reconfirma.
      console.error("[PozeITP] confirmare (insert):", error.message);
      return { error: "Pozele au fost urcate, dar nu au putut fi salvate. Încearcă din nou." };
    }
    rezultat.confirmate.push(...randuri.map((r) => r.r2_key));
  }

  return rezultat;
}

// ── pregatesteDescarcarePozeAction ───────────────────────────────────────────

export async function pregatesteDescarcarePozeAction(
  programareId: string
): Promise<DescarcarePregatita | { error: string }> {
  const auth = await autorizeazaProgramare(programareId);
  if (!auth.ok) return { error: auth.error };
  if (!isR2Configured()) return { error: NECONFIGURAT };
  const { ctx } = auth;

  const db = createServiceClient();
  const { data, error } = await db
    .from("programari_poze")
    .select("id, r2_key, marime_bytes, facuta_la, incarcata_la")
    .eq("programare_id", ctx.programare.id)
    .is("sters_la", null)
    .gt("expira_la", new Date().toISOString())
    .order("incarcata_la", { ascending: true })
    .limit(POZE_MAX_ACTIVE * 2);

  if (error) {
    console.error("[PozeITP] descarcare:", error.message);
    return { error: EROARE };
  }

  const ordonate = (data ?? [])
    .filter((r) => esteCheiaProgramarii(r.r2_key, ctx.statieId, ctx.programare.id))
    .sort((a, b) => timp(a.facuta_la ?? a.incarcata_la) - timp(b.facuta_la ?? b.incarcata_la));
  if (!ordonate.length) return { error: MESAJ_FARA_POZE_DE_DESCARCAT };

  const nr = nrPentruFisier(ctx.programare.nrInmatriculare);
  try {
    const poze = await Promise.all(
      ordonate.map(async (r, i): Promise<PozaDeDescarcat> => {
        const dataPoza = r.facuta_la ?? r.incarcata_la;
        return {
          id: r.id,
          // Minim 15 minute: 40 de poze pe o conexiune mobilă lentă pot dura câteva minute.
          url: await presignGet(r.r2_key, { expiresSec: 900 }),
          nume: numeFisierPoza(nr, new Date(dataPoza), i + 1),
          marime: r.marime_bytes,
          data: dataPoza,
        };
      })
    );
    return {
      poze,
      numeArhiva: numeArhivaPoze(nr, ctx.programare.dataProgramare, new Date()),
      stergeDupaDescarcare: !ctx.impersonare,
    };
  } catch (e) {
    console.error("[PozeITP] semnare descarcare:", e instanceof Error ? e.message : e);
    return { error: EROARE };
  }
}

// ── confirmaDescarcarePozeAction ─────────────────────────────────────────────

/**
 * Apelată DOAR după ce utilizatorul a salvat arhiva (al doilea gest). Șterge
 * exact pozele din arhivă — cele urcate între timp rămân. Idempotentă.
 */
export async function confirmaDescarcarePozeAction(
  programareId: string,
  pozaIds: string[]
): Promise<{ success: true; sterse: number; pastrate: boolean } | { error: string }> {
  const parsed = schemaIduri.safeParse(pozaIds);
  if (!parsed.success) return { error: "Date invalide." };

  const auth = await autorizeazaProgramare(programareId);
  if (!auth.ok) return { error: auth.error };
  const { ctx } = auth;

  // Admin impersonat: descărcarea NU șterge nimic.
  if (ctx.impersonare) return { success: true, sterse: 0, pastrate: true };

  const db = createServiceClient();
  // Întâi baza de date (trigger-ul pune cheile în coadă în aceeași tranzacție),
  // apoi R2 — dacă R2 cade, cron-ul termină ștergerea.
  const { data, error } = await db
    .from("programari_poze")
    .update({ sters_la: new Date().toISOString(), motiv_stergere: "descarcat", sters_de: ctx.userId })
    .eq("programare_id", ctx.programare.id)
    .in("id", [...new Set(parsed.data)])
    .is("sters_la", null)
    .select("r2_key, r2_key_thumb");

  if (error) {
    console.error("[PozeITP] stergere dupa descarcare:", error.message);
    return { error: "Arhiva a fost salvată, dar pozele nu au putut fi șterse. Se vor șterge automat la expirare." };
  }

  const chei = (data ?? []).flatMap((r) => (r.r2_key_thumb ? [r.r2_key, r.r2_key_thumb] : [r.r2_key]));
  if (chei.length) after(() => purjeazaChei(chei));

  return { success: true, sterse: data?.length ?? 0, pastrate: false };
}

// ── stergePozaAction ─────────────────────────────────────────────────────────

/**
 * Ștergere manuală a unei poze. Primește și programarea, ca autorizarea să se
 * facă ÎNAINTE de orice citire (fără „oracol” de existență a pozelor). Idempotentă.
 */
export async function stergePozaAction(
  programareId: string,
  pozaId: string
): Promise<{ success: true } | { error: string }> {
  if (!schemaId.safeParse(pozaId).success) return { error: "Poză invalidă." };

  const auth = await autorizeazaProgramare(programareId);
  if (!auth.ok) return { error: auth.error };
  const { ctx } = auth;
  if (ctx.impersonare) return { error: "În modul administrator pozele nu se pot șterge." };

  const db = createServiceClient();
  const { data, error } = await db
    .from("programari_poze")
    .update({ sters_la: new Date().toISOString(), motiv_stergere: "manual", sters_de: ctx.userId })
    .eq("id", pozaId)
    .eq("programare_id", ctx.programare.id)
    .is("sters_la", null)
    .select("r2_key, r2_key_thumb");

  if (error) {
    console.error("[PozeITP] stergere:", error.message);
    return { error: "Poza nu a putut fi ștearsă." };
  }

  // 0 rânduri = deja ștearsă (sau nu e a acestei programări): nimic de făcut.
  const chei = (data ?? []).flatMap((r) => (r.r2_key_thumb ? [r.r2_key, r.r2_key_thumb] : [r.r2_key]));
  if (chei.length) after(() => purjeazaChei(chei));

  return { success: true };
}
