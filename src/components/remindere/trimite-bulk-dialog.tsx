"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  MessageSquare,
  Users,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  ShoppingCart,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { countSmsChars } from "@/lib/sms-utils";
import { trimiteReminderAction } from "@/lib/actions/remindere";
import { cn } from "@/lib/utils";
import type { TipReminder } from "@/lib/remindere-generator";
import { TIP_CONFIG } from "@/lib/remindere-generator";
import { useSmsDisponibil, SMS_DISPONIBIL_KEY } from "@/hooks/use-sms-disponibil";
import { useCumparaSmsStore } from "@/stores/cumpara-sms-store";
import { numarText, smsText } from "@/lib/sms-disponibil-shared";

export interface BulkReminder {
  id: string;
  telefon: string;
  numeClient: string;
  nrInmatriculare: string;
  tip: TipReminder;
  mesaj: string;
}

interface TrimiteBulkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remindere: BulkReminder[];
  onSuccess?: () => void;
  /**
   * Ce se trimite: remindere din „În așteptare" (implicit) sau vehicule din tabul
   * ITP Urgent — pentru vehicule textele nu trimit la tabul „În așteptare".
   */
  sursa?: "remindere" | "vehicule";
}

export function TrimiteBulkDialog({
  open,
  onOpenChange,
  remindere,
  onSuccess,
  sursa = "remindere",
}: TrimiteBulkDialogProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [templateOverride, setTemplateOverride] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    ok: number;
    err: number;
    ramasInAsteptare: number;
    /** Bucla s-a oprit pentru că SMS-urile s-au terminat (quotaDepasita). */
    opritDinCredit: boolean;
  } | null>(null);

  // SMS-urile PROPRIETARULUI stației (și când trimite un angajat) — exact contul
  // din care se consumă pe server. Incluse + credit; reîncărcate la fiecare deschidere.
  const { data: sms } = useSmsDisponibil({ enabled: open, staleTime: 0 });
  const poateCumpara = useCumparaSmsStore((s) => s.disponibil);
  const deschideCumparaSms = useCumparaSmsStore((s) => s.deschide);

  const n = remindere.length;
  const trialNou = sms?.trialFaraSms === true;
  // Doar în stările în care înainte trimiterea era blocată — trialul nou (fără SMS
  // incluse) și quota lunară consumată, dar cu credit cumpărat — trimitem cât
  // acoperă SMS-urile disponibile; restul rămân „în așteptare" (nu le marcăm cu
  // eroare) și pot fi trimise după cumpărare. Altfel: ca până acum, se încearcă toate.
  const limitat = trialNou || (sms != null && sms.ramase <= 0 && sms.credit > 0);
  const deTrimis = limitat && sms ? Math.min(n, sms.totalDisponibil) : n;

  const mesajBase = templateOverride || remindere[0]?.mesaj || "";
  const { chars, smsCount } = countSmsChars(mesajBase);

  function reset() {
    setStep(1);
    setTemplateOverride("");
    setResults(null);
    setLoading(false);
  }

  function handleClose(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  // Închidem întâi dialogul: două ferestre modale suprapuse și-ar disputa focusul.
  function cumparaSms() {
    handleClose(false);
    deschideCumparaSms();
  }

  async function handleSend() {
    setLoading(true);
    let ok = 0;
    let err = 0;
    let incercate = 0;
    let opritDinCredit = false;

    for (const r of remindere.slice(0, deTrimis)) {
      incercate++;
      const result = await trimiteReminderAction(r.id);
      if (result.success) {
        ok++;
      } else {
        err++;
        // SMS-urile s-au terminat între timp — ne oprim aici (trimiterea limitată și
        // trialul nou; celelalte conturi încearcă toate reminderele, ca până acum).
        if (result.quotaDepasita && (limitat || result.trialFaraSms)) {
          opritDinCredit = true;
          break;
        }
      }
    }

    setResults({ ok, err, ramasInAsteptare: n - incercate, opritDinCredit });
    setStep(3);
    setLoading(false);
    queryClient.invalidateQueries({ queryKey: SMS_DISPONIBIL_KEY });

    if (ok > 0) onSuccess?.();
  }

  // ── Bannerul de disponibilitate SMS din pasul 2 ──────────────────────────
  function bannerSms() {
    // Nimic disponibil — singurul caz în care trimiterea e blocată (ca în sendSms).
    if (sms && sms.totalDisponibil === 0) {
      return (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <div className="flex-1 space-y-2">
            {trialNou && poateCumpara ? (
              <p>
                <strong>Nu ai SMS-uri disponibile.</strong>{" "}
                {sms.subscriptionStatus === "trial"
                  ? "Perioada de probă nu include SMS-uri."
                  : "Planul tău actual nu include SMS-uri."}{" "}
                Cumpără credite SMS ca să poți trimite.
              </p>
            ) : trialNou ? (
              // Angajatul nu poate cumpăra: doar starea stației (îndemnul e mai jos).
              <p>
                <strong>Stația nu are SMS-uri disponibile.</strong>{" "}
                {sms.subscriptionStatus === "trial"
                  ? "Perioada de probă nu include SMS-uri."
                  : "Planul actual nu include SMS-uri."}
              </p>
            ) : (
              <p>
                Quota SMS epuizată pentru luna aceasta. Nu se pot trimite SMS-uri.{" "}
                {poateCumpara && (
                  <a href="/setari/abonament" className="underline font-medium">Upgrade plan →</a>
                )}
              </p>
            )}
            {poateCumpara ? (
              <Button size="sm" onClick={cumparaSms} className="gap-1.5">
                <ShoppingCart className="h-3.5 w-3.5" />
                Cumpără SMS-uri
              </Button>
            ) : (
              <p className="font-medium">Cere proprietarului stației să cumpere SMS-uri.</p>
            )}
          </div>
        </div>
      );
    }

    // Mai puține SMS-uri decât destinatari.
    if (sms && n > sms.totalDisponibil) {
      return (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          {trialNou ? (
            <span>
              Ai selectat {numarText(n, "destinatar", "destinatari")},{" "}
              {poateCumpara ? "dar ai doar" : "dar stația are doar"}{" "}
              <strong>{smsText(sms.totalDisponibil)}</strong> în credit.{" "}
              {sursa === "vehicule"
                ? `Se trimit primele ${sms.totalDisponibil}, iar celelalte nu vor fi trimise.`
                : `Se trimit primele ${sms.totalDisponibil}, iar celelalte rămân în așteptare.`}{" "}
              {poateCumpara && (
                <button type="button" onClick={cumparaSms} className="underline font-medium">
                  Cumpără SMS-uri →
                </button>
              )}
            </span>
          ) : (
            <span>
              Ai selectat {n} destinatari dar mai ai doar{" "}
              <strong>{sms.totalDisponibil}</strong> SMS-uri disponibile{sms.credit > 0 ? "" : " luna aceasta"}.
              Vor fi trimise doar primele {sms.totalDisponibil}.
            </span>
          )}
        </div>
      );
    }

    // Fără SMS incluse, dar creditul ajunge: cât se consumă.
    if (sms && trialNou) {
      const rest = sms.totalDisponibil - n;
      return (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#1E40AF]">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            {n === 1 ? "Se folosește 1 SMS din credit." : `Se folosesc ${smsText(n)} din credit.`}{" "}
            {rest === 1 ? "Îți rămâne 1 SMS." : `Îți rămân ${smsText(rest)}.`}
          </span>
        </div>
      );
    }

    // Conturile existente: același mesaj ca până acum; dacă se trece în creditul
    // cumpărat, spunem asta (înainte, creditul era ignorat aici).
    if (n > 10) {
      const ramase = Math.max(0, sms?.ramase ?? 0);
      return (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            {!sms || n <= ramase
              ? `Vei trimite ${n} SMS-uri din quota lunară.`
              : `Vei trimite ${smsText(n)}: ${ramase} din quota lunară și ${n - ramase} din creditul SMS.`}
          </span>
        </div>
      );
    }

    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-[#1877F2]" />
            Trimite SMS în masă
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 py-2">
          {[
            { n: 1, label: "Destinatari" },
            { n: 2, label: "Mesaj" },
            { n: 3, label: "Rezultat" },
          ].map(({ n: nr, label }, i) => (
            <div key={nr} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium",
                  step === nr
                    ? "text-[#1877F2]"
                    : step > nr
                    ? "text-[#15803D]"
                    : "text-[#9CA3AF]"
                )}
              >
                <span
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                    step === nr
                      ? "bg-[#1877F2] text-white"
                      : step > nr
                      ? "bg-[#15803D] text-white"
                      : "bg-[#F7F8FA] text-[#9CA3AF]"
                  )}
                >
                  {step > nr ? "✓" : nr}
                </span>
                {label}
              </div>
              {i < 2 && (
                <ChevronRight className="h-3 w-3 text-[#D1D5DB] shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Recipients */}
        {step === 1 && (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-white border border-[#E5E7EB]">
              <Users className="h-4 w-4 text-[#6B7280] shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#111318]">
                  {remindere.length} destinatari selectați
                </p>
                <p className="text-xs text-[#6B7280]">
                  Toți au SMS optin activ și număr de telefon valid
                </p>
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1">
              {remindere.map((r) => {
                const tipCfg = TIP_CONFIG[r.tip];
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-[#E5E7EB]"
                  >
                    <Badge
                      className={cn(
                        "border-0 text-xs shrink-0",
                        tipCfg.bgClass,
                        tipCfg.colorClass
                      )}
                    >
                      {tipCfg.labelShort}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#111318] truncate">
                        {r.numeClient}
                      </p>
                      <p className="text-[10px] text-[#6B7280] font-mono">
                        {r.telefon} · {r.nrInmatriculare}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Message preview */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#6B7280]">
                Mesaj (bazat pe template-ul primului reminder)
              </Label>
              <Textarea
                value={mesajBase}
                onChange={(e) => setTemplateOverride(e.target.value)}
                rows={4}
                className="text-sm resize-none"
                maxLength={600}
              />
              <div className="flex justify-between text-[10px] text-[#9CA3AF]">
                <span>{chars} caractere</span>
                <span className={cn("font-medium", smsCount > 1 && "text-amber-600")}>
                  {smsCount} SMS per destinatar · {remindere.length * smsCount} SMS total
                </span>
              </div>
            </div>

            {bannerSms()}
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && results && (
          <div className="py-4 flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-[#15803D]" />
            <div>
              <p className="text-base font-semibold text-[#111318]">
                Trimitere finalizată
              </p>
              <p className="text-sm text-[#6B7280] mt-1">
                <span className="font-medium text-[#15803D]">{results.ok} trimise</span>
                {results.err > 0 && (
                  <>
                    {" · "}
                    <span className="font-medium text-red-600">{results.err} erori</span>
                  </>
                )}
              </p>
            </div>
            {/* Doar când chiar s-au terminat SMS-urile: oprire pe quotaDepasita sau
                tot ce s-a încercat a plecat (altfel restul nu e din lipsă de credit). */}
            {results.ramasInAsteptare > 0 && (results.opritDinCredit || results.err === 0) && (
              <div className="w-full text-left flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <p>
                    {sursa === "vehicule"
                      ? results.ramasInAsteptare === 1
                        ? "1 SMS nu a fost trimis"
                        : `${smsText(results.ramasInAsteptare)} nu au fost trimise`
                      : results.ramasInAsteptare === 1
                      ? "1 reminder a rămas în așteptare"
                      : `${numarText(results.ramasInAsteptare, "reminder", "remindere")} au rămas în așteptare`}{" "}
                    {trialNou
                      ? poateCumpara
                        ? "pentru că nu mai ai credit SMS."
                        : "pentru că stația nu mai are credit SMS."
                      : poateCumpara
                      ? "pentru că nu mai ai SMS-uri disponibile."
                      : "pentru că stația nu mai are SMS-uri disponibile."}{" "}
                    {!poateCumpara
                      ? "Roagă proprietarul stației să cumpere SMS-uri."
                      : sursa === "vehicule"
                      ? "Cumpără SMS-uri ca să le poți trimite."
                      : "Cumpără SMS-uri și trimite-le din nou din tabul „În așteptare”."}
                  </p>
                  {poateCumpara && (
                    <Button size="sm" onClick={cumparaSms} className="gap-1.5">
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Cumpără SMS-uri
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Anulează
              </Button>
              <Button
                size="sm"
                onClick={() => setStep(2)}
                className="gap-1.5"
                disabled={remindere.length === 0}
              >
                Continuă
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
                className="gap-1.5"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Înapoi
              </Button>
              <Button
                size="sm"
                onClick={handleSend}
                disabled={loading || !mesajBase.trim() || sms?.totalDisponibil === 0}
                className="gap-1.5"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MessageSquare className="h-3.5 w-3.5" />
                )}
                {limitat ? `Trimite ${smsText(deTrimis)}` : `Trimite ${remindere.length} SMS-uri`}
              </Button>
            </>
          )}

          {step === 3 && (
            <Button size="sm" onClick={() => handleClose(false)}>
              Închide
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
