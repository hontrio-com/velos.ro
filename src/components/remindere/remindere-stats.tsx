"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Bell, Clock, CheckCircle2, AlertCircle, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RemindereStatsProps {
  statieId: string;
}

interface Quota {
  trimise: number;
  limita: number;
  ramase: number;
}

export function RemindereStats({ statieId }: RemindereStatsProps) {
  const supabase = createClient();
  const [quota, setQuota] = useState<Quota | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["remindere-stats", statieId],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("remindere")
        .select("status")
        .eq("statie_id", statieId);

      const all = rows ?? [];
      return {
        total: all.length,
        pending: all.filter((r) => r.status === "pending").length,
        trimise: all.filter((r) => r.status === "trimis" || r.status === "livrat").length,
        erori: all.filter((r) => r.status === "eroare").length,
      };
    },
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: q } = await supabase.rpc("get_sms_quota", { p_profile_id: user.id });
      if (q?.[0]) setQuota(q[0]);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

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
        <div key={label} className="bg-white border border-[#F3F4F6] rounded-xl p-4 flex items-center gap-3">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", bg)}>
            <Icon className={cn("h-4 w-4", color)} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-[#111318] leading-tight">{value}</p>
            <p className="text-xs text-[#6B7280] leading-tight">{label}</p>
          </div>
        </div>
      ))}

      {/* Quota SMS card */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F3F4F6] shrink-0">
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
    </div>
  );
}
