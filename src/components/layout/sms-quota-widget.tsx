"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { format, addMonths, startOfMonth } from "date-fns";
import { ro } from "date-fns/locale";

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

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      const [{ data: profileData }, { data: quotaData }] = await Promise.all([
        supabase.from("profiles").select("plan").eq("id", user.id).single(),
        supabase.rpc("get_sms_quota", { p_profile_id: user.id }),
      ]);

      if (profileData?.plan) setPlan(profileData.plan);
      if (quotaData?.[0]) setQuota(quotaData[0]);
    });
  }, []);

  if (!quota) return null;

  const pct = quota.limita > 0 ? (quota.trimise / quota.limita) * 100 : 0;
  const barColor =
    pct > 90 ? "#DC2626" :
    pct > 70 ? "#EA580C" :
    "#1877F2";

  const nextMonth = format(startOfMonth(addMonths(new Date(), 1)), "d MMM", { locale: ro });
  const lunaAceasta = format(new Date(), "MMMM yyyy", { locale: ro });
  const isEpuizata = quota.ramase === 0;

  return (
    <div className="px-3 py-2.5 mx-2 rounded-lg bg-[#F7F8FA] border border-[#F3F4F6]">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="h-3 w-3 text-[#6B7280]" />
          <span className="text-[11px] font-medium text-[#6B7280]">SMS luna aceasta</span>
        </div>
        <span className="text-[10px] text-[#9CA3AF]">{PLAN_LABELS[plan]}</span>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden mb-1"
        title={`Mai ai ${quota.ramase} SMS-uri disponibile. Resetare pe ${nextMonth}`}
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
        <span className={cn("text-[11px] font-medium", isEpuizata ? "text-red-600" : "text-[#6B7280]")}>
          {isEpuizata
            ? "Quota epuizată"
            : `${quota.trimise} / ${quota.limita === 9999 ? "∞" : quota.limita}`}
        </span>
        {isEpuizata && (
          <a
            href="/setari/abonament"
            className="text-[10px] text-[#1877F2] hover:underline"
          >
            Upgrade →
          </a>
        )}
      </div>
    </div>
  );
}
