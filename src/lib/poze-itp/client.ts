import type { QueryClient } from "@tanstack/react-query";
import { unstable_isUnrecognizedActionError } from "next/navigation";
import { toast } from "sonner";
import { comprimaPoza, EroareImagine } from "@/lib/imagini";
import { usePozeItpStore, type IncarcarePoza } from "@/stores/poze-itp-store";
import { confirmaIncarcarePozeAction, pregatesteIncarcarePozeAction } from "@/lib/actions/poze-itp";
import { createClient } from "@/lib/supabase/client";
import {
  POZE_MAX_ACTIVE,
  cheiePozeProgramare,
  formatPoze,
  type PozaDeDescarcat,
} from "@/lib/poze-itp/shared";
import {
  citesteInregistrari,
  noteazaComprimareEsuata,
  noteazaReincercare,
  salveazaImagine,
  salveazaInregistrari,
  salveazaRefuzAnuntat,
  salveazaUrcata,
  stergeInregistrari,
  stergeInregistrariVechi,
  type InregistrarePoza,
} from "@/lib/poze-itp/persistenta";

/**
 * Logica de browser pentru pozele ITP (fără React): coada de încărcare per
 * programare, PUT direct în R2 cu progres, arhiva ZIP și salvarea ei.
 * Componentele doar o apelează din handler-e.
 *
 * Încărcare, pe loturi de 5 poze: comprimare → URL-uri presemnate (server) →
 * PUT direct în R2 → confirmare (serverul verifică obiectul și salvează rândul).
 * Server Actions rulează pe rând pe client, deci un lot = două apeluri, oricâte poze.
 *
 * Până la confirmare, fiecare poză are o copie în IndexedDB (persistenta.ts): dacă
 * telefonul închide aplicația, PozeItpReluare o reia la următoarea deschidere (o poză a cărei
 * comprimare a eșuat revine cu „Reîncearcă”: utilizatorul a fost rugat să o refacă).
 * Erorile tranzitorii (rețea, URL expirat) se reiau singure la revenirea în aplicație —
 * de cel mult 3 ori la rând fără un PUT reușit (apoi doar câte o poză, ca probă): fiecare
 * reluare rezervă din nou octeții pozei din plafonul zilnic al proprietarului.
 */

const MESAJ_RETEA = "Fără conexiune la server. Reîncearcă.";
const MESAJ_PUT = "Încărcarea a eșuat. Verifică conexiunea.";
const MESAJ_NEVERIFICATE = "Pozele nu au putut fi verificate acum. Reîncearcă.";
const MESAJ_ACTUALIZARE = "Aplicația a fost actualizată. Reîncarcă pagina ca să continui.";
/** Poza păstrată după o comprimare eșuată, comprimată la o pornire ulterioară (vezi comprimariEsuate). */
const MESAJ_PASTRATA = "Poza nu s-a încărcat data trecută. Dacă nu ai refăcut-o, încarc-o acum.";
/** Erori întoarse de server după care o nouă încercare poate reuși (citire eșuată, nu refuz). */
const ERORI_SERVER_TRANZITORII = new Set([
  "A apărut o eroare. Încearcă din nou.",
  "Pozele au fost urcate, dar nu au putut fi salvate. Încearcă din nou.",
]);
/** Refuzuri definitive ale programării: copiile locale ale pozelor nu mai au unde ajunge. */
const REFUZURI_PROGRAMARE = new Set(["Acces interzis", "Programarea nu a fost găsită", "Programare invalidă"]);
/**
 * Refuzuri după care „Deschide programarea și apasă Reîncearcă” nu are sens: stocarea pozelor
 * oprită (secțiunea nu apare), angajatul fără permisiunea „programari”, contul suspendat sau
 * deconectat. Copiile locale rămân: se urcă singure după ce refuzul dispare.
 * Textele sunt identice cu cele din actions/poze-itp.ts și autorizare-programare.ts.
 */
const REFUZURI_FARA_SECTIUNE = new Set([
  "Stocarea pozelor nu este încă configurată.",
  "Nu ai permisiunea de a lucra cu programările",
  "Contul este suspendat",
  "Neautentificat",
]);
/** Câte poze se comprimă → presemnează → urcă → confirmă împreună. */
const LOT = 5;
/** Câte poze se urcă simultan în R2. */
const PARALEL_UPLOAD = 3;
/** Cât păstrăm pe telefon o poză care nu a ajuns pe server. */
const PASTRARE_LOCALA_MS = 7 * 24 * 60 * 60 * 1000;
/** Cât așteptăm, înainte de confirmare, scrierea cheilor în copia locală (nu blocăm încărcarea). */
const TERMEN_SCRIERE_CHEI_MS = 3_000;
/** Cât așteptăm citirea sesiunii din browser înaintea unei cereri la server (vezi verificaContulSesiunii). */
const TERMEN_CITIRE_SESIUNE_MS = 2_000;
/** Pauza dintre revenirea în aplicație / reconectare și reluarea automată. */
const PAUZA_RELUARE_MS = 1_500;
/** Câte reluări automate la rând primește o poză fără chei (fiecare rezervă din nou din plafonul zilnic). */
const RELUARI_AUTOMATE_MAX = 3;

// ── Utilitare ─────────────────────────────────────────────────────────────────

function store() {
  return usePozeItpStore.getState();
}

function lista(programareId: string): IncarcarePoza[] {
  return store().incarcari[programareId] ?? [];
}

function idLocal(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function asteapta(ms: number) {
  return new Promise<void>((rezolva) => setTimeout(rezolva, ms));
}

/** Rulează sarcinile cu limită de concurență; după prima eroare nu mai pornește altele. */
async function inParalel(sarcini: (() => Promise<void>)[], limita: number): Promise<void> {
  let urmatoarea = 0;
  let oprit = false;
  await Promise.all(
    Array.from({ length: Math.min(limita, sarcini.length) }, async () => {
      while (!oprit && urmatoarea < sarcini.length) {
        const i = urmatoarea++;
        try {
          await sarcini[i]();
        } catch (e) {
          oprit = true;
          throw e;
        }
      }
    })
  );
}

/**
 * Apelul unei Server Action a eșuat pentru că serverul nu o recunoaște: tab-ul
 * rulează o versiune mai veche a aplicației decât cea publicată. Reîncercarea nu
 * ajută (trimite același id), doar reîncărcarea paginii.
 */
export function esteActiuneNecunoscuta(e: unknown): boolean {
  try {
    if (typeof unstable_isUnrecognizedActionError === "function" && unstable_isUnrecognizedActionError(e)) {
      return true;
    }
  } catch {
    /* verificăm după nume */
  }
  return typeof e === "object" && e !== null && (e as { name?: unknown }).name === "UnrecognizedActionError";
}

/** Eroare după care o nouă încercare poate reuși (rețea, confirmare neverificată, citire eșuată pe server). */
function esteTranzitorie(mesaj: string): boolean {
  return mesaj === MESAJ_RETEA || mesaj === MESAJ_NEVERIFICATE || ERORI_SERVER_TRANZITORII.has(mesaj);
}

/**
 * Refuz al serverului care se repetă la fiecare încercare până se schimbă ceva în afara
 * aplicației (limită, plafon zilnic, cont suspendat, stocare oprită…): copia locală rămâne
 * și se reia la fiecare pornire.
 */
function esteRefuzDeDurata(mesaj: string): boolean {
  return mesaj !== MESAJ_ACTUALIZARE && !esteTranzitorie(mesaj) && !REFUZURI_PROGRAMARE.has(mesaj);
}

function momentFisier(fisier: File): number | null {
  return Number.isFinite(fisier.lastModified) && fisier.lastModified > 0 ? fisier.lastModified : null;
}

// ── Reîncărcarea URL-urilor după o imagine eșuată (cel mult o dată la 30 s) ─────

const ultimaReincarcare = new Map<string, number>();

/** true dacă putem cere din nou lista (URL-uri noi) pentru programare. */
export function poateReincarcaUrl(programareId: string, intervalMs = 30_000): boolean {
  const acum = Date.now();
  if (acum - (ultimaReincarcare.get(programareId) ?? 0) < intervalMs) return false;
  ultimaReincarcare.set(programareId, acum);
  return true;
}

// ── Vizibilitatea secțiunii (decide dacă anunțăm prin toast) ─────────────────────

const sectiuniVizibile = new Map<string, number>();

/** Apelat din efectul secțiunii; întoarce funcția de cleanup. */
export function marcheazaSectiuneVizibila(programareId: string): () => void {
  sectiuniVizibile.set(programareId, (sectiuniVizibile.get(programareId) ?? 0) + 1);
  return () => {
    const n = (sectiuniVizibile.get(programareId) ?? 1) - 1;
    if (n <= 0) sectiuniVizibile.delete(programareId);
    else sectiuniVizibile.set(programareId, n);
  };
}

// ── Avertizare la închiderea tab-ului cât timp se urcă poze (desktop) ───────────

const lucratoriActivi = new Set<string>();
let avertizareActiva = false;

function laInchidereTab(e: BeforeUnloadEvent) {
  e.preventDefault();
  e.returnValue = "";
}

function actualizeazaAvertizare() {
  if (typeof window === "undefined") return;
  const trebuie = lucratoriActivi.size > 0;
  if (trebuie && !avertizareActiva) {
    window.addEventListener("beforeunload", laInchidereTab);
    avertizareActiva = true;
  } else if (!trebuie && avertizareActiva) {
    window.removeEventListener("beforeunload", laInchidereTab);
    avertizareActiva = false;
  }
}

// ── Copia locală (IndexedDB) și blocările dintre taburi ─────────────────────────

/** Contul conectat (îl dă PozeItpReluare); până îl știm, pozele nu se copiază local. */
let utilizator: string | null = null;

/**
 * Crește la fiecare schimbare a contului în tab: lucrătorii porniți pentru contul anterior se
 * opresc (fără apeluri la server, fără modificări în store, fără toast-uri), iar copiile lor
 * locale rămân pentru următoarea conectare a contului lor.
 */
let generatieCont = 0;

/** Blocările Web Locks „poze-itp:<id>” ale acestui tab, ținute cât încărcarea e în store. */
const blocari = new Map<string, { eliberata: boolean; elibereaza: (() => void) | null }>();

function areBlocari(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.locks?.request === "function";
}

/**
 * Cere, fără așteptare, blocarea încărcării: true = o ține acest tab (până la
 * elibereazaBlocare), false = o ține alt tab, null = Web Locks indisponibil.
 */
function cereBlocare(id: string): Promise<boolean | null> {
  if (!areBlocari()) return Promise.resolve(null);
  if (blocari.has(id)) return Promise.resolve(false); // o ține (sau o cere) deja acest tab
  const blocare: { eliberata: boolean; elibereaza: (() => void) | null } = { eliberata: false, elibereaza: null };
  blocari.set(id, blocare);
  const renunta = () => {
    if (blocari.get(id) === blocare) blocari.delete(id);
  };
  return new Promise((rezolva) => {
    try {
      navigator.locks
        .request(`poze-itp:${id}`, { ifAvailable: true }, (lock) => {
          if (!lock || blocare.eliberata) {
            renunta();
            rezolva(false); // o ține alt tab, sau încărcarea a ieșit între timp din store
            return;
          }
          rezolva(true);
          return new Promise<void>((elibereaza) => {
            blocare.elibereaza = elibereaza;
          });
        })
        .catch(() => {
          renunta();
          rezolva(null);
        });
    } catch {
      renunta();
      rezolva(null);
    }
  });
}

function elibereazaBlocare(id: string) {
  const blocare = blocari.get(id);
  if (!blocare) return;
  blocari.delete(id);
  blocare.eliberata = true;
  blocare.elibereaza?.();
}

/** Scoate încărcările din store; copiile locale se șterg, apoi blocările se eliberează. */
function scoate(programareId: string, ids: string[]) {
  if (!ids.length) return;
  store().elimina(programareId, ids);
  void stergeInregistrari(ids).then(() => ids.forEach(elibereazaBlocare));
}

/** Copia locală a pozelor abia alese (fișierul original — comprimarea poate întârzia). */
function copiazaLocal(programareId: string, noi: IncarcarePoza[], eticheta: string | null) {
  const userId = utilizator;
  if (!userId) return;
  const creatLa = Date.now();
  void salveazaInregistrari(
    noi.flatMap((i): InregistrarePoza[] =>
      i.fisier
        ? [
            {
              id: i.id,
              userId,
              programareId,
              nrInmatriculare: eticheta,
              creatLa,
              facutaLa: momentFisier(i.fisier),
              fisier: i.fisier,
            },
          ]
        : []
    )
  );
}

/**
 * Încărcarea din store refăcută dintr-o copie locală (sau null dacă nu conține nicio poză). O copie
 * păstrată după o comprimare eșuată și deja comprimată (anunțată la pornirea anterioară) revine ca
 * dală cu „Reîncearcă”, fără toast: nu se urcă singură.
 */
function dinInregistrare(r: InregistrarePoza): IncarcarePoza | null {
  const baza = { id: r.id, stare: "coada" as const, progres: 0, eroare: null };
  if (r.imagine && r.imagine.full instanceof Blob) {
    const imagine = { ...r.imagine, thumb: r.imagine.thumb instanceof Blob ? r.imagine.thumb : null, facutaLa: r.facutaLa };
    let previewUrl: string | null = null;
    try {
      previewUrl = URL.createObjectURL(imagine.thumb ?? imagine.full);
    } catch {
      /* fără previzualizare */
    }
    const incarcare = { ...baza, previewUrl, fisier: null, imagine, urcata: r.urcata ?? null };
    return r.comprimareEsuata ? { ...incarcare, stare: "eroare", eroare: MESAJ_PASTRATA, tranzitorie: false } : incarcare;
  }
  if (r.fisier instanceof Blob) return { ...baza, previewUrl: null, fisier: r.fisier, imagine: null, urcata: null };
  return null;
}

/** Alt cont s-a conectat în același tab: încărcările contului anterior ies din store (copiile locale rămân ale lui). */
function uitaIncarcarileDinTab() {
  generatieCont++;
  for (const [programareId, incarcari] of Object.entries(store().incarcari)) {
    const ids = incarcari.map((i) => i.id);
    store().elimina(programareId, ids);
    ids.forEach(elibereazaBlocare);
  }
}

/**
 * Sesiunea din browser s-a schimbat (deconectare, alt cont — și dintr-un alt tab): încărcările
 * contului anterior se opresc înainte ca altă sesiune să poată trimite cereri în numele lui.
 * Copiile lor locale rămân și se reiau la următoarea lui conectare. Apelată din PozeItpReluare
 * și de verificaContulSesiunii.
 */
export function opresteIncarcarileContului(userId: string | null) {
  if (!utilizator || utilizator === userId) return;
  uitaIncarcarileDinTab();
  utilizator = null;
}

/**
 * Intrarea adminului în contul unui utilizator și ieșirea din el (impersonarea) schimbă cookie-urile de
 * sesiune pe server, fără niciun eveniment în browser (pe paginile de admin PozeItpReluare nici nu e
 * montată), iar o cerere care a așteptat în coada Server Actions pleacă deja cu cookie-urile noului cont.
 * Înaintea cererilor la server și înainte de a folosi un refuz: dacă sesiunea din browser (citită din
 * cookie, fără rețea cât tokenul e valabil) e a altui cont, lucrătorii se opresc ca la orice schimbare de
 * cont, iar copiile rămân ale contului lor. Cont necunoscut încă, fără sesiune (serverul refuză
 * „Neautentificat”, copiile rămân) sau sesiune necitită (reîmprospătare eșuată): ca până acum, și ca durată.
 * Tot necitită contează fără rețea (nicio cerere nu pleacă, deci nu o citim) și fără răspuns în
 * TERMEN_CITIRE_SESIUNE_MS: cu tokenul expirat, auth-js îl reîmprospătează, iar fără internet reîncercările
 * lui (la rând cu cele automate) țin minute întregi, cu pozele la „0%”. Citirea rămasă se termină în auth-js.
 */
async function verificaContulSesiunii(): Promise<void> {
  const cont = utilizator;
  if (!cont) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  try {
    const r = await Promise.race([
      createClient().auth.getSession(),
      asteapta(TERMEN_CITIRE_SESIUNE_MS).then(() => null),
    ]);
    if (!r) return; // fără răspuns la timp: ca o sesiune necitită
    const { data, error } = r;
    const actual = data.session?.user.id;
    if (error || !actual || actual === cont) return;
    if (utilizator === cont) opresteIncarcarileContului(actual); // contul tabului nu s-a schimbat între timp
  } catch {
    /* sesiunea nu a putut fi citită */
  }
}

let reluareFacuta = false;
let clientReluare: QueryClient | null = null;

/** Contul tabului: pozele noi se copiază local sub el. Alt cont decât cel de până acum: încărcările lui ies din tab. */
function seteazaContul(userId: string, queryClient: QueryClient) {
  if (utilizator && utilizator !== userId) uitaIncarcarileDinTab();
  utilizator = userId;
  clientReluare = queryClient;
  pornesteAscultareReluare();
}

/**
 * Reia pozele utilizatorului rămase neîncărcate (copiile din IndexedDB): la
 * deschiderea aplicației (PozeItpReluare) și, cu Web Locks, la revenirea în ea.
 * O copie e preluată de un singur tab — cel care obține blocarea „poze-itp:<id>”
 * (două reluări simultane nu pot lua aceeași poză); fără Web Locks, doar la
 * încărcarea paginii.
 */
export function reiaIncarcarileSalvate(userId: string, queryClient: QueryClient): Promise<void> {
  seteazaContul(userId, queryClient);
  if (reluareFacuta && !areBlocari()) return Promise.resolve();
  reluareFacuta = true;
  return reia(userId, queryClient).catch((e) => console.error("[PozeITP] reluare:", e));
}

/**
 * Sesiune nouă fără remontarea PozeItpReluare (deconectare și reconectare, sau alt cont, într-un alt
 * tab): contul revine tabului — pozele noi au din nou copie locală, iar copiile lui se reiau. Contul
 * tabului: nimic (auth-js trimite SIGNED_IN la fiecare revenire într-un tab, către toate taburile).
 * Un tab din fundal doar reține contul, iar copiile se reiau la revenirea în el (reiaEroriTranzitorii):
 * nu le ține blocate un tab pe care telefonul îl poate îngheța.
 */
export function activeazaContul(userId: string, queryClient: QueryClient) {
  if (utilizator === userId) return;
  if (document.visibilityState === "hidden" && areBlocari()) seteazaContul(userId, queryClient);
  else void reiaIncarcarileSalvate(userId, queryClient);
}

async function reia(userId: string, queryClient: QueryClient) {
  await stergeInregistrariVechi(PASTRARE_LOCALA_MS);
  const inTab = new Set(Object.values(store().incarcari).flatMap((l) => l.map((i) => i.id)));
  const preluate: string[] = [];
  for (const r of await citesteInregistrari(userId)) {
    if (inTab.has(r.id)) continue; // o încarcă deja acest tab
    if ((await cereBlocare(r.id)) === false) continue; // o încarcă alt tab
    preluate.push(r.id);
  }
  if (!preluate.length) return;

  // Recitim DUPĂ blocare: tabul care le avea poate să le fi salvat și șters (sau să fi
  // scris cheile) între prima citire și eliberarea blocării — o copie veche ar urca a doua oară.
  const actuale = new Map((await citesteInregistrari(userId)).map((r) => [r.id, r]));
  // Sesiunea poate fi a altui cont fără niciun eveniment în tab (impersonarea): copiile nu se preiau sub ea.
  await verificaContulSesiunii();
  if (utilizator !== userId) {
    preluate.forEach(elibereazaBlocare); // s-a conectat alt cont între timp
    return;
  }
  const peProgramari = new Map<string, { eticheta: string | null; incarcari: IncarcarePoza[] }>();
  for (const id of preluate) {
    const r = actuale.get(id);
    if (!r) {
      elibereazaBlocare(id); // salvată între timp
      continue;
    }
    const incarcare = dinInregistrare(r);
    if (!incarcare) {
      scoate(r.programareId, [id]); // copie fără poză
      continue;
    }
    if (r.refuzAnuntat) refuzuriAnuntate.set(id, r.refuzAnuntat);
    if (r.comprimareEsuata) comprimariEsuate.add(id);
    const grup = peProgramari.get(r.programareId) ?? { eticheta: r.nrInmatriculare ?? null, incarcari: [] };
    grup.incarcari.push(incarcare);
    peProgramari.set(r.programareId, grup);
  }

  for (const [programareId, { eticheta, incarcari }] of peProgramari) {
    store().adauga(programareId, incarcari);
    pornesteLucrator(programareId, queryClient, eticheta);
  }
}

// ── Reluarea automată a erorilor tranzitorii (suspendare, reconectare) ─────────

/** Ultimul context cu care a pornit lucrătorul fiecărei programări. */
const contexte = new Map<string, { queryClient: QueryClient; eticheta: string | null }>();
let ascultareReluare = false;
let temporizatorReluare: ReturnType<typeof setTimeout> | null = null;

/** Revenire în aplicație, pagină restaurată, rețea înapoi: o singură reluare, după o pauză scurtă. */
function programeazaReluare() {
  if (document.visibilityState === "hidden") return;
  if (temporizatorReluare) clearTimeout(temporizatorReluare);
  temporizatorReluare = setTimeout(() => {
    temporizatorReluare = null;
    void reiaEroriTranzitorii();
  }, PAUZA_RELUARE_MS);
}

/** Doar erorile tranzitorii ale pozelor comprimate se reiau singure: un refuz al serverului s-ar repeta la nesfârșit. */
function seReiaSingura(i: IncarcarePoza): boolean {
  return i.stare === "eroare" && !!i.tranzitorie && !!i.imagine;
}

async function reiaEroriTranzitorii() {
  if (document.visibilityState === "hidden" || navigator.onLine === false) return; // reluăm la revenire
  // Sesiunea a trecut între timp pe alt cont (impersonare): pozele contului tabului nu se reiau sub el. Fără nicio
  // poză de reluat (de ex. cât stocarea pozelor e oprită) sesiunea nu se citește; pentru copiile salvate o citește
  // reia(), înainte să le preia.
  const deReluat = Object.entries(store().incarcari).some(
    ([programareId, incarcari]) => contexte.has(programareId) && incarcari.some(seReiaSingura)
  );
  if (deReluat) await verificaContulSesiunii();
  // Cu reluările tuturor epuizate, o singură poză („sonda”) mai încearcă la fiecare revenire: dacă
  // PUT-ul ei reușește, R2 răspunde din nou și reseteazaReluarile le pornește pe toate.
  let sonda: (() => void) | null = null;
  let cuPut = false;
  for (const [programareId, incarcari] of Object.entries(store().incarcari)) {
    const context = contexte.get(programareId);
    if (!context) continue;
    for (const i of incarcari) {
      if (!seReiaSingura(i)) continue;
      // Fără chei, reluarea cere URL-uri noi, adică rezervă din nou octeții din plafonul zilnic al
      // proprietarului: cel mult RELUARI_AUTOMATE_MAX la rând, până când un PUT reușește din nou.
      const reluari = i.urcata ? 0 : (i.reluariAutomate ?? 0) + 1;
      if (reluari <= RELUARI_AUTOMATE_MAX) {
        repuneInCoada(programareId, i.id, context.queryClient, context.eticheta, reluari);
        cuPut ||= !i.urcata; // PUT-ul ei arată și el dacă R2 răspunde
      } else {
        sonda ??= () => repuneInCoada(programareId, i.id, context.queryClient, context.eticheta, RELUARI_AUTOMATE_MAX);
      }
    }
  }
  if (!cuPut) sonda?.();
  // Cu Web Locks, preluăm și pozele rămase de la un tab închis între timp.
  if (utilizator && clientReluare && areBlocari()) void reiaIncarcarileSalvate(utilizator, clientReluare);
}

function pornesteAscultareReluare() {
  if (ascultareReluare || typeof window === "undefined" || typeof document === "undefined") return;
  ascultareReluare = true;
  window.addEventListener("online", programeazaReluare);
  window.addEventListener("pageshow", programeazaReluare);
  document.addEventListener("visibilitychange", programeazaReluare);
}

// ── PUT în R2 cu progres (XMLHttpRequest — fetch nu raportează progresul upload-ului) ──

class EroarePut extends Error {
  status: number;
  constructor(status: number) {
    super(`PUT ${status}`);
    this.status = status;
  }
}

function put(url: string, blob: Blob, laProgres: (incarcat: number) => void): Promise<void> {
  return new Promise((rezolva, respinge) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", "image/jpeg"); // identic cu cel semnat
    xhr.timeout = 120_000;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) laProgres(e.loaded);
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? rezolva() : respinge(new EroarePut(xhr.status)));
    xhr.onerror = () => respinge(new EroarePut(0)); // rețea sau CORS
    xhr.ontimeout = () => respinge(new EroarePut(0));
    xhr.onabort = () => respinge(new EroarePut(0));
    xhr.send(blob);
  });
}

/**
 * Până la 3 încercări la erori de rețea / 5xx / 429. Un 4xx (URL expirat, semnătură) nu se reîncearcă.
 * Întoarce null dacă PUT-ul a reușit, altfel statusul ultimei încercări (0 = rețea).
 */
async function putCuReincercare(
  url: string,
  blob: Blob,
  laProgres: (incarcat: number) => void
): Promise<number | null> {
  let status = 0;
  for (let incercare = 0; incercare < 3; incercare++) {
    if (incercare > 0) {
      await asteapta(800 * incercare);
      laProgres(0);
    }
    try {
      await put(url, blob, laProgres);
      return null;
    } catch (e) {
      status = e instanceof EroarePut ? e.status : 0;
      if (status >= 400 && status < 500 && status !== 429) return status;
    }
  }
  return status;
}

// ── Coada de încărcare ──────────────────────────────────────────────────────────

export interface OptiuniAdaugare {
  /** Locuri libere până la limita de 40; null dacă lista nu s-a încărcat încă (decide serverul). */
  locuriLibere: number | null;
  /** Nr. de înmatriculare, pentru toast-urile afișate cu sertarul închis. */
  eticheta: string | null;
}

/** Pune fișierele în coada programării și pornește procesarea. Întoarce câte au fost acceptate. */
export function adaugaPoze(
  programareId: string,
  fisiere: File[],
  queryClient: QueryClient,
  optiuni: OptiuniAdaugare
): number {
  if (!fisiere.length) return 0;
  let acceptate = fisiere;
  if (optiuni.locuriLibere !== null) {
    if (optiuni.locuriLibere <= 0) {
      toast.error(`Programarea are deja ${formatPoze(POZE_MAX_ACTIVE)}. Descarcă sau șterge din ele înainte de a adăuga altele.`);
      return 0;
    }
    if (fisiere.length > optiuni.locuriLibere) {
      acceptate = fisiere.slice(0, optiuni.locuriLibere);
      toast.warning(`Se încarcă doar ${formatPoze(acceptate.length)} — limita este de ${POZE_MAX_ACTIVE} pe programare.`);
    }
  }

  const noi: IncarcarePoza[] = acceptate.map((fisier) => ({
    id: idLocal(),
    stare: "coada" as const,
    progres: 0,
    previewUrl: null,
    eroare: null,
    fisier,
    imagine: null,
    urcata: null,
  }));
  store().adauga(programareId, noi);
  for (const i of noi) void cereBlocare(i.id); // alt tab nu o preia din copia locală
  copiazaLocal(programareId, noi, optiuni.eticheta);
  pornesteLucrator(programareId, queryClient, optiuni.eticheta);
  return acceptate.length;
}

/** Reîncearcă o poză eșuată (după comprimare). Fără poză comprimată, o scoate din listă. */
export function reincearcaIncarcarea(
  programareId: string,
  id: string,
  queryClient: QueryClient,
  eticheta: string | null
) {
  // Copie păstrată după o comprimare eșuată: utilizatorul a ales să o urce, de acum se reia ca oricare alta.
  if (comprimariEsuate.delete(id)) void noteazaReincercare(id);
  repuneInCoada(programareId, id, queryClient, eticheta, 0); // cerută de utilizator: reluările automate o iau de la capăt
}

function repuneInCoada(
  programareId: string,
  id: string,
  queryClient: QueryClient,
  eticheta: string | null,
  reluariAutomate: number
) {
  const incarcare = lista(programareId).find((i) => i.id === id);
  if (!incarcare || incarcare.stare !== "eroare") return;
  if (!incarcare.imagine) {
    scoate(programareId, [id]);
    return;
  }
  store().actualizeaza(programareId, id, {
    stare: "coada",
    eroare: null,
    progres: 0,
    tranzitorie: false,
    actualizareAplicatie: false,
    reluariAutomate,
  });
  pornesteLucrator(programareId, queryClient, eticheta);
}

/** Un PUT a reușit (R2 răspunde): pozele oprite din reluarea automată o primesc din nou și se reiau. */
function reseteazaReluarile() {
  let oprite = false;
  for (const [programareId, incarcari] of Object.entries(store().incarcari)) {
    for (const i of incarcari) {
      if (!i.reluariAutomate) continue;
      if (i.reluariAutomate >= RELUARI_AUTOMATE_MAX && i.stare === "eroare" && i.tranzitorie) oprite = true;
      store().actualizeaza(programareId, i.id, { reluariAutomate: 0 });
    }
  }
  if (oprite) programeazaReluare();
}

export function renuntaLaIncarcare(programareId: string, id: string) {
  scoate(programareId, [id]);
}

/** Renunțările pe programare în acest tab: lucrătorul pornit înaintea uneia se oprește (vezi proceseazaCoada). */
const renuntari = new Map<string, number>();

/**
 * Programarea a fost ștearsă (sertarul, după confirmare): încărcările ei ies din store, copiile locale se
 * șterg, iar lucrătorul ei se oprește la următorul pas — fără cereri la server și fără toast-uri, ca la
 * schimbarea contului. Un PUT deja pornit se termină (obiectul rămâne orfan, șters de regula de lifecycle).
 */
export function renuntaLaIncarcarileProgramarii(programareId: string) {
  renuntari.set(programareId, (renuntari.get(programareId) ?? 0) + 1);
  scoate(programareId, lista(programareId).map((i) => i.id));
}

function pornesteLucrator(programareId: string, queryClient: QueryClient, eticheta: string | null) {
  contexte.set(programareId, { queryClient, eticheta: eticheta ?? contexte.get(programareId)?.eticheta ?? null });
  pornesteAscultareReluare();
  if (lucratoriActivi.has(programareId)) return; // lucrătorul existent preia și pozele noi
  lucratoriActivi.add(programareId);
  actualizeazaAvertizare();
  void proceseazaCoada(programareId, queryClient, eticheta)
    .catch((e) => console.error("[PozeITP] coada:", e))
    .finally(() => {
      lucratoriActivi.delete(programareId);
      actualizeazaAvertizare();
      if (lista(programareId).some((i) => i.stare === "coada")) pornesteLucrator(programareId, queryClient, eticheta);
    });
}

/** Implicit: eroare definitivă (fără reluare automată); apelantul spune dacă e tranzitorie. */
function marcheazaEroare(programareId: string, ids: string[], eroare: string, extra: Partial<IncarcarePoza> = {}) {
  for (const id of ids) {
    store().actualizeaza(programareId, id, {
      stare: "eroare",
      eroare,
      progres: 0,
      tranzitorie: false,
      actualizareAplicatie: false,
      ...extra,
    });
  }
}

/** Programarea refuză definitiv (ștearsă, fără acces): copiile locale nu mai au unde ajunge. */
function uitaDacaRefuzata(eroare: string, ids: string[]) {
  if (REFUZURI_PROGRAMARE.has(eroare)) void stergeInregistrari(ids);
}

/** Refuzul de durată anunțat deja pentru fiecare poză (citit și din copia ei locală, la reluare). */
const refuzuriAnuntate = new Map<string, string>();

/**
 * Pozele reluate din copii păstrate după o comprimare eșuată (anunțată atunci, cu sfatul de a reface
 * poza): nu se urcă singure, iar o nouă eșuare a comprimării nu mai e anunțată.
 */
const comprimariEsuate = new Set<string>();

/**
 * Un refuz de durată (vezi esteRefuzDeDurata) se repetă la fiecare pornire a aplicației, cât
 * timp copia locală așteaptă: fiecare poză îl anunță o singură dată, nu la fiecare pornire.
 * Întoarce câte dintre poze îl anunțaseră deja.
 */
function refuzuriDejaAnuntate(ids: string[], refuz: string): number {
  if (!esteRefuzDeDurata(refuz)) return 0;
  let anuntate = 0;
  for (const id of ids) {
    if (refuzuriAnuntate.get(id) === refuz) {
      anuntate++;
      continue;
    }
    refuzuriAnuntate.set(id, refuz);
    void salveazaRefuzAnuntat(id, refuz);
  }
  return anuntate;
}

async function proceseazaCoada(programareId: string, queryClient: QueryClient, eticheta: string | null) {
  // Alt cont conectat între timp în tab (vezi generatieCont) sau programarea ștearsă din sertar (vezi
  // renuntari): lucrătorul se oprește.
  const generatie = generatieCont;
  const renuntare = renuntari.get(programareId) ?? 0;
  const contSchimbat = () => generatieCont !== generatie || (renuntari.get(programareId) ?? 0) !== renuntare;
  let salvate = 0;
  let esuate = 0;
  // Din eșecuri: la comprimare (fără „Reîncearcă”), din cauza unei versiuni vechi a aplicației și
  // anunțate deja (fără toast la fiecare pornire): refuzuri de durată și comprimări care eșuează din
  // nou la reluarea copiei păstrate.
  let esuateProcesare = 0;
  let esuateActualizare = 0;
  let esuateAnuntate = 0;
  let listaNeactualizata = false;
  const mesaje = new Set<string>();

  for (;;) {
    if (contSchimbat()) return;
    const lot = lista(programareId)
      .filter((i) => i.stare === "coada")
      .slice(0, LOT);
    if (!lot.length) break;

    const pregatite: IncarcarePoza[] = [];
    for (const incarcare of lot) {
      if (incarcare.imagine) {
        pregatite.push(incarcare); // reîncercare — deja comprimată
        continue;
      }
      if (!incarcare.fisier) {
        marcheazaEroare(programareId, [incarcare.id], "Fișier lipsă.");
        esuate++;
        esuateProcesare++;
        continue;
      }
      store().actualizeaza(programareId, incarcare.id, { stare: "comprimare" });
      try {
        const imagine = await comprimaPoza(incarcare.fisier);
        if (contSchimbat()) {
          void salveazaImagine(incarcare.id, imagine); // copia contului care a făcut poza, gata comprimată
          return;
        }
        const previewUrl = URL.createObjectURL(imagine.thumb ?? imagine.full);
        if (comprimariEsuate.has(incarcare.id)) {
          // Utilizatorul a fost rugat atunci să o refacă: urcată singură ar putea apărea de două ori.
          // Rămâne cu „Reîncearcă” (anunțată acum, o dată; copia ei comprimată își păstrează marcajul).
          esuate++;
          mesaje.add(MESAJ_PASTRATA);
          marcheazaEroare(programareId, [incarcare.id], MESAJ_PASTRATA, { imagine, previewUrl, fisier: null });
          void salveazaImagine(incarcare.id, imagine);
          continue;
        }
        store().actualizeaza(programareId, incarcare.id, { imagine, previewUrl, fisier: null });
        void salveazaImagine(incarcare.id, imagine);
        pregatite.push({ ...incarcare, imagine, previewUrl, fisier: null });
      } catch (e) {
        if (contSchimbat()) return; // copia (fișierul original) rămâne contului care a făcut poza
        esuate++;
        esuateProcesare++;
        // Copia păstrată eșuează din nou: eșecul a fost anunțat data trecută, acum copia se șterge.
        const repetata = comprimariEsuate.delete(incarcare.id);
        if (repetata) esuateAnuntate++;
        const mesaj = e instanceof EroareImagine ? e.message : "Poza nu a putut fi procesată.";
        if (!repetata) mesaje.add(mesaj);
        marcheazaEroare(programareId, [incarcare.id], mesaj, { fisier: null });
        // Format, fișier gol / prea mare: s-ar repeta, copia nu mai ajută. Altfel (memorie, canvas,
        // decodare) copia rămâne până la „Renunță”: la următoarea pornire poza se recomprimă — o dată —
        // și așteaptă „Reîncearcă” (poate a fost refăcută între timp).
        if (e instanceof EroareImagine && e.definitiva) void stergeInregistrari([incarcare.id]);
        else void noteazaComprimareEsuata(incarcare.id);
      }
    }

    if (pregatite.length) {
      try {
        const r = await trimiteLot(programareId, pregatite, queryClient, contSchimbat);
        salvate += r.salvate;
        esuate += r.esuate;
        esuateActualizare += r.actualizare;
        esuateAnuntate += r.anuntate;
        listaNeactualizata ||= r.listaNeactualizata;
        r.mesaje.forEach((m) => mesaje.add(m));
      } catch (e) {
        // Neprevăzut: nicio poză nu rămâne blocată în „Se încarcă”.
        console.error("[PozeITP] lot:", e);
        if (contSchimbat()) return;
        const blocate = pregatite
          .map((p) => lista(programareId).find((i) => i.id === p.id))
          .filter((i): i is IncarcarePoza => !!i && i.stare !== "eroare");
        esuate += blocate.length;
        marcheazaEroare(programareId, blocate.map((i) => i.id), "A apărut o eroare. Reîncearcă.");
      }
    }
  }

  if (contSchimbat()) return; // toast-urile ar ajunge la contul conectat acum
  // Cu secțiunea pe ecran, dalele spun deja totul; anunțăm doar dacă sertarul nu mai e deschis pe ea.
  // Excepție: lista nu s-a reîncărcat după salvare — fără toast, pozele salvate ar părea pierdute.
  const vizibila = (sectiuniVizibile.get(programareId) ?? 0) > 0;
  if (vizibila && !listaNeactualizata) return;
  const descriere = eticheta ? `Programarea ${eticheta}` : undefined;
  if (salvate > 0) {
    toast.success(`${formatPoze(salvate)} ${salvate === 1 ? "salvată" : "salvate"}`, {
      id: `poze-itp-${programareId}`,
      description: descriere,
    });
  }
  // Doar refuzuri anunțate deja (copiile așteaptă să dispară refuzul): fără toast la fiecare pornire.
  if (esuate > esuateAnuntate && !vizibila) {
    // Programarea ștearsă sau fără acces, stocarea oprită, contul fără drept sau deconectat:
    // „Reîncearcă” nu ar ajuta, mesajul serverului spune de ce.
    const refuz = [...mesaje].find((m) => REFUZURI_PROGRAMARE.has(m) || REFUZURI_FARA_SECTIUNE.has(m));
    const indiciu =
      esuateActualizare > 0 || refuz
        ? null // mesajul spune deja ce e de făcut
        : esuate > esuateProcesare
          ? "Deschide programarea și apasă „Reîncearcă”."
          : "Alege altă poză sau fă una nouă.";
    toast.error(`${formatPoze(esuate)} nu ${esuate === 1 ? "a putut fi încărcată" : "au putut fi încărcate"}`, {
      id: `poze-itp-eroare-${programareId}`,
      description: [descriere, esuateActualizare > 0 ? MESAJ_ACTUALIZARE : (refuz ?? [...mesaje][0]), indiciu]
        .filter(Boolean)
        .join(" · "),
    });
  }
}

type Urcata = { incarcare: IncarcarePoza; cheie: string; cheieThumb: string | null };

async function trimiteLot(
  programareId: string,
  lot: IncarcarePoza[],
  queryClient: QueryClient,
  contSchimbat: () => boolean
): Promise<{
  salvate: number;
  esuate: number;
  actualizare: number;
  anuntate: number;
  listaNeactualizata: boolean;
  mesaje: string[];
}> {
  const mesaje = new Set<string>();
  /** Câte poze din lot așteaptă reîncărcarea paginii (aplicație actualizată). */
  const actualizare = () =>
    lot.filter((i) => lista(programareId).some((x) => x.id === i.id && x.actualizareAplicatie)).length;

  // Cele deja urcate (reîncercare după o confirmare eșuată) sar direct la confirmare.
  const urcate: Urcata[] = [];
  const deUrcat: IncarcarePoza[] = [];
  for (const i of lot) {
    if (i.urcata) {
      store().actualizeaza(programareId, i.id, { stare: "salvare", progres: 1 });
      urcate.push({ incarcare: i, ...i.urcata });
    } else {
      store().actualizeaza(programareId, i.id, { stare: "incarcare", progres: 0 });
      deUrcat.push(i);
    }
  }

  // Refuzuri de durată anunțate deja de poze (vezi refuzuriDejaAnuntate).
  let anuntate = deUrcat.length ? await urca(programareId, deUrcat, urcate, mesaje, contSchimbat) : 0;
  if (contSchimbat()) return { salvate: 0, esuate: 0, actualizare: 0, anuntate: 0, listaNeactualizata: false, mesaje: [] };

  let esuate = lot.length - urcate.length;
  if (!urcate.length) {
    return { salvate: 0, esuate, actualizare: actualizare(), anuntate, listaNeactualizata: false, mesaje: [...mesaje] };
  }

  // Confirmare: serverul verifică obiectele și salvează rândurile. Idempotentă, deci
  // o reluăm la erori de rețea și pentru pozele pe care serverul nu le-a putut verifica încă.
  let deConfirmat = urcate;
  let ultimaEroare: string | null = null;
  let aplicatieVeche = false;
  const salvateIds: string[] = [];
  for (let incercare = 0; incercare < 3 && deConfirmat.length; incercare++) {
    if (incercare > 0) await asteapta(1500 * incercare);
    await verificaContulSesiunii();
    if (contSchimbat()) break; // cererea ar pleca în numele altui cont
    let r: Awaited<ReturnType<typeof confirmaIncarcarePozeAction>>;
    try {
      r = await confirmaIncarcarePozeAction(
        programareId,
        deConfirmat.map((u) => ({
          cheie: u.cheie,
          cheieThumb: u.cheieThumb,
          facutaLa: u.incarcare.imagine?.facutaLa ?? null,
          latime: u.incarcare.imagine?.latime ?? null,
          inaltime: u.incarcare.imagine?.inaltime ?? null,
        }))
      );
    } catch (e) {
      if (esteActiuneNecunoscuta(e)) {
        aplicatieVeche = true; // același id de acțiune la fiecare reîncercare: degeaba
        break;
      }
      r = { error: MESAJ_RETEA };
    }
    if ("error" in r) {
      await verificaContulSesiunii(); // refuzul poate fi al altui cont (vezi urca)
      if (contSchimbat()) break;
      ultimaEroare = r.error;
      if (!esteTranzitorie(r.error)) break; // refuz: aceeași cerere ar primi același răspuns
      continue;
    }

    const confirmate = new Set(r.confirmate);
    const motive = new Map(r.respinse.map((x) => [x.cheie, x.motiv]));
    const reluate = new Set(r.reincearca);
    for (const u of deConfirmat) {
      if (confirmate.has(u.cheie)) {
        salvateIds.push(u.incarcare.id);
      } else if (!reluate.has(u.cheie) && !contSchimbat()) {
        // Respinsă de server: la reîncercare se urcă din nou, cu chei noi.
        const motiv = motive.get(u.cheie) ?? "Poza nu a putut fi salvată.";
        esuate++;
        mesaje.add(motiv);
        marcheazaEroare(programareId, [u.incarcare.id], motiv, { urcata: null });
        void salveazaUrcata(u.incarcare.id, null);
      }
    }
    deConfirmat = deConfirmat.filter((u) => reluate.has(u.cheie));
    ultimaEroare = deConfirmat.length ? MESAJ_NEVERIFICATE : null;
  }

  // Salvate: copia locală nu mai trebuie (o reluare după o închidere ar reconfirma oricum, idempotent).
  const copiiSterse = stergeInregistrari(salvateIds);

  // Răspunsul poate veni după schimbarea contului: nimic marcat, copiile (cu cheile) rămân contului lor.
  if (deConfirmat.length && !contSchimbat()) {
    // Obiectele sunt în R2: „Reîncearcă” reia doar confirmarea (urcata rămâne setată).
    const mesaj = aplicatieVeche ? MESAJ_ACTUALIZARE : (ultimaEroare ?? MESAJ_RETEA);
    const ids = deConfirmat.map((u) => u.incarcare.id);
    esuate += deConfirmat.length;
    mesaje.add(mesaj);
    marcheazaEroare(
      programareId,
      ids,
      mesaj,
      aplicatieVeche ? { actualizareAplicatie: true } : { tranzitorie: esteTranzitorie(mesaj) }
    );
    uitaDacaRefuzata(mesaj, ids);
    anuntate += refuzuriDejaAnuntate(ids, mesaj);
  }

  let listaNeactualizata = false;
  if (salvateIds.length) {
    // Întâi reîncărcăm lista (apar miniaturile reale), apoi scoatem previzualizările: fără pâlpâire.
    try {
      await queryClient.invalidateQueries({ queryKey: cheiePozeProgramare(programareId) }, { throwOnError: true });
    } catch {
      listaNeactualizata = true; // pozele sunt salvate; lista se reîncarcă la următoarea cerere reușită
    }
    store().elimina(programareId, salvateIds);
    void copiiSterse.then(() => salvateIds.forEach(elibereazaBlocare));
  }
  return {
    salvate: salvateIds.length,
    esuate,
    actualizare: actualizare(),
    anuntate,
    listaNeactualizata,
    mesaje: [...mesaje],
  };
}

/**
 * URL-uri PUT presemnate (un apel pentru tot lotul), apoi PUT direct în R2.
 * Întoarce câte poze anunțaseră deja refuzul serverului (vezi refuzuriDejaAnuntate).
 */
async function urca(
  programareId: string,
  lot: IncarcarePoza[],
  urcate: Urcata[],
  mesaje: Set<string>,
  contSchimbat: () => boolean
): Promise<number> {
  let pregatire: Awaited<ReturnType<typeof pregatesteIncarcarePozeAction>>;
  let aplicatieVeche = false;
  await verificaContulSesiunii();
  if (contSchimbat()) return 0; // cererea ar pleca în numele altui cont
  try {
    pregatire = await pregatesteIncarcarePozeAction(
      programareId,
      lot.map((i) => ({
        mime: "image/jpeg" as const,
        marime: i.imagine?.full.size ?? 0,
        marimeThumb: i.imagine?.thumb?.size ?? null,
      }))
    );
  } catch (e) {
    aplicatieVeche = esteActiuneNecunoscuta(e);
    pregatire = { error: aplicatieVeche ? MESAJ_ACTUALIZARE : MESAJ_RETEA };
  }
  if (contSchimbat()) return 0; // alt cont între timp: nimic marcat, copiile rămân contului lor
  if ("error" in pregatire) {
    // Cererea poate să fi plecat cu cookie-urile altui cont (a așteptat în coada Server Actions, de ex. în
    // spatele ieșirii din impersonare): refuzul nu ar fi al acestor poze.
    await verificaContulSesiunii();
    if (contSchimbat()) return 0;
    const ids = lot.map((i) => i.id);
    mesaje.add(pregatire.error);
    marcheazaEroare(
      programareId,
      ids,
      pregatire.error,
      aplicatieVeche ? { actualizareAplicatie: true } : { tranzitorie: esteTranzitorie(pregatire.error) }
    );
    uitaDacaRefuzata(pregatire.error, ids);
    return refuzuriDejaAnuntate(ids, pregatire.error);
  }
  const { incarcari } = pregatire;

  await inParalel(
    lot.map((incarcare, k) => async () => {
      if (contSchimbat()) return;
      const imagine = incarcare.imagine;
      const tinta = incarcari[k];
      if (!imagine || !tinta) {
        marcheazaEroare(programareId, [incarcare.id], MESAJ_PUT);
        return;
      }
      const total = imagine.full.size + (imagine.thumb?.size ?? 0);
      let urcatFull = 0;
      let urcatThumb = 0;
      let ultimaRaportare = 0;
      const raporteaza = () => {
        const acum = performance.now();
        if (acum - ultimaRaportare < 120 || contSchimbat()) return; // nu re-randăm la fiecare eveniment XHR
        ultimaRaportare = acum;
        store().actualizeaza(programareId, incarcare.id, {
          progres: Math.min(0.99, (urcatFull + urcatThumb) / total),
        });
      };

      const [eroareFull, okThumb] = await Promise.all([
        putCuReincercare(tinta.urlPut, imagine.full, (n) => {
          urcatFull = n;
          raporteaza();
        }),
        tinta.urlPutThumb && imagine.thumb
          ? putCuReincercare(tinta.urlPutThumb, imagine.thumb, (n) => {
              urcatThumb = n;
              raporteaza();
            }).then((eroare) => eroare === null)
          : Promise.resolve(false),
      ]);

      // Miniatura e opțională: dacă nu a urcat, grila folosește poza mare.
      const urcata = { cheie: tinta.cheie, cheieThumb: okThumb ? tinta.cheieThumb : null };
      if (contSchimbat()) {
        // Alt cont între timp: nimic în store; o poză urcată își păstrează cheile în copia contului ei
        // (la următoarea lui conectare doar se reconfirmă).
        if (eroareFull === null) void salveazaUrcata(incarcare.id, urcata);
        return;
      }
      if (eroareFull !== null) {
        mesaje.add(MESAJ_PUT);
        // Rețea, 5xx / 429 sau 403 (URL expirat cât telefonul a stat blocat): reluarea cere URL-uri noi.
        const tranzitorie = eroareFull === 0 || eroareFull === 403 || eroareFull === 429 || eroareFull >= 500;
        marcheazaEroare(programareId, [incarcare.id], MESAJ_PUT, { tranzitorie });
        return;
      }
      reseteazaReluarile(); // R2 răspunde din nou
      store().actualizeaza(programareId, incarcare.id, { stare: "salvare", progres: 1, urcata });
      // Cheile ajung în copia locală ÎNAINTE de confirmare: după o închidere a aplicației,
      // reluarea reconfirmă aceleași chei (idempotent), fără o a doua poză pe server.
      await Promise.race([salveazaUrcata(incarcare.id, urcata), asteapta(TERMEN_SCRIERE_CHEI_MS)]);
      urcate.push({ incarcare, ...urcata });
    }),
    PARALEL_UPLOAD
  );
  return 0;
}

// ── Arhiva ZIP (client-zip, store-only — JPEG-urile nu se mai comprimă) ─────────

/** GET din R2, cu verificarea mărimii (fără poze trunchiate în arhivă). 3 încercări. */
async function descarcaPoza(url: string, marime: number, semnal: AbortSignal): Promise<Blob> {
  let ultimaEroare: unknown = null;
  for (let incercare = 0; incercare < 3; incercare++) {
    if (incercare > 0) await asteapta(700 * incercare);
    if (semnal.aborted) throw new DOMException("Anulat", "AbortError");
    try {
      // no-store: un răspuns pus în cache de <img> (fără CORS) ar strica fetch-ul cu CORS.
      const res = await fetch(url, { cache: "no-store", credentials: "omit", signal: semnal });
      // client-zip ar arhiva și corpul unei erori 403 — verificăm explicit.
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      if (blob.size !== marime) throw new Error("Poză incompletă");
      return blob;
    } catch (e) {
      if (semnal.aborted) throw e;
      ultimaEroare = e;
    }
  }
  throw ultimaEroare instanceof Error ? ultimaEroare : new Error("Descărcare eșuată");
}

/** Descarcă pozele (3 în paralel) și construiește arhiva în memorie. Respinge la orice eroare. */
export async function construiesteArhiva(
  poze: PozaDeDescarcat[],
  laProgres: (gata: number, total: number) => void,
  semnal: AbortSignal
): Promise<Blob> {
  const local = new AbortController();
  const opreste = () => local.abort();
  if (semnal.aborted) local.abort();
  else semnal.addEventListener("abort", opreste, { once: true });
  try {
    const blobs = new Array<Blob>(poze.length);
    let gata = 0;
    laProgres(0, poze.length);
    await inParalel(
      poze.map((p, i) => async () => {
        blobs[i] = await descarcaPoza(p.url, p.marime, local.signal);
        gata++;
        laProgres(gata, poze.length);
      }),
      3
    );
    // client-zip e doar ESM pentru browser: încărcat la cerere, niciodată pe server.
    const { downloadZip } = await import("client-zip");
    return await downloadZip(
      poze.map((p, i) => ({ name: p.nume, lastModified: new Date(p.data), input: blobs[i] }))
    ).blob();
  } catch (e) {
    local.abort(); // oprim descărcările rămase
    throw e;
  } finally {
    semnal.removeEventListener("abort", opreste);
  }
}

// ── Salvarea arhivei ───────────────────────────────────────────────────────────

export type RezultatSalvare = "salvat" | "anulat" | "eroare";

function fisierZip(arhiva: Blob, numeFisier: string): File {
  return new File([arhiva], numeFisier, { type: "application/zip" });
}

/**
 * Browserul integrat al unei aplicații (Facebook, Messenger, Instagram, LinkedIn,
 * TikTok, WeChat, Line, WebView Android): <a download> cu un blob nu salvează
 * nimic acolo și nici nu raportează eroarea. Pe server: false.
 */
export function esteBrowserInAplicatie(): boolean {
  return (
    typeof navigator !== "undefined" &&
    /; wv\)|FBAN\/|FBAV\/|FB_IAB\/|Instagram |LinkedInApp|musical_ly|BytedanceWebview|MicroMessenger\/|\bLine\//.test(
      navigator.userAgent
    )
  );
}

/**
 * Pe telefon (iPhone, inclusiv aplicația instalată pe ecranul principal), meniul
 * de partajare („Salvează în Fișiere”) spune dacă utilizatorul a renunțat —
 * descărcările din PWA sunt nesigure pe iOS. Android Chrome nu partajează .zip
 * (canShare = false) și folosește descărcarea directă.
 */
export function poateDistribui(arhiva: Blob, numeFisier: string): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function" || typeof navigator.canShare !== "function") {
    return false;
  }
  if (typeof window === "undefined" || !window.matchMedia?.("(pointer: coarse)").matches) return false;
  try {
    return navigator.canShare({ files: [fisierZip(arhiva, numeFisier)] });
  } catch {
    return false;
  }
}

/** Trebuie apelată DIRECT din handler-ul de click (iOS cere gestul utilizatorului). */
export async function distribuieArhiva(arhiva: Blob, numeFisier: string): Promise<RezultatSalvare> {
  try {
    // Doar fișierul: un `title`/`text` ar fi salvat de iOS ca fișier text separat.
    await navigator.share({ files: [fisierZip(arhiva, numeFisier)] });
    return "salvat";
  } catch (e) {
    return e instanceof DOMException && e.name === "AbortError" ? "anulat" : "eroare";
  }
}

/** Descărcare clasică cu <a download>. Trebuie apelată direct din handler-ul de click. */
export function descarcaArhiva(arhiva: Blob, numeFisier: string): void {
  // application/octet-stream: pe iOS unele tipuri se deschid într-un tab în loc să se descarce.
  const url = URL.createObjectURL(new Blob([arhiva], { type: "application/octet-stream" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = numeFisier;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revocat mai târziu: unele browsere (iOS) încep descărcarea asincron.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
