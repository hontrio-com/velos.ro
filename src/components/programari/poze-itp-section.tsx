"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import { tz } from "@date-fns/tz";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Download,
  ImageOff,
  ImagePlus,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  confirmaDescarcarePozeAction,
  listeazaPozeProgramareAction,
  pregatesteDescarcarePozeAction,
  stergePozaAction,
} from "@/lib/actions/poze-itp";
import {
  MESAJ_FARA_POZE_DE_DESCARCAT,
  POZE_MAX_ACTIVE,
  POZE_RETENTIE_ZILE,
  cheiePozeProgramare,
  formatMarime,
  formatPoze,
  type ListaPozeRezultat,
  type PozaItp,
  type RezumatPozeSterse,
} from "@/lib/poze-itp/shared";
import {
  adaugaPoze,
  construiesteArhiva,
  descarcaArhiva,
  distribuieArhiva,
  esteActiuneNecunoscuta,
  esteBrowserInAplicatie,
  marcheazaSectiuneVizibila,
  poateDistribui,
  poateReincarcaUrl,
  reincearcaIncarcarea,
  renuntaLaIncarcare,
  type RezultatSalvare,
} from "@/lib/poze-itp/client";
import { FARA_INCARCARI, usePozeItpStore, type IncarcarePoza } from "@/stores/poze-itp-store";
import { PozeItpLightbox } from "./poze-itp-lightbox";

// Secțiunea „Poze inspecție” din sertarul programării + butonul rapid din footer.
// Upload: comprimare în browser → URL-uri presemnate (server) → PUT direct în R2
// → confirmare (server verifică obiectul). Descărcare: ZIP construit în browser,
// salvat la al DOILEA gest (cerință iOS), abia apoi pozele se șterg de pe server.
// Starea locală e legată de programare: sertarul pune key={programareId} pe componente;
// încărcările stau în store (cheiate pe programareId) și continuă dacă sertarul se închide.

const MESAJ_LISTA_RETEA = "Nu s-au putut încărca pozele. Verifică conexiunea.";
const MESAJ_RETEA = "Fără conexiune la server. Încearcă din nou.";
const MESAJ_ACTUALIZARE = "Aplicația a fost actualizată. Reîncarcă pagina ca să continui.";
// Browserul din aplicațiile Facebook / Instagram nu salvează un <a download> și nici nu semnalează asta.
const MESAJ_BROWSER_IN_APLICATIE = "Browserul din aplicația Facebook / Instagram nu poate salva fișiere.";
const SFAT_BROWSER_IN_APLICATIE =
  "Deschide velos.ro în Chrome sau Safari (meniul ⋮ → „Deschide în browser”) și descarcă arhiva de acolo.";
/** Peste câte poze grila se restrânge (3 rânduri pe telefon). */
const PRAG_RESTRANS = 9;
/** Ora României — aceeași cu cea din numele fișierelor din arhivă (calculate pe server). */
const FUS_ORAR = tz("Europe/Bucharest");

class EroareListaPoze extends Error {
  faraAcces: boolean;
  /** Server Action necunoscută (aplicația s-a actualizat): ajută doar reîncărcarea paginii. */
  actualizare: boolean;
  constructor(mesaj: string, faraAcces: boolean, actualizare = false) {
    super(mesaj);
    this.name = "EroareListaPoze";
    this.faraAcces = faraAcces;
    this.actualizare = actualizare;
  }
}

/** Ultimul răspuns al listei, ținut minte pe dispozitiv pentru următoarele încărcări ale paginii. */
const CHEIE_NECONFIGURAT = "poze-itp:neconfigurat";

function citesteNeconfigurata(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CHEIE_NECONFIGURAT) === "1";
  } catch {
    return false;
  }
}

/**
 * Ultimul răspuns al listei spunea că stocarea nu e configurată. Cât timp e așa, secțiunea
 * nu apare deloc, nici măcar scheletul de încărcare: sertarul arată ca înainte de poze.
 * Pornește de la răspunsul ținut minte pe dispozitiv (secțiunea nu se randează pe server).
 */
let stocareNeconfigurata = citesteNeconfigurata();

/**
 * Lista de poze a programării (comună secțiunii și butonului din footer — un singur request).
 * URL-urile presemnate sunt valabile minim 15 min: datele din cache nu trebuie să fie mai vechi
 * (reîncărcare la 9 min cât e deschis sertarul + gcTime 5 min după închidere → max ~14 min).
 * Pozele pot veni și de pe alt dispozitiv: după 30 s lista se reîncarcă la redeschiderea
 * programării și la revenirea în aplicație.
 */
function usePozeProgramare(programareId: string) {
  return useQuery<ListaPozeRezultat>({
    queryKey: cheiePozeProgramare(programareId),
    queryFn: async () => {
      let r: Awaited<ReturnType<typeof listeazaPozeProgramareAction>>;
      try {
        r = await listeazaPozeProgramareAction(programareId);
      } catch (e) {
        if (esteActiuneNecunoscuta(e)) throw new EroareListaPoze(MESAJ_ACTUALIZARE, false, true);
        throw new EroareListaPoze(MESAJ_LISTA_RETEA, false);
      }
      if ("error" in r) throw new EroareListaPoze(r.error, r.faraAcces);
      stocareNeconfigurata = !r.configurat;
      try {
        window.localStorage.setItem(CHEIE_NECONFIGURAT, r.configurat ? "0" : "1");
      } catch {
        // Stocare locală indisponibilă (ex. navigare privată): rămâne doar memoria paginii.
      }
      return r;
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchInterval: 9 * 60_000,
    refetchOnWindowFocus: true,
    retry: (incercari, eroare) =>
      !(eroare instanceof EroareListaPoze && (eroare.faraAcces || eroare.actualizare)) && incercari < 1,
  });
}

function numarInLucru(lista: IncarcarePoza[]): number {
  return lista.filter((i) => i.stare !== "eroare").length;
}

/**
 * Încărcări eșuate care țin încă poza (dalele cu „Reîncearcă” / „Reîncarcă pagina”): ea există doar
 * pe dispozitiv. Dalele fără poză („Nu se poate încărca”: comprimarea a eșuat) nu se numără.
 */
function numarNeincarcate(lista: IncarcarePoza[]): number {
  return lista.filter((i) => i.stare === "eroare" && !!i.imagine).length;
}

/** O încărcare a dat de o Server Action necunoscută: aplicația trebuie reîncărcată. */
function cereReincarcare(lista: IncarcarePoza[]): boolean {
  return lista.some((i) => i.actualizareAplicatie === true);
}

function textIncarcareInCurs(n: number): string {
  return `Se încarcă ${formatPoze(n)} — ține aplicația deschisă până se termină.`;
}

function momentPoza(p: PozaItp): Date {
  return parseISO(p.facutaLa ?? p.incarcataLa);
}

function textRezumat(s: RezumatPozeSterse): string {
  const cand = format(parseISO(s.ultimaLa), "d MMM yyyy, HH:mm", { locale: ro, in: FUS_ORAR });
  const cine = s.deNume ? `, de ${s.deNume}` : "";
  const unu = s.numar === 1;
  const cate = formatPoze(s.numar);
  if (s.motiv === "descarcat") {
    return `${cate} ${unu ? "descărcată și ștearsă" : "descărcate și șterse"} de pe server — ultima descărcare: ${cand}${cine}.`;
  }
  if (s.motiv === "expirat") {
    return `${cate} ${unu ? "ștearsă" : "șterse"} automat după ${POZE_RETENTIE_ZILE} zile (ultima pe ${cand}).`;
  }
  return `${cate} ${unu ? "ștearsă" : "șterse"} manual (ultima pe ${cand}${cine}).`;
}

// ── Buton rapid în footer-ul sertarului (lângă Admis / Respins) ─────────────────

interface PozeItpButonRapidProps {
  programareId: string;
  nrInmatriculare: string | null;
  /** Apelat după ce s-au ales poze — sertarul derulează la secțiunea „Poze inspecție”. */
  onIncarcare?: () => void;
}

/** Caseta butonului rapid; aceeași, invizibilă, îi ține locul cât se încarcă lista. */
const CLASA_BUTON_RAPID =
  "relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 pointer-fine:hidden";

/**
 * Deschide direct camera, ca pozele să poată fi făcute înainte de a marca rezultatul.
 * Doar pe ecrane tactile (pointer-fine:hidden); ascuns, ca secțiunea, dacă stocarea nu e configurată
 * sau lista e refuzată definitiv, și dacă aplicația trebuie reîncărcată (secțiunea explică). Cât se
 * încarcă lista, o casetă invizibilă identică îi ține locul: rândul din footer nu crește când apare butonul.
 */
export function PozeItpButonRapid({ programareId, nrInmatriculare, onIncarcare }: PozeItpButonRapidProps) {
  const queryClient = useQueryClient();
  const { data, error, isPending } = usePozeProgramare(programareId);
  const inLucru = usePozeItpStore((s) => numarInLucru(s.incarcari[programareId] ?? FARA_INCARCARI));
  const cuEroare = usePozeItpStore((s) =>
    (s.incarcari[programareId] ?? FARA_INCARCARI).some((i) => i.stare === "eroare")
  );
  const deReincarcat = usePozeItpStore((s) => cereReincarcare(s.incarcari[programareId] ?? FARA_INCARCARI));
  const cameraRef = useRef<HTMLInputElement>(null);

  if (isPending) {
    // Fără loc păstrat când ultimul răspuns de pe dispozitiv spunea că stocarea nu e configurată
    // (rândul rămâne ca înainte de poze) sau când aplicația trebuie reîncărcată (butonul n-ar apărea).
    if (stocareNeconfigurata || deReincarcat) return null;
    return (
      <span aria-hidden="true" className={cn(CLASA_BUTON_RAPID, "invisible")}>
        <Camera className="h-3.5 w-3.5 text-primary" />
        Fă poză
      </span>
    );
  }
  if (!data || !data.configurat) return null;
  // O poză nouă nu s-ar putea urca până la reîncărcarea paginii. La un refuz definitiv al listei
  // (fără acces, programare ștearsă, deconectat) secțiunea nu mai apare: nici butonul, din lista veche.
  if (deReincarcat || (error instanceof EroareListaPoze && (error.actualizare || error.faraAcces))) return null;

  const total = data.poze.length;
  const locuriLibere = POZE_MAX_ACTIVE - total - inLucru;

  return (
    <>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const fisiere = Array.from(e.target.files ?? []);
          e.target.value = ""; // aceeași poză poate fi aleasă din nou
          const acceptate = adaugaPoze(programareId, fisiere, queryClient, {
            locuriLibere,
            eticheta: nrInmatriculare,
          });
          if (acceptate > 0) onIncarcare?.();
        }}
      />
      <button
        type="button"
        onClick={() => cameraRef.current?.click()}
        disabled={locuriLibere <= 0}
        aria-label={
          inLucru > 0
            ? `Se încarcă ${formatPoze(inLucru)}. Fă încă o poză`
            : `Fă poză${total > 0 ? ` (${formatPoze(total)} salvate)` : ""}`
        }
        className={CLASA_BUTON_RAPID}
      >
        {inLucru > 0 ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        ) : (
          <Camera className="h-3.5 w-3.5 text-primary" />
        )}
        {inLucru > 0 ? `Se încarcă ${inLucru}` : "Fă poză"}
        {inLucru === 0 && total > 0 && (
          <span className="rounded-full bg-muted px-1.5 text-[10px] leading-4 tabular-nums text-muted-foreground">
            {total}
          </span>
        )}
        {cuEroare && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-card"
          />
        )}
      </button>
    </>
  );
}

interface PozeItpNotaIncarcareProps {
  programareId: string;
}

/**
 * Sub butonul rapid din footer, cât timp se urcă poze: pe telefon aplicația pusă în fundal
 * sau închisă oprește încărcarea. Ca butonul, doar pe ecrane tactile și ascunsă când
 * aplicația trebuie reîncărcată sau lista e refuzată definitiv.
 */
export function PozeItpNotaIncarcare({ programareId }: PozeItpNotaIncarcareProps) {
  const { data, error } = usePozeProgramare(programareId);
  const inLucru = usePozeItpStore((s) => numarInLucru(s.incarcari[programareId] ?? FARA_INCARCARI));
  const deReincarcat = usePozeItpStore((s) => cereReincarcare(s.incarcari[programareId] ?? FARA_INCARCARI));

  if (!data || !data.configurat || inLucru === 0) return null;
  // Ca butonul: încărcările nu se mai pot termina până la reîncărcarea paginii (secțiunea explică);
  // după un refuz definitiv al listei secțiunea nu mai apare, deci nici nota.
  if (deReincarcat || (error instanceof EroareListaPoze && (error.actualizare || error.faraAcces))) return null;
  return <p className="-mt-1.5 text-xs text-amber-700 pointer-fine:hidden">{textIncarcareInCurs(inLucru)}</p>;
}

interface PozeItpAvertizareStergereProps {
  programareId: string;
}

/**
 * În confirmarea ștergerii programării: pozele inspecției (+ încărcările în curs) se șterg
 * definitiv odată cu ea, iar cele care nu s-au încărcat se pierd (sertarul le scoate din store,
 * cu copia locală). Urmărește lista și store-ul, deci apare și când lista sosește după
 * deschiderea confirmării. Listă necunoscută, stocare neconfigurată sau nicio poză → nimic.
 */
export function PozeItpAvertizareStergere({ programareId }: PozeItpAvertizareStergereProps) {
  const { data } = usePozeProgramare(programareId);
  const inLucru = usePozeItpStore((s) => numarInLucru(s.incarcari[programareId] ?? FARA_INCARCARI));
  const neincarcate = usePozeItpStore((s) => numarNeincarcate(s.incarcari[programareId] ?? FARA_INCARCARI));

  if (!data || !data.configurat) return null;
  const n = data.poze.length + inLucru;
  if (n === 0 && neincarcate === 0) return null;
  const textPoze =
    n === 0
      ? null
      : n === 1
        ? "Se va șterge definitiv și poza inspecției. Descarc-o înainte dacă ai nevoie de ea."
        : `Se vor șterge definitiv și cele ${formatPoze(n)} ale inspecției. Descarcă-le înainte dacă ai nevoie de ele.`;
  // Nu sunt pe server, deci nu se pot descărca: propoziție separată, fără „Descarcă-le”.
  const textNeincarcate =
    neincarcate === 0
      ? null
      : neincarcate === 1
        ? "Se pierde și poza care nu s-a încărcat — există doar pe acest dispozitiv."
        : `Se pierd și cele ${formatPoze(neincarcate)} care nu s-au încărcat — există doar pe acest dispozitiv.`;
  return <span className="mt-0.5 block font-normal">{[textPoze, textNeincarcate].filter(Boolean).join(" ")}</span>;
}

// ── Secțiunea „Poze inspecție” din sertarul programării ─────────────────────────

type StareArhiva =
  | { faza: "inactiv" }
  | { faza: "pregatire"; gata: number; total: number }
  | {
      faza: "gata";
      blob: Blob;
      numeFisier: string;
      pozaIds: string[];
      /** false în modul administrator (impersonare): nu se șterge nimic. */
      stergeDupa: boolean;
      /** Meniul de partajare cu fișiere (telefon): oferă semnal la anulare. */
      distribuire: boolean;
      salvata: boolean;
      sterse: boolean;
      ocupat: boolean;
    }
  | { faza: "eroare"; mesaj: string };

type ArhivaGata = Extract<StareArhiva, { faza: "gata" }>;

/**
 * Montat doar cât lista e pe ecran, cu dalele încărcărilor: încărcările programării nu mai anunță
 * prin toast (se văd în dale). Scheletul, caseta de eroare sau de reîncărcare fără listă și o secțiune
 * neafișată (stocare neconfigurată, listă refuzată) nu arată dalele, deci nu se numără — altfel
 * refuzurile și eșecurile încărcărilor nu ar mai ajunge la utilizator (nici la reluare).
 */
function SectiunePeEcran({ programareId }: { programareId: string }) {
  useEffect(() => marcheazaSectiuneVizibila(programareId), [programareId]);
  return null;
}

interface PozeItpSectionProps {
  programareId: string;
  nrInmatriculare: string | null;
  /** Sertarul derulează la secțiune (butonul din footer). Secțiune neafișată → nimic de derulat. */
  ref?: React.Ref<HTMLElement>;
}

export function PozeItpSection({ programareId, nrInmatriculare, ref }: PozeItpSectionProps) {
  const queryClient = useQueryClient();
  const { data, isPending, error, refetch, isFetching, isRefetchError, dataUpdatedAt } =
    usePozeProgramare(programareId);
  const incarcari = usePozeItpStore((s) => s.incarcari[programareId] ?? FARA_INCARCARI);

  // Poza deschisă în lightbox, după id (nu după index): dacă dispare din listă,
  // lightbox-ul se închide singur și nu se redeschide când apar poze noi.
  const [pozaDeschisa, setPozaDeschisa] = useState<string | null>(null);
  const [arhiva, setArhiva] = useState<StareArhiva>({ faza: "inactiv" });
  // URL → versiunea listei la care a eșuat. O listă reîncărcată (dataUpdatedAt nou)
  // reîncearcă imaginea, chiar dacă URL-ul semnat a rămas același.
  const [urlEronate, setUrlEronate] = useState<Record<string, number>>({});
  const [toateVizibile, setToateVizibile] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galerieRef = useRef<HTMLInputElement>(null);
  const instantaRef = useRef<AbortController | null>(null);
  const tentativaRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // La demontare (altă programare / sertar închis) oprim descărcarea arhivei în curs.
    const instanta = new AbortController();
    instantaRef.current = instanta;
    return () => instanta.abort();
  }, [programareId]);

  const faraAcces = error instanceof EroareListaPoze && error.faraAcces;
  // Server Action necunoscută (aplicația s-a actualizat între timp): nimic nu mai reușește până la
  // reîncărcarea paginii, așa că o cerem explicit, fără butoane care ar eșua din nou.
  const deReincarcat = (error instanceof EroareListaPoze && error.actualizare) || cereReincarcare(incarcari);
  const mesajEroare = error instanceof Error ? error.message : MESAJ_LISTA_RETEA;
  const configurat = data?.configurat === true;
  const poze = data && data.configurat ? data.poze : [];
  const sterse = data && data.configurat ? data.sterse : [];
  const modAdmin = data && data.configurat ? data.modAdmin : false;
  const inLucru = numarInLucru(incarcari);
  // Încărcările oprite de actualizarea aplicației sunt explicate de nota de reîncărcare.
  const erori = incarcari.filter((i) => i.stare === "eroare" && !i.actualizareAplicatie);
  const locuriLibere = POZE_MAX_ACTIVE - poze.length - inLucru;
  const index = pozaDeschisa ? poze.findIndex((p) => p.id === pozaDeschisa) : -1;
  // Pe telefon o grilă lungă împinge restul sertarului în jos: arătăm 8 poze + o dală „+N”.
  const restrans = !toateVizibile && poze.length > PRAG_RESTRANS;
  const pozeVizibile = restrans ? poze.slice(0, PRAG_RESTRANS - 1) : poze;
  // Linie discretă de reîncercare: lista nu s-a putut reîmprospăta (rămâne cea veche pe ecran)
  // sau unele dale au rămas fără imagine la versiunea curentă a listei (ex. semnal pierdut).
  const avertizareLista = deReincarcat
    ? null
    : isRefetchError
      ? "Lista de poze nu s-a actualizat."
      : !isFetching && pozeVizibile.some((p) => urlEronate[p.urlThumb] === dataUpdatedAt)
        ? "Unele poze nu s-au putut afișa."
        : null;
  const expirari = poze.map((p) => p.expiraLa).sort(); // ISO UTC → ordinea lexicografică e cronologică
  const primaExpirare = expirari.length
    ? format(parseISO(expirari[0]), "d MMM yyyy", { locale: ro, in: FUS_ORAR })
    : null;
  const ultimaExpirare = expirari.length
    ? format(parseISO(expirari[expirari.length - 1]), "d MMM yyyy", { locale: ro, in: FUS_ORAR })
    : null;
  const marimeTotala = poze.reduce((s, p) => s + p.marime, 0);
  const noiDupaArhiva = arhiva.faza === "gata" ? poze.filter((p) => !arhiva.pozaIds.includes(p.id)).length : 0;
  // Browserul din Facebook / Instagram fără meniul de partajare: arhiva nu s-ar putea salva aici,
  // deci spunem asta înainte ca pozele să se descarce degeaba.
  const arhivaNesalvabila =
    esteBrowserInAplicatie() && !(typeof navigator !== "undefined" && typeof navigator.share === "function");

  function laFisiere(e: React.ChangeEvent<HTMLInputElement>) {
    const fisiere = Array.from(e.target.files ?? []);
    e.target.value = ""; // aceeași poză poate fi aleasă din nou
    adaugaPoze(programareId, fisiere, queryClient, {
      locuriLibere: configurat ? locuriLibere : null,
      eticheta: nrInmatriculare,
    });
  }

  /** URL expirat sau obiect lipsă: marcăm dala și cerem URL-uri noi (cel mult o dată la 30 s). */
  function laEroareImagine(url: string) {
    setUrlEronate((m) => (m[url] === dataUpdatedAt ? m : { ...m, [url]: dataUpdatedAt }));
    if (poateReincarcaUrl(programareId)) void refetch({ cancelRefetch: false });
  }

  /** „Reîncearcă” la cererea utilizatorului: dalele fără imagine se reîncarcă imediat, lista la fel. */
  function reincearcaLista() {
    setUrlEronate({});
    void refetch();
  }

  async function stergePoza(pozaId: string): Promise<boolean> {
    const i = poze.findIndex((p) => p.id === pozaId);
    const vecina = poze[i + 1] ?? poze[i - 1] ?? null;
    let r: Awaited<ReturnType<typeof stergePozaAction>>;
    try {
      r = await stergePozaAction(programareId, pozaId);
    } catch (e) {
      r = { error: esteActiuneNecunoscuta(e) ? MESAJ_ACTUALIZARE : MESAJ_RETEA };
    }
    if ("error" in r) {
      if (r.error === MESAJ_ACTUALIZARE) {
        // Lightbox-ul acoperă nota de reîncărcare din secțiune: butonul vine în toast.
        toast.error(r.error, {
          duration: 10_000,
          action: { label: "Reîncarcă pagina", onClick: () => window.location.reload() },
        });
      } else {
        toast.error(r.error);
      }
      return false;
    }
    // Lightbox-ul trece pe poza vecină înainte de reîncărcare — fără închidere/redeschidere.
    setPozaDeschisa((curenta) => (curenta === pozaId ? (vecina?.id ?? null) : curenta));
    toast.success("Poza a fost ștearsă");
    await queryClient.invalidateQueries({ queryKey: cheiePozeProgramare(programareId) });
    return true;
  }

  /** Actualizează arhiva doar dacă e încă aceeași (între timp utilizatorul poate să fi apăsat „Renunță”). */
  function actualizeazaArhiva(blob: Blob, modificari: Partial<ArhivaGata>) {
    setArhiva((s) => (s.faza === "gata" && s.blob === blob ? { ...s, ...modificari } : s));
  }

  // Pasul 1: descarcă pozele și construiește ZIP-ul în memorie. Nu se șterge nimic.
  async function pregatesteArhiva() {
    tentativaRef.current?.abort();
    const tentativa = new AbortController();
    tentativaRef.current = tentativa;
    instantaRef.current?.signal.addEventListener("abort", () => tentativa.abort(), { once: true });
    setArhiva({ faza: "pregatire", gata: 0, total: poze.length });

    let r: Awaited<ReturnType<typeof pregatesteDescarcarePozeAction>>;
    try {
      r = await pregatesteDescarcarePozeAction(programareId);
    } catch (e) {
      r = { error: esteActiuneNecunoscuta(e) ? MESAJ_ACTUALIZARE : MESAJ_RETEA };
    }
    if (tentativa.signal.aborted) return;
    // Pregătirea citește pozele actuale de pe server: grila se aliniază cu ele (pozele pot
    // să fi fost descărcate sau șterse între timp pe alt dispozitiv).
    void queryClient.invalidateQueries({ queryKey: cheiePozeProgramare(programareId) });
    if ("error" in r) {
      if (r.error === MESAJ_FARA_POZE_DE_DESCARCAT) {
        toast.info("Pozele au fost deja descărcate sau șterse de pe alt dispozitiv.");
      }
      setArhiva({ faza: "eroare", mesaj: r.error });
      return;
    }

    const pregatire = r;
    try {
      const blob = await construiesteArhiva(
        pregatire.poze,
        (gata, total) => {
          if (!tentativa.signal.aborted) setArhiva({ faza: "pregatire", gata, total });
        },
        tentativa.signal
      );
      if (tentativa.signal.aborted) return;
      setArhiva({
        faza: "gata",
        blob,
        numeFisier: pregatire.numeArhiva,
        pozaIds: pregatire.poze.map((p) => p.id),
        stergeDupa: pregatire.stergeDupaDescarcare,
        distribuire: poateDistribui(blob, pregatire.numeArhiva),
        salvata: false,
        sterse: false,
        ocupat: false,
      });
    } catch {
      if (tentativa.signal.aborted) return;
      // O poză lipsă poate fi una ștearsă între timp de pe alt dispozitiv: lista se reîncarcă.
      void queryClient.invalidateQueries({ queryKey: cheiePozeProgramare(programareId) });
      setArhiva({
        faza: "eroare",
        mesaj: "Nu s-au putut descărca toate pozele. Nu s-a șters nimic — verifică conexiunea și încearcă din nou.",
      });
    }
  }

  function renuntaLaArhiva() {
    tentativaRef.current?.abort();
    tentativaRef.current = null;
    setArhiva({ faza: "inactiv" });
  }

  // Pasul 2 (al doilea gest — necesar pe iOS): salvează, apoi șterge pozele de pe server.
  // share() / click() pornesc SINCRON, înaintea oricărui await.
  async function salveazaArhiva(metoda: "auto" | "fisier") {
    if (arhiva.faza !== "gata" || arhiva.ocupat) return;
    const curenta = arhiva;

    let rezultat: RezultatSalvare;
    if (metoda === "auto" && curenta.distribuire) {
      rezultat = await distribuieArhiva(curenta.blob, curenta.numeFisier);
    } else {
      // Browserul din aplicația Facebook / Instagram nu salvează fișierul și nu semnalează asta:
      // nu „descărcăm” și NU ștergem pozele după o salvare care nu se poate face.
      if (esteBrowserInAplicatie()) {
        toast.error(MESAJ_BROWSER_IN_APLICATIE, {
          description: curenta.sterse
            ? SFAT_BROWSER_IN_APLICATIE
            : `${SFAT_BROWSER_IN_APLICATIE} Pozele nu au fost șterse.`,
          duration: 10_000,
        });
        return;
      }
      descarcaArhiva(curenta.blob, curenta.numeFisier);
      rezultat = "salvat";
    }

    if (rezultat === "anulat") {
      if (!curenta.sterse) toast.info("Salvarea a fost anulată. Pozele au rămas pe server.");
      return;
    }
    if (rezultat === "eroare") {
      actualizeazaArhiva(curenta.blob, { distribuire: false });
      toast.error("Meniul de salvare nu s-a putut deschide.", {
        description: "Apasă din nou „Salvează arhiva” pentru descărcare directă.",
      });
      return;
    }

    if (curenta.sterse || !curenta.stergeDupa) {
      if (!curenta.stergeDupa && !curenta.salvata) {
        toast.info("Arhiva a fost salvată.", { description: "Mod administrator: pozele nu au fost șterse de pe server." });
      }
      actualizeazaArhiva(curenta.blob, { salvata: true });
      return;
    }

    actualizeazaArhiva(curenta.blob, { salvata: true, ocupat: true });
    let r: Awaited<ReturnType<typeof confirmaDescarcarePozeAction>>;
    try {
      r = await confirmaDescarcarePozeAction(programareId, curenta.pozaIds);
    } catch (e) {
      r = { error: esteActiuneNecunoscuta(e) ? MESAJ_ACTUALIZARE : MESAJ_RETEA };
    }
    if ("error" in r) {
      actualizeazaArhiva(curenta.blob, { ocupat: false });
      if (r.error === MESAJ_ACTUALIZARE) {
        // „Salvează din nou” ar trimite aceeași acțiune necunoscută: ajută doar reîncărcarea paginii.
        toast.error("Arhiva a fost salvată, dar pozele nu au putut fi șterse de pe server.", {
          description:
            "Aplicația a fost actualizată. Reîncarcă pagina și descarcă din nou arhiva ca să le ștergi. Altfel se șterg automat la expirare.",
          duration: 10_000,
          action: { label: "Reîncarcă pagina", onClick: () => window.location.reload() },
        });
      } else {
        toast.error("Arhiva a fost salvată, dar pozele nu au putut fi șterse de pe server.", {
          description: "Poți încerca din nou cu „Salvează din nou”. Altfel se șterg automat la expirare.",
        });
      }
      return;
    }

    actualizeazaArhiva(curenta.blob, { sterse: !r.pastrate, ocupat: false });
    toast.success("Arhiva a fost salvată", {
      description: r.pastrate
        ? "Mod administrator: pozele nu au fost șterse."
        : r.sterse === 0
          ? "Pozele fuseseră deja șterse de pe server."
          : `${formatPoze(r.sterse)} ${r.sterse === 1 ? "a fost ștearsă" : "au fost șterse"} de pe server.`,
    });
    await queryClient.invalidateQueries({ queryKey: cheiePozeProgramare(programareId) });
  }

  // Eroarea arhivei nu mai privește nimic când lista reîncărcată e goală (poze descărcate / șterse
  // între timp): revenim la „inactiv”, ca pozele adăugate după aceea să arate iar „Descarcă toate (ZIP)”.
  if (arhiva.faza === "eroare" && configurat && poze.length === 0) setArhiva({ faza: "inactiv" });

  // Stocarea nu e configurată: secțiunea nu apare deloc — nici cât se încarcă lista sau dacă
  // cererea eșuează, când ultimul răspuns spunea la fel. La fel la un refuz definitiv al listei
  // (fără acces, programare inexistentă, cont suspendat sau deconectat), oricare ar fi răspunsul
  // ținut minte pe dispozitiv. Restul sertarului rămâne neschimbat.
  const ascunsa = faraAcces || (data ? !data.configurat : stocareNeconfigurata);
  // Poza deschisă nu supraviețuiește ascunderii: lightbox-ul nu reapare singur când revine accesul.
  if (ascunsa && pozaDeschisa !== null) setPozaDeschisa(null);
  if (ascunsa) return null;

  return (
    <section ref={ref} aria-label="Poze inspecție" className="scroll-mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Poze inspecție</p>
        {configurat && (
          <div className="flex items-center gap-1.5">
            {poze.length > 0 && (
              <span className="text-xs tabular-nums text-muted-foreground">
                {poze.length >= POZE_MAX_ACTIVE - 10 ? `${poze.length}/${POZE_MAX_ACTIVE}` : poze.length}
              </span>
            )}
            {/* Pozele pot veni de pe alt dispozitiv (telefonul inspectorului, calculatorul de la birou). */}
            {!deReincarcat && (
              <button
                type="button"
                onClick={() => void refetch()}
                disabled={isFetching}
                aria-label="Actualizează lista de poze"
                className="-my-1.5 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
              </button>
            )}
          </div>
        )}
      </div>

      {isPending ? (
        <ScheletPoze />
      ) : !data ? (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3">
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            {deReincarcat ? MESAJ_ACTUALIZARE : mesajEroare}
          </p>
          {deReincarcat ? (
            <Button size="sm" variant="outline" onClick={() => window.location.reload()} className="shrink-0">
              Reîncarcă pagina
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => void refetch()} disabled={isFetching} className="shrink-0">
              Reîncearcă
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-border bg-background p-3">
          <SectiunePeEcran programareId={programareId} />
          {modAdmin && (
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <ShieldAlert className="mt-px h-3.5 w-3.5 shrink-0" />
              Mod administrator: descărcarea nu șterge pozele, iar ștergerea manuală este dezactivată.
            </p>
          )}

          {deReincarcat ? (
            // Fără „Fă poză” / „Încarcă”: o poză nouă nu s-ar putea urca până la reîncărcare.
            <div className="flex items-start justify-between gap-3 rounded-lg bg-amber-50 px-3 py-2">
              <p className="flex items-start gap-2 text-xs text-amber-800">
                <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
                {MESAJ_ACTUALIZARE}
              </p>
              <Button size="sm" variant="outline" onClick={() => window.location.reload()} className="shrink-0">
                Reîncarcă pagina
              </Button>
            </div>
          ) : (
            <>
              {/* Telefon (pointer coarse): „Fă poză” + „Încarcă”; desktop: doar „Încarcă poze”. */}
              <div className="grid grid-cols-1 gap-2 pointer-coarse:grid-cols-2">
                <Button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  disabled={locuriLibere <= 0}
                  className="hidden h-11 gap-2 text-sm pointer-coarse:inline-flex"
                >
                  <Camera className="h-4 w-4" />
                  Fă poză
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => galerieRef.current?.click()}
                  disabled={locuriLibere <= 0}
                  className="h-11 gap-2 text-sm pointer-fine:h-9"
                >
                  <ImagePlus className="h-4 w-4" />
                  <span className="pointer-coarse:hidden">Încarcă poze</span>
                  <span className="hidden pointer-coarse:inline">Încarcă</span>
                </Button>
              </div>
              {locuriLibere <= 0 && (
                <p className="text-xs text-muted-foreground">
                  Limita este de {formatPoze(POZE_MAX_ACTIVE)} pe programare. Descarcă sau șterge din ele ca să adaugi altele.
                </p>
              )}
            </>
          )}

          {poze.length > 0 || incarcari.length > 0 ? (
            <ul className="grid grid-cols-3 gap-2">
              {pozeVizibile.map((p, i) => (
                <li key={p.id}>
                  <DalaPoza
                    poza={p}
                    pozitie={i + 1}
                    total={poze.length}
                    eronata={urlEronate[p.urlThumb] === dataUpdatedAt}
                    onDeschide={() => setPozaDeschisa(p.id)}
                    onEroare={() => laEroareImagine(p.urlThumb)}
                  />
                </li>
              ))}
              {restrans && (
                <li>
                  <button
                    type="button"
                    onClick={() => setToateVizibile(true)}
                    className="flex aspect-square w-full flex-col items-center justify-center rounded-lg border border-border bg-muted text-sm font-semibold text-foreground transition-colors hover:bg-muted/70"
                  >
                    +{poze.length - pozeVizibile.length}
                    <span className="text-[11px] font-normal text-muted-foreground">Arată toate</span>
                  </button>
                </li>
              )}
              {incarcari.map((it) => (
                <li key={it.id}>
                  <DalaIncarcare
                    incarcare={it}
                    onReincearca={() => reincearcaIncarcarea(programareId, it.id, queryClient, nrInmatriculare)}
                    onRenunta={() => renuntaLaIncarcare(programareId, it.id)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-border px-4 py-5 text-center">
              <Camera className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nicio poză încă</p>
              <p className="text-xs text-muted-foreground">Fă poze vehiculului în timpul inspecției.</p>
            </div>
          )}

          {avertizareLista && (
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                {avertizareLista}
              </span>
              <button
                type="button"
                onClick={reincearcaLista}
                disabled={isFetching}
                className="-m-2 shrink-0 p-2 font-medium text-foreground underline-offset-2 hover:underline disabled:opacity-50"
              >
                Reîncearcă
              </button>
            </div>
          )}

          {erori.length > 0 && (
            <p className="text-xs text-destructive">
              {erori.length === 1 ? "O poză nu a fost încărcată" : `${formatPoze(erori.length)} nu au fost încărcate`}:{" "}
              {erori[0].eroare}
            </p>
          )}
          {/* Pe telefon, aplicația pusă în fundal sau închisă oprește încărcarea. Cu aplicația de
              reîncărcat, încărcările rămase nu se mai pot termina: nota de reîncărcare explică. */}
          <p className={inLucru > 0 && !deReincarcat ? "text-xs text-amber-700" : "sr-only"} aria-live="polite">
            {inLucru > 0 && !deReincarcat ? textIncarcareInCurs(inLucru) : ""}
          </p>

          {sterse.length > 0 && (
            <ul className="space-y-1">
              {sterse.map((s) => (
                <li key={s.motiv} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" />
                  <span>{textRezumat(s)}</span>
                </li>
              ))}
            </ul>
          )}

          <PanouArhiva
            arhiva={arhiva}
            numarPoze={poze.length}
            marimeTotala={marimeTotala}
            noiDupaArhiva={noiDupaArhiva}
            blocat={inLucru > 0 || deReincarcat}
            nesalvabila={arhivaNesalvabila}
            onPregateste={pregatesteArhiva}
            onRenunta={renuntaLaArhiva}
            onSalveaza={salveazaArhiva}
          />

          {primaExpirare && (
            <p className="text-xs text-muted-foreground">
              Pozele se șterg automat după descărcarea arhivei sau{" "}
              {primaExpirare === ultimaExpirare ? "pe" : "începând cu"} {primaExpirare}.
            </p>
          )}
        </div>
      )}

      {/* Două inputuri: `capture` deschide camera (o poză pe apăsare), `multiple` nu se combină cu el. */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={laFisiere}
      />
      <input
        ref={galerieRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={laFisiere}
      />

      {index >= 0 && (
        <PozeItpLightbox
          poze={poze}
          index={index}
          nrInmatriculare={nrInmatriculare}
          versiuneLista={dataUpdatedAt}
          stergereBlocata={modAdmin}
          onIndex={(i) => setPozaDeschisa(poze[i]?.id ?? null)}
          onInchide={() => setPozaDeschisa(null)}
          onSterge={stergePoza}
          onEroareImagine={laEroareImagine}
        />
      )}
    </section>
  );
}

// ── Componente de prezentare ─────────────────────────────────────────────────────

function ScheletPoze() {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-background p-3">
      <div className="h-11 animate-pulse rounded-lg bg-muted pointer-fine:h-9" />
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}

interface DalaPozaProps {
  poza: PozaItp;
  pozitie: number;
  total: number;
  eronata: boolean;
  onDeschide: () => void;
  onEroare: () => void;
}

function DalaPoza({ poza, pozitie, total, eronata, onDeschide, onEroare }: DalaPozaProps) {
  const moment = momentPoza(poza);
  const ora = format(moment, "HH:mm", { in: FUS_ORAR });
  const data = format(moment, "d MMM yyyy", { locale: ro, in: FUS_ORAR });
  return (
    <button
      type="button"
      onClick={onDeschide}
      aria-label={`Deschide poza ${pozitie} din ${total}, ${data}, ${ora}`}
      className="group relative block aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {eronata ? (
        <span className="flex h-full w-full items-center justify-center text-muted-foreground">
          <ImageOff className="h-5 w-5" />
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poza.urlThumb}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={onEroare}
          className="h-full w-full object-cover transition-transform duration-150 group-active:scale-[0.97]"
        />
      )}
      {/* Data + ora pe două rânduri: „d MMM yyyy, HH:mm” nu încape pe o dală de ~105 px */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-1.5 pb-1 pt-5 text-left leading-tight text-white">
        <span className="block text-[11px] font-semibold tabular-nums">{ora}</span>
        <span className="block text-[10px] opacity-90">{data}</span>
      </span>
    </button>
  );
}

interface DalaIncarcareProps {
  incarcare: IncarcarePoza;
  onReincearca: () => void;
  onRenunta: () => void;
}

function DalaIncarcare({ incarcare, onReincearca, onRenunta }: DalaIncarcareProps) {
  const { stare, previewUrl, progres } = incarcare;
  const procent = Math.round(progres * 100);
  const eticheta =
    stare === "coada"
      ? "În așteptare"
      : stare === "comprimare"
        ? "Se procesează"
        : stare === "incarcare"
          ? `${procent}%`
          : "Se salvează";

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted">
      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="" className="h-full w-full object-cover" />
      )}

      {stare === "eroare" ? (
        <>
          {incarcare.actualizareAplicatie ? (
            // Aplicația s-a actualizat: „Reîncearcă” ar eșua din nou, ajută doar reîncărcarea paginii.
            <button
              type="button"
              onClick={() => window.location.reload()}
              title={incarcare.eroare ?? undefined}
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-600/75 px-1 text-center text-[11px] font-medium leading-tight text-white"
            >
              <RefreshCw className="h-5 w-5" />
              Reîncarcă pagina
            </button>
          ) : incarcare.imagine ? (
            <button
              type="button"
              onClick={onReincearca}
              title={incarcare.eroare ?? undefined}
              aria-label={`Reîncearcă încărcarea. ${incarcare.eroare ?? ""}`}
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-600/75 px-1 text-center text-[11px] font-medium text-white"
            >
              <RotateCcw className="h-5 w-5" />
              Reîncearcă
            </button>
          ) : (
            <div
              title={incarcare.eroare ?? undefined}
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-600/75 px-1.5 text-center text-[11px] font-medium leading-tight text-white"
            >
              <AlertTriangle className="h-5 w-5" />
              <span className="line-clamp-2">Nu se poate încărca</span>
            </div>
          )}
          <button
            type="button"
            onClick={onRenunta}
            aria-label="Elimină poza din listă"
            className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 text-[11px] font-medium text-white">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="tabular-nums">{eticheta}</span>
          {stare === "incarcare" && (
            <span className="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-full bg-white/30">
              <span
                className="block h-full rounded-full bg-white transition-[width] duration-150"
                style={{ width: `${procent}%` }}
              />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface PanouArhivaProps {
  arhiva: StareArhiva;
  numarPoze: number;
  marimeTotala: number;
  noiDupaArhiva: number;
  /**
   * Încărcări în curs (arhiva le-ar rata, așa că așteptăm să se termine) sau aplicația trebuie
   * reîncărcată (pregătirea ar eșua; nota din secțiune explică).
   */
  blocat: boolean;
  /** Browserul din Facebook / Instagram fără meniu de partajare: arhiva nu se poate salva aici. */
  nesalvabila: boolean;
  onPregateste: () => void;
  onRenunta: () => void;
  onSalveaza: (metoda: "auto" | "fisier") => void;
}

function PanouArhiva({
  arhiva,
  numarPoze,
  marimeTotala,
  noiDupaArhiva,
  blocat,
  nesalvabila,
  onPregateste,
  onRenunta,
  onSalveaza,
}: PanouArhivaProps) {
  if (arhiva.faza === "inactiv") {
    if (numarPoze === 0) return null;
    return (
      <>
        <Button
          type="button"
          variant="outline"
          onClick={onPregateste}
          disabled={blocat}
          className="h-11 w-full gap-2 text-sm pointer-fine:h-9"
        >
          <Download className="h-4 w-4" />
          Descarcă toate (ZIP)
          <span className="font-normal text-muted-foreground">· {formatMarime(marimeTotala)}</span>
        </Button>
        {nesalvabila && (
          <p className="text-xs text-amber-700">
            {MESAJ_BROWSER_IN_APLICATIE} {SFAT_BROWSER_IN_APLICATIE}
          </p>
        )}
      </>
    );
  }

  if (arhiva.faza === "pregatire") {
    const procent = arhiva.total ? Math.round((arhiva.gata / arhiva.total) * 100) : 0;
    return (
      <div className="space-y-2 rounded-lg border border-border px-3 py-2.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-1.5 font-medium">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Se pregătește arhiva… {arhiva.gata}/{arhiva.total}
          </span>
          <button
            type="button"
            onClick={onRenunta}
            className="-m-2 p-2 text-muted-foreground underline-offset-2 hover:underline"
          >
            Anulează
          </button>
        </div>
        <div
          role="progressbar"
          aria-label="Pregătire arhivă"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={procent}
          className="h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${procent}%` }} />
        </div>
      </div>
    );
  }

  if (arhiva.faza === "eroare") {
    // Lista reîncărcată după eroare nu mai are poze (descărcate / șterse de pe alt dispozitiv):
    // rezumatul pozelor șterse explică ce s-a întâmplat, „Reîncearcă” n-ar mai avea ce face.
    if (numarPoze === 0) return null;
    // Server Action necunoscută (aplicația s-a actualizat): „Reîncearcă” ar trimite aceeași acțiune.
    const aplicatieActualizata = arhiva.mesaj === MESAJ_ACTUALIZARE;
    return (
      <div className="flex items-start justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
        <span className="flex items-start gap-1.5">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
          {arhiva.mesaj}
        </span>
        <button
          type="button"
          onClick={aplicatieActualizata ? () => window.location.reload() : onPregateste}
          className="-m-2 shrink-0 p-2 font-medium underline-offset-2 hover:underline"
        >
          {aplicatieActualizata ? "Reîncarcă pagina" : "Reîncearcă"}
        </button>
      </div>
    );
  }

  const marime = formatMarime(arhiva.blob.size);
  return (
    <div className="space-y-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3">
      <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-800">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        {arhiva.salvata ? "Arhiva a fost salvată" : "Arhiva e gata"} · {formatPoze(arhiva.pozaIds.length)} · {marime}
      </p>
      <Button
        type="button"
        onClick={() => onSalveaza("auto")}
        disabled={arhiva.ocupat}
        className={cn(
          "h-11 w-full gap-2 text-sm pointer-fine:h-9",
          arhiva.salvata
            ? "border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100"
            : "bg-emerald-600 text-white hover:bg-emerald-700"
        )}
      >
        {arhiva.ocupat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {arhiva.salvata ? "Salvează din nou" : `Salvează arhiva (${marime})`}
      </Button>
      {arhiva.distribuire && (
        <button
          type="button"
          onClick={() => onSalveaza("fisier")}
          disabled={arhiva.ocupat}
          className="-my-1 w-full py-1 text-center text-xs text-emerald-900/80 underline-offset-2 hover:underline disabled:opacity-50"
        >
          Descarcă direct fișierul
        </button>
      )}
      <p className="text-xs text-emerald-900/80">
        {!arhiva.stergeDupa
          ? "Mod administrator: pozele rămân pe server după salvare."
          : arhiva.sterse
            ? "Pozele au fost șterse de pe server. Verifică arhiva în Fișiere / Descărcări înainte să închizi programarea — după închidere nu o mai poți salva din nou."
            : arhiva.distribuire
              ? "Alege „Salvează în Fișiere”. După salvare, pozele din arhivă se șterg definitiv de pe server."
              : "După salvare, pozele din arhivă se șterg definitiv de pe server."}
      </p>
      {noiDupaArhiva > 0 && (
        <p className="text-xs text-amber-700">
          {noiDupaArhiva === 1
            ? "Între timp s-a adăugat o poză care nu este în arhivă — rămâne pe server."
            : `Între timp s-au adăugat ${formatPoze(noiDupaArhiva)} care nu sunt în arhivă — rămân pe server.`}
        </p>
      )}
      <button
        type="button"
        onClick={onRenunta}
        disabled={arhiva.ocupat}
        className="-m-2 p-2 text-xs text-muted-foreground underline-offset-2 hover:underline disabled:opacity-50"
      >
        {arhiva.salvata ? "Închide" : "Renunță"}
      </button>
    </div>
  );
}
