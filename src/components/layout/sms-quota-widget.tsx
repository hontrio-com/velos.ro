"use client";

import { motion } from "framer-motion";
import { MessageSquare, ShoppingCart, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addMonths, startOfMonth, differenceInDays } from "date-fns";
import { ro } from "date-fns/locale";
import { useSmsDisponibil } from "@/hooks/use-sms-disponibil";
import { useCumparaSmsStore } from "@/stores/cumpara-sms-store";
import { PRET_SMS_AFISAT, zileText, type SmsDisponibil } from "@/lib/sms-disponibil-shared";

const PLAN_LABELS: Record<string, string> = {
  trial: "Trial",
  basic: "Basic",
  pro: "Pro",
  enterprise: "Enterprise",
};

export function SmsQuotaWidget() {
  // SMS-urile contului (widget-ul e afișat doar proprietarilor — vezi sidebar.tsx),
  // citite pe server: aceeași sursă ca sendSms. Cheie comună cu Remindere și
  // dialogul de trimitere în masă: invalidarea după o trimitere îl reîmprospătează.
  const { data: sms } = useSmsDisponibil();
  const deschideCumparaSms = useCumparaSmsStore((s) => s.deschide);

  if (!sms) return null;

  if (sms.trialFaraSms) {
    return <WidgetTrialFaraSms sms={sms} onCumpara={deschideCumparaSms} />;
  }

  // ── Conturile existente: exact interfața de până acum ─────────────────
  if (!sms.quotaCitita) return null;

  const quota = { trimise: sms.trimise, limita: sms.limita, ramase: sms.ramase };
  const plan = sms.plan;
  const credit = sms.credit;
  const trialExpiresAt = sms.trialExpiresAt;

  const pct = quota.limita > 0 ? (quota.trimise / quota.limita) * 100 : 0;
  const barColor =
    pct > 90 ? "#DC2626" :
    pct > 70 ? "#EA580C" :
    "#1877F2";

  const isTrial = plan === "trial";
  const trialExpDate = trialExpiresAt ? new Date(trialExpiresAt) : null;
  const trialExpired = trialExpDate ? trialExpDate < new Date() : false;
  const trialZileRamase = trialExpDate ? differenceInDays(trialExpDate, new Date()) : 0;

  const nextMonth = format(startOfMonth(addMonths(new Date(), 1)), "d MMM", { locale: ro });
  const isEpuizata = quota.ramase === 0;

  return (
    <div className="px-3 py-2.5 mx-2 rounded-lg bg-white border border-[#E5E7EB]">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="h-3 w-3 text-[#6B7280]" />
          <span className="text-[11px] font-medium text-[#6B7280]">
            {isTrial ? "SMS trial" : "SMS luna aceasta"}
          </span>
        </div>
        <span className="text-[10px] text-[#9CA3AF]">{PLAN_LABELS[plan]}</span>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden mb-1"
        title={
          isTrial
            ? `${quota.ramase} SMS-uri rămase din trial`
            : `Mai ai ${quota.ramase} SMS-uri lunare + ${credit} credite. Resetare pe ${nextMonth}`
        }
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
          initial={{ width: "0%" }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className={cn("text-[11px] font-medium", isEpuizata && credit === 0 ? "text-red-600" : "text-[#6B7280]")}>
          {quota.trimise} / {quota.limita}
          {credit > 0 && (
            <span className="text-[#1877F2] ml-1">+{credit} credit</span>
          )}
        </span>
        <button
          type="button"
          onClick={deschideCumparaSms}
          className="flex items-center gap-1 text-[10px] text-[#1877F2] hover:underline"
        >
          <ShoppingCart className="h-2.5 w-2.5" />
          Cumpără
        </button>
      </div>

      {/* Trial expiry info */}
      {isTrial && trialExpDate && (
        <div className={cn(
          "flex items-center gap-1 mt-1.5",
          trialExpired ? "text-red-500" : trialZileRamase <= 3 ? "text-orange-500" : "text-[#9CA3AF]"
        )}>
          <Clock className="h-2.5 w-2.5 shrink-0" />
          <span className="text-[10px]">
            {trialExpired
              ? "Trial expirat"
              : trialZileRamase === 0
              ? "Expiră azi"
              : `Trial: ${trialZileRamase} zi${trialZileRamase === 1 ? "" : "le"} rămase`}
          </span>
        </div>
      )}

      {isEpuizata && credit === 0 && !isTrial && (
        <p className="text-[10px] text-red-500 mt-1">Quota epuizată</p>
      )}
    </div>
  );
}

/** Trialul nou (fără SMS incluse): arată doar creditul cumpărat. */
function WidgetTrialFaraSms({ sms, onCumpara }: { sms: SmsDisponibil; onCumpara: () => void }) {
  const credit = sms.credit;
  const faraCredit = credit <= 0;
  const inTrial = sms.subscriptionStatus === "trial";
  const trialExpDate = sms.trialExpiresAt ? new Date(sms.trialExpiresAt) : null;
  const trialExpired = trialExpDate ? trialExpDate < new Date() : false;
  const zileRamase = trialExpDate ? differenceInDays(trialExpDate, new Date()) : 0;

  return (
    <div className="px-3 py-2.5 mx-2 rounded-lg bg-white border border-[#E5E7EB]">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="h-3 w-3 text-[#6B7280]" />
          <span className="text-[11px] font-medium text-[#6B7280]">Credit SMS</span>
        </div>
        <span className="text-[10px] text-[#9CA3AF]">{PLAN_LABELS[sms.plan]}</span>
      </div>

      <div
        className="flex items-center justify-between"
        title={`SMS-uri cumpărate (${PRET_SMS_AFISAT}/SMS). Creditul nu expiră.`}
      >
        <span className={cn("text-[13px] font-semibold", faraCredit ? "text-red-600" : "text-[#111318]")}>
          {Math.max(0, credit).toLocaleString("ro-RO")} SMS
        </span>
        {!faraCredit && (
          <button
            type="button"
            onClick={onCumpara}
            className="flex items-center gap-1 text-[10px] text-[#1877F2] hover:underline"
          >
            <ShoppingCart className="h-2.5 w-2.5" />
            Cumpără
          </button>
        )}
      </div>
      <p className="text-[10px] text-[#9CA3AF] mt-0.5 leading-snug">
        {inTrial ? "Perioada de probă nu include SMS-uri" : "Planul tău nu include SMS-uri lunare"}
      </p>

      {faraCredit && (
        <button
          type="button"
          onClick={onCumpara}
          className="mt-2 w-full flex items-center justify-center gap-1.5 h-7 rounded-md bg-[#1877F2] hover:bg-[#1565D8] text-white text-[11px] font-semibold transition-colors"
        >
          <ShoppingCart className="h-3 w-3" />
          Cumpără SMS-uri
        </button>
      )}

      {inTrial && trialExpDate && (
        <div className={cn(
          "flex items-center gap-1 mt-1.5",
          trialExpired ? "text-red-500" : zileRamase <= 3 ? "text-orange-500" : "text-[#9CA3AF]"
        )}>
          <Clock className="h-2.5 w-2.5 shrink-0" />
          <span className="text-[10px]">
            {trialExpired
              ? "Trial expirat"
              : zileRamase === 0
              ? "Expiră azi"
              : zileRamase > 30
              ? `Gratuit până pe ${format(trialExpDate, "d MMM yyyy", { locale: ro })}`
              : zileRamase === 1
              ? "Trial: 1 zi rămasă"
              : `Trial: ${zileText(zileRamase)} rămase`}
          </span>
        </div>
      )}
    </div>
  );
}
