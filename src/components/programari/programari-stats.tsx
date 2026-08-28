"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchAll } from "@/lib/fetch-all";
import { CalendarDays, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProgramariStatsProps {
  statieId: string;
  date: string;
}

export function ProgramariStats({ statieId, date }: ProgramariStatsProps) {
  const supabase = createClient();

  const { data, isLoading } = useQuery({
    queryKey: ["programari-stats", statieId, date],
    queryFn: async () => {
      const rows = await fetchAll<{ status: string }>((from, to) =>
        supabase
          .from("programari")
          .select("status")
          .eq("statie_id", statieId)
          .eq("data_programare", date)
          .order("id", { ascending: true })
          .range(from, to)
      );

      const all = rows ?? [];
      const total = all.filter((r) => r.status !== "anulat").length;
      const finalizate = all.filter((r) => r.status === "finalizat").length;
      const in_lucru = all.filter((r) => r.status === "in_lucru").length;
      const rata =
        total > 0 ? Math.round(((finalizate + in_lucru) / total) * 100) : 0;

      return { total, finalizate, in_lucru, rata };
    },
  });

  const items = [
    { label: "Total programari", value: data?.total ?? 0, icon: CalendarDays },
    { label: "Finalizate", value: data?.finalizate ?? 0, icon: CheckCircle2 },
    { label: "In lucru", value: data?.in_lucru ?? 0, icon: Clock },
    { label: "Rata prezenta", value: `${data?.rata ?? 0}%`, icon: TrendingUp },
  ] as const;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="rounded-xl border border-border bg-card px-4 py-3.5 flex items-center gap-3"
          >
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xl font-bold text-foreground leading-none">
                {item.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
