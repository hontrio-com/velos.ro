"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import { tz } from "@date-fns/tz";
import { ChevronLeft, ChevronRight, Loader2, RotateCcw, Trash2, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PozaItp } from "@/lib/poze-itp/shared";

/**
 * Vizualizare pe tot ecranul pentru pozele ITP.
 * Randat prin portal în <body> la z-[60]: panoul sertarului e `fixed z-50` (context de
 * stivuire propriu), iar butonul flotant din dashboard (`fixed z-50`, randat după sertar)
 * ar acoperi un overlay rămas în interiorul panoului.
 *
 * Telefon: swipe stânga/dreapta = poza următoare/anterioară, swipe în jos = închide,
 * atingere pe poză = mărire 2,5× cu deplasare (pinch-zoom-ul nativ ar mări toată pagina).
 * Desktop: Escape, săgeți; Tab trece doar prin butoanele dialogului.
 */

interface PozeItpLightboxProps {
  poze: PozaItp[];
  index: number;
  nrInmatriculare: string | null;
  /** Versiunea listei (dataUpdatedAt): o listă reîncărcată reîncearcă poza eșuată. */
  versiuneLista: number;
  /** Mod administrator (impersonare): ștergerea e ascunsă (și refuzată pe server). */
  stergereBlocata: boolean;
  onIndex: (index: number) => void;
  onInchide: () => void;
  onSterge: (pozaId: string) => Promise<boolean>;
  onEroareImagine: (url: string) => void;
}

const FORMAT_DATA_ORA = "d MMM yyyy, HH:mm";
/** Ora României — aceeași cu cea din grilă și din numele fișierelor din arhivă. */
const FUS_ORAR = tz("Europe/Bucharest");

export function PozeItpLightbox({
  poze,
  index,
  nrInmatriculare,
  versiuneLista,
  stergereBlocata,
  onIndex,
  onInchide,
  onSterge,
  onEroareImagine,
}: PozeItpLightboxProps) {
  const [zoom, setZoom] = useState(false);
  const [confirmStergere, setConfirmStergere] = useState(false);
  const [seSterge, setSeSterge] = useState(false);
  const [incarcate, setIncarcate] = useState<Record<string, true>>({});
  // URL → versiunea listei la care a eșuat (ca dalele din secțiune): după o reîncărcare a
  // listei poza se reîncearcă, chiar dacă URL-ul semnat a rămas același.
  const [eronate, setEronate] = useState<Record<string, number>>({});
  /** Crește la „Reîncearcă”: un <img> nou, cu ACEEAȘI adresă (un URL semnat nu se modifică). */
  const [incercare, setIncercare] = useState(0);

  const dialogRef = useRef<HTMLDivElement>(null);
  const inchideRef = useRef<HTMLButtonElement>(null);
  const zonaRef = useRef<HTMLDivElement>(null);
  const atingereRef = useRef<{ x: number; y: number } | null>(null);
  const punctZoomRef = useRef({ x: 0.5, y: 0.5 });

  const total = poze.length;
  const poza = poze[index];

  function mergiLa(i: number) {
    setZoom(false);
    setConfirmStergere(false);
    onIndex((i + total) % total);
  }

  // Tastatură (desktop). Re-abonare la fiecare randare: handler-ele văd mereu indexul curent.
  useEffect(() => {
    function laTasta(e: KeyboardEvent) {
      if (e.key === "Escape") onInchide();
      else if (e.key === "ArrowLeft" && total > 1) mergiLa(index - 1);
      else if (e.key === "ArrowRight" && total > 1) mergiLa(index + 1);
      else if (e.key === "Tab") {
        // Tab / Shift+Tab rămân în dialog (dedesubt e sertarul, ascuns de overlay). Butoanele
        // se citesc la fiecare apăsare: setul se schimbă (mărire, confirmarea ștergerii).
        const butoane = Array.from(
          dialogRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []
        );
        if (!butoane.length) return;
        const i = butoane.indexOf(document.activeElement as HTMLButtonElement);
        if (i === -1 || (e.shiftKey ? i === 0 : i === butoane.length - 1)) {
          e.preventDefault();
          butoane[e.shiftKey ? butoane.length - 1 : 0].focus();
        }
      }
    }
    window.addEventListener("keydown", laTasta);
    return () => window.removeEventListener("keydown", laTasta);
  });

  // Blocăm scroll-ul paginii de dedesubt, mutăm focusul pe „Închide” și îl redăm la închidere.
  useEffect(() => {
    const html = document.documentElement;
    const overflowAnterior = html.style.overflow;
    const focusAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    html.style.overflow = "hidden";
    inchideRef.current?.focus();
    return () => {
      html.style.overflow = overflowAnterior;
      focusAnterior?.focus({ preventScroll: true });
    };
  }, []);

  // Preîncărcăm poza următoare: swipe-ul pe telefon e instant.
  useEffect(() => {
    if (total < 2) return;
    const urmatoarea = poze[(index + 1) % total];
    if (!urmatoarea) return;
    const img = new Image();
    img.decoding = "async";
    img.src = urmatoarea.urlFull;
  }, [index, poze, total]);

  // La mărire: centrăm zona atinsă.
  useLayoutEffect(() => {
    if (!zoom) return;
    const el = zonaRef.current;
    if (!el) return;
    const { x, y } = punctZoomRef.current;
    el.scrollLeft = Math.max(0, x * el.scrollWidth - el.clientWidth / 2);
    el.scrollTop = Math.max(0, y * el.scrollHeight - el.clientHeight / 2);
  }, [zoom, index]);

  if (!poza) return null;

  const moment = parseISO(poza.facutaLa ?? poza.incarcataLa);
  const dataOra = format(moment, FORMAT_DATA_ORA, { locale: ro, in: FUS_ORAR });
  const incarcata = parseISO(poza.incarcataLa);
  const incarcataAltaData = !!poza.facutaLa && Math.abs(incarcata.getTime() - moment.getTime()) > 5 * 60_000;
  // „Încărcată 19 oct, 14:32 de Ion Popescu” (părțile apar doar dacă există) — se poate trunchia;
  // data ștergerii stă pe rândul ei și se vede mereu.
  const incarcare =
    incarcataAltaData || poza.incarcataDe
      ? [
          "Încărcată",
          incarcataAltaData ? format(incarcata, "d MMM, HH:mm", { locale: ro, in: FUS_ORAR }) : null,
          poza.incarcataDe ? `de ${poza.incarcataDe}` : null,
        ]
          .filter(Boolean)
          .join(" ")
      : null;
  const expirare = `Se șterge automat pe ${format(parseISO(poza.expiraLa), "d MMM yyyy", { locale: ro, in: FUS_ORAR })}`;
  const urlFull = poza.urlFull;
  const fullIncarcata = !!incarcate[urlFull];
  const fullEronata = eronate[urlFull] === versiuneLista;

  /** <img> nou cu aceeași adresă; URL-ul expirat se înlocuiește prin reîncărcarea listei. */
  function reincearcaPoza() {
    setEronate((m) => {
      const ramase = { ...m };
      delete ramase[urlFull];
      return ramase;
    });
    setIncercare((n) => n + 1);
    onEroareImagine(urlFull);
  }

  function laAtingereImagine(e: React.MouseEvent<HTMLImageElement>) {
    if (zoom) {
      setZoom(false);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    punctZoomRef.current = {
      x: r.width ? (e.clientX - r.left) / r.width : 0.5,
      y: r.height ? (e.clientY - r.top) / r.height : 0.5,
    };
    setZoom(true);
  }

  function laInceputAtingere(e: React.TouchEvent) {
    atingereRef.current =
      zoom || e.touches.length !== 1 ? null : { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function laSfarsitAtingere(e: React.TouchEvent) {
    const start = atingereRef.current;
    atingereRef.current = null;
    if (!start || zoom) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (total > 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      mergiLa(dx < 0 ? index + 1 : index - 1);
    } else if (dy > 90 && dy > Math.abs(dx) * 1.5) {
      onInchide();
    }
  }

  async function sterge() {
    if (seSterge) return;
    setSeSterge(true);
    // Părintele trece pe poza vecină (sau închide lightbox-ul dacă era ultima).
    await onSterge(poza.id);
    setSeSterge(false);
    setConfirmStergere(false);
    setZoom(false);
  }

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Poză inspecție ${index + 1} din ${total}`}
      className="fixed inset-0 z-[60] flex flex-col bg-black/95 text-white"
    >
      {/* Bara de sus */}
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <span className="min-w-0 truncate text-sm font-medium tabular-nums text-white/80">
          {index + 1} / {total}
          {nrInmatriculare ? ` · ${nrInmatriculare}` : ""}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => !z)}
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            aria-label={zoom ? "Micșorează" : "Mărește"}
          >
            {zoom ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
          </button>
          <button
            ref={inchideRef}
            type="button"
            onClick={onInchide}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            aria-label="Închide"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Poza. tabIndex -1: la mărire zona derulabilă nu intră în ciclul Tab (doar butoanele dialogului). */}
      <div
        ref={zonaRef}
        tabIndex={-1}
        onTouchStart={laInceputAtingere}
        onTouchEnd={laSfarsitAtingere}
        className={cn(
          "relative min-h-0 flex-1 outline-none",
          zoom ? "overflow-auto overscroll-contain" : "flex touch-none items-center justify-center overflow-hidden px-2"
        )}
      >
        {/* Miniatura (deja în cache) ține locul până se încarcă poza mare */}
        {!fullIncarcata && !zoom && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poza.urlThumb}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 m-auto max-h-full max-w-full object-contain opacity-60 blur-[2px]"
          />
        )}

        {fullEronata ? (
          <div className="relative flex flex-col items-center gap-3 px-6 text-center">
            <p className="text-sm text-white/80">Poza nu a putut fi afișată.</p>
            <button
              type="button"
              onClick={reincearcaPoza}
              className="flex h-10 items-center gap-1.5 rounded-full bg-white/10 px-4 text-sm transition-colors hover:bg-white/20"
            >
              <RotateCcw className="h-4 w-4" />
              Reîncearcă
            </button>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${urlFull}#${incercare}`}
            src={urlFull}
            alt={`Poză inspecție din ${dataOra}`}
            draggable={false}
            onLoad={() => setIncarcate((m) => ({ ...m, [urlFull]: true }))}
            onError={() => {
              setEronate((m) => ({ ...m, [urlFull]: versiuneLista }));
              onEroareImagine(urlFull);
            }}
            onClick={laAtingereImagine}
            style={
              zoom
                ? {
                    width: "250%",
                    maxWidth: "none",
                    aspectRatio: poza.latime && poza.inaltime ? `${poza.latime} / ${poza.inaltime}` : undefined,
                  }
                : undefined
            }
            className={cn(
              "relative select-none transition-opacity duration-150",
              zoom ? "h-auto cursor-zoom-out" : "max-h-full max-w-full cursor-zoom-in object-contain",
              fullIncarcata ? "opacity-100" : "opacity-0"
            )}
          />
        )}

        {!fullIncarcata && !fullEronata && (
          <Loader2 className="pointer-events-none absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-spin text-white/70" />
        )}

        {total > 1 && !zoom && (
          <>
            <button
              type="button"
              onClick={() => mergiLa(index - 1)}
              className="absolute left-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 transition-colors hover:bg-black/60"
              aria-label="Poza anterioară"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => mergiLa(index + 1)}
              className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 transition-colors hover:bg-black/60"
              aria-label="Poza următoare"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Bara de jos: data și ora + ștergere */}
      <div className="shrink-0 space-y-2 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{dataOra}</p>
            {incarcare && <p className="truncate text-xs text-white/60">{incarcare}</p>}
            <p className="text-xs text-white/60">{expirare}</p>
          </div>
          {stergereBlocata ? (
            <p className="shrink-0 text-xs text-white/60">Mod administrator</p>
          ) : (
            !confirmStergere && (
              <button
                type="button"
                onClick={() => setConfirmStergere(true)}
                className="flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm text-red-300 transition-colors hover:bg-white/10"
              >
                <Trash2 className="h-4 w-4" />
                Șterge
              </button>
            )
          )}
        </div>

        {confirmStergere && !stergereBlocata && (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-white/10 px-3 py-2">
            <p className="text-sm">Ștergi definitiv poza?</p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setConfirmStergere(false)}
                disabled={seSterge}
                className="h-10 rounded-lg px-3 text-sm transition-colors hover:bg-white/10 disabled:opacity-60"
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={sterge}
                disabled={seSterge}
                className="flex h-10 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-sm font-medium transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {seSterge && <Loader2 className="h-4 w-4 animate-spin" />}
                Șterge
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
