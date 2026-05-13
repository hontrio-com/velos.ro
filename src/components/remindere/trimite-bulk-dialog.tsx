"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  MessageSquare,
  Users,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
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
import { toast } from "sonner";
import { countSmsChars } from "@/lib/sms-utils";
import { trimiteReminderAction } from "@/lib/actions/remindere";
import { cn } from "@/lib/utils";
import type { TipReminder } from "@/lib/remindere-generator";
import { TIP_CONFIG } from "@/lib/remindere-generator";
import { createClient } from "@/lib/supabase/client";

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
}

export function TrimiteBulkDialog({
  open,
  onOpenChange,
  remindere,
  onSuccess,
}: TrimiteBulkDialogProps) {
  const [step, setStep] = useState(1);
  const [templateOverride, setTemplateOverride] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ ok: number; err: number } | null>(null);
  const [quota, setQuota] = useState<{ ramase: number; limita: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.rpc("get_sms_quota", { p_profile_id: user.id });
      if (data?.[0]) setQuota({ ramase: data[0].ramase, limita: data[0].limita });
    });
  }, [open]);

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

  async function handleSend() {
    setLoading(true);
    let ok = 0;
    let err = 0;

    for (const r of remindere) {
      const result = await trimiteReminderAction(r.id);
      if (result.success) ok++;
      else err++;
    }

    setResults({ ok, err });
    setStep(3);
    setLoading(false);

    if (ok > 0) onSuccess?.();
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
          ].map(({ n, label }, i) => (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium",
                  step === n
                    ? "text-[#1877F2]"
                    : step > n
                    ? "text-[#15803D]"
                    : "text-[#9CA3AF]"
                )}
              >
                <span
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                    step === n
                      ? "bg-[#1877F2] text-white"
                      : step > n
                      ? "bg-[#15803D] text-white"
                      : "bg-[#F3F4F6] text-[#9CA3AF]"
                  )}
                >
                  {step > n ? "✓" : n}
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
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#F7F8FA] border border-[#F3F4F6]">
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
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-[#F3F4F6]"
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

            {quota && quota.ramase === 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  Quota SMS epuizată pentru luna aceasta. Nu se pot trimite SMS-uri.{" "}
                  <a href="/setari/abonament" className="underline font-medium">Upgrade plan →</a>
                </span>
              </div>
            )}
            {quota && quota.ramase > 0 && remindere.length > quota.ramase && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  Ai selectat {remindere.length} destinatari dar mai ai doar{" "}
                  <strong>{quota.ramase}</strong> SMS-uri disponibile luna aceasta.
                  Vor fi trimise doar primele {quota.ramase}.
                </span>
              </div>
            )}
            {remindere.length > 10 && (!quota || (quota.ramase >= remindere.length)) && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  Vei trimite {remindere.length} SMS-uri din quota lunară.
                </span>
              </div>
            )}
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
                disabled={loading || !mesajBase.trim() || quota?.ramase === 0}
                className="gap-1.5"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MessageSquare className="h-3.5 w-3.5" />
                )}
                Trimite {remindere.length} SMS-uri
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
