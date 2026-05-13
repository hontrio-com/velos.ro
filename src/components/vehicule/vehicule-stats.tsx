"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { differenceInDays, parseISO } from "date-fns";
import { Car, AlertTriangle, Clock, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface VehiculeStatsProps {
  statieId: string;
}

export function VehiculeStats({ statieId }: VehiculeStatsProps) {
  const supabase = createClient();

  const { data, isLoading } = useQuery({
    queryKey: ["vehicule-stats", statieId],
    queryFn: async () => {
      const { data } = await supabase
        .from("vehicule")
        .select("expirare_itp")
        .eq("statie_id", statieId);

      const today = new Date();
      let expirati = 0;
      let expiraCurand = 0;
      let valabile = 0;

      for (const v of data ?? []) {
        if (!v.expirare_itp) continue;
        const days = differenceInDays(parseISO(v.expirare_itp), today);
        if (days < 0) expirati++;
        else if (days <= 30) expiraCurand++;
        else valabile++;
      }

      return { total: (data ?? []).length, expirati, expiraCurand, valabile };
    },
  });

  const stats = [
    {
      label: "Total vehicule",
      value: data?.total ?? 0,
      icon: Car,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "ITP expirat",
      value: data?.expirati ?? 0,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Expira in 30 zile",
      value: data?.expiraCurand ?? 0,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "ITP valabil",
      value: data?.valabile ?? 0,
      icon: ShieldCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label} className="border-border shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                bg
              )}
            >
              <Icon className={cn("h-4 w-4", color)} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-foreground leading-tight">
                {value}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                {label}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
