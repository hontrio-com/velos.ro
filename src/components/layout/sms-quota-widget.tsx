"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, ShoppingCart, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { format, addMonths, startOfMonth, differenceInDays } from "date-fns";
import { ro } from "date-fns/locale";
import { CumparaSmsModal } from "@/components/sms/cumpara-sms-modal";

interface Quota {
  trimise: number;
  limita: number;
  ramase: number;
}

const PLAN_LABELS: Record<string, string> = {
  trial: "Trial",
  basic: "Basic",
  pro: "Pro",
  enterprise: "Enterprise",
};

export function SmsQuotaWidget() {
  const [quota, setQuota] = useState<Quota | null>(null);
  const [plan, setPlan] = useState<string>("trial");
  const [credit, setCredit] = useState<number>(0);
  const [trialExpiresAt, setTrialExpiresAt] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      const [{ data: profileData }, { data: quotaData }] = await Promise.all([
        supabase.from("profiles").select("plan, sms_credit, trial_expires_at").eq("id", user.id).single(),
        supabase.rpc("get_sms_quota", { p_profile_id: user.id }),
      ]);

      if (profileData?.plan) setPlan(profileData.plan);
      if (profileData?.sms_credit) setCredit(profileData.sms_credit);
      if (profileData?.trial_expires_at) setTrialExpiresAt(profileData.trial_expires_at);
      if (quotaData?.[0]) setQuota(quotaData[0]);
    });
  }, []);

  if (!quota) return null;

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
    <>
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
            onClick={() => setModalOpen(true)}
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

      <CumparaSmsModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
