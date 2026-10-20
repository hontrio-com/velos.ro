"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchAll } from "@/lib/fetch-all";
import { Bell, Clock, CheckCircle2, AlertCircle, MessageSquare, ShoppingCart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSmsDisponibil } from "@/hooks/use-sms-disponibil";
import { useCumparaSmsStore } from "@/stores/cumpara-sms-store";

interface RemindereStatsProps {
  statieId: string;
}

export function RemindereStats({ statieId }: RemindereStatsProps) {
  const supabase = createClient();
  // SMS-urile proprietarului stației (și pentru angajați) — contul din care se
  // consumă la trimitere. Înainte se citea quota utilizatorului logat (greșit pentru angajați).
  const { data: sms } = useSmsDisponibil();
  const poateCumpara = useCumparaSmsStore((s) => s.disponibil);
  const deschideCumparaSms = useCumparaSmsStore((s) => s.deschide);

  const { data, isLoading } = useQuery({
    queryKey: ["remindere-stats", statieId],
    queryFn: async () => {
      const rows = await fetchAll<{ status: string }>((from, to) =>
        supabase
          .from("remindere")
          .select("status")
          .eq("statie_id", statieId)
          .order("id", { ascending: true })
          .range(from, to)
      );

      const all = rows ?? [];
      return {
        total: all.length,
        pending: all.filter((r) => r.status === "pending").length,
        trimise: all.filter((r) => r.status === "trimis" || r.status === "livrat").length,
        erori: all.filter((r) => r.status === "eroare").length,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  const quota = sms && !sms.trialFaraSms && sms.quotaCitita
    ? { trimise: sms.trimise, limita: sms.limita, ramase: sms.ramase }
    : null;

  const quotaPct = quota && quota.limita > 0
    ? (quota.trimise / quota.limita) * 100
    : 0;
  const quotaColor =
    quotaPct > 90 ? "#DC2626" :
    quotaPct > 70 ? "#EA580C" :
    "#1877F2";

  const kpis = [
    { label: "Total", value: data?.total ?? 0, icon: Bell, color: "text-[#1877F2]", bg: "bg-[#EFF6FF]" },
    { label: "În așteptare", value: data?.pending ?? 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Trimise", value: data?.trimise ?? 0, icon: CheckCircle2, color: "text-[#15803D]", bg: "bg-[#DCFCE7]" },
    { label: "Erori", value: data?.erori ?? 0, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
      {kpis.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-center gap-3">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", bg)}>
            <Icon className={cn("h-4 w-4", color)} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-[#111318] leading-tight">{value}</p>
            <p className="text-xs text-[#6B7280] leading-tight">{label}</p>
          </div>
        </div>
      ))}

      {sms?.trialFaraSms ? (
        /* Credit SMS — contul nu are SMS incluse (trialul nou) */
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
              sms.credit <= 0 ? "bg-red-50" : "bg-[#EFF6FF]"
            )}>
              <MessageSquare className={cn("h-4 w-4", sms.credit <= 0 ? "text-red-600" : "text-[#1877F2]")} />
            </div>
            <div className="min-w-0">
              <p className={cn("text-xl font-bold leading-tight", sms.credit <= 0 ? "text-red-600" : "text-[#111318]")}>
                {Math.max(0, sms.credit).toLocaleString("ro-RO")}
              </p>
              <p className="text-xs text-[#6B7280] leading-tight">Credit SMS</p>
            </div>
          </div>
          {poateCumpara ? (
            <button
              type="button"
              onClick={deschideCumparaSms}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-[#1877F2] hover:underline"
            >
              <ShoppingCart className="h-3 w-3" />
              Cumpără SMS-uri
            </button>
          ) : (
            <p className="mt-2 text-[10px] text-[#9CA3AF] leading-tight">
              {sms.subscriptionStatus === "trial" ? "Trialul nu include SMS-uri" : "Planul nu include SMS-uri"}
            </p>
          )}
        </div>
      ) : (
        /* Quota SMS card */
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F7F8FA] shrink-0">
              <MessageSquare className="h-4 w-4 text-[#6B7280]" />
            </div>
            <div className="min-w-0">
              {quota ? (
                <p className="text-xl font-bold text-[#111318] leading-tight">
                  {quota.trimise}
                  <span className="text-sm font-normal text-[#9CA3AF]">
                    /{quota.limita === 9999 ? "∞" : quota.limita}
                  </span>
                </p>
              ) : (
                <p className="text-xl font-bold text-[#111318] leading-tight">—</p>
              )}
              <p className="text-xs text-[#6B7280] leading-tight">SMS luna aceasta</p>
            </div>
          </div>
          {quota && (
            <div className="w-full h-1 rounded-full bg-[#E5E7EB] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: quotaColor }}
                initial={{ width: "0%" }}
                animate={{ width: `${Math.min(quotaPct, 100)}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
