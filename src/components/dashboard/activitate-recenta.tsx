"use client";

import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import {
  CheckCircle2,
  CalendarDays,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ActivitateItem {
  id: string;
  status: string;
  updated_at: string;
  client: { nume: string; prenume: string | null } | null;
  vehicul: { nr_inmatriculare: string } | null;
}

interface ActivitateRecentaProps {
  items: ActivitateItem[];
}

const statusMeta = {
  finalizat: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    label: "ITP finalizat",
  },
  programat: {
    icon: CalendarDays,
    color: "text-[#1877F2]",
    bg: "bg-[#EFF6FF]",
    label: "Programare nouă",
  },
  in_lucru: {
    icon: CalendarDays,
    color: "text-amber-600",
    bg: "bg-amber-50",
    label: "În lucru",
  },
  anulat: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
    label: "Programare anulată",
  },
  neprezent: {
    icon: AlertCircle,
    color: "text-orange-500",
    bg: "bg-orange-50",
    label: "Neprezent",
  },
} as const;

function RelativeTime({ dateStr }: { dateStr: string }) {
  const date = new Date(dateStr);
  const text = formatDistanceToNow(date, { addSuffix: true, locale: ro });
  return <span className="text-xs text-[#9CA3AF]">{text}</span>;
}

export function ActivitateRecenta({ items }: ActivitateRecentaProps) {
  return (
    <Card className="border-[#E5E7EB] shadow-none h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-[#111318]">
          Activitate recentă
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="py-10 text-center px-4">
            <p className="text-sm text-[#9CA3AF]">Nicio activitate recentă</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[30px] top-0 bottom-0 w-px bg-[#F7F8FA]" />

            <ul className="space-y-0">
              {items.map((item, i) => {
                const meta =
                  statusMeta[item.status as keyof typeof statusMeta] ??
                  statusMeta.programat;
                const Icon = meta.icon;
                const numeClient = item.client
                  ? `${item.client.nume}${item.client.prenume ? " " + item.client.prenume : ""}`
                  : null;
                const nrAuto = item.vehicul?.nr_inmatriculare;

                return (
                  <li
                    key={item.id}
                    className={cn(
                      "flex items-start gap-3 px-5 py-3",
                      i !== items.length - 1 && "border-b border-[#F9FAFB]"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full shrink-0 relative z-10",
                        meta.bg
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", meta.color)} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm text-[#111318] leading-snug">
                        {meta.label}
                        {nrAuto && (
                          <span className="font-mono font-medium">
                            {" "}— {nrAuto}
                          </span>
                        )}
                      </p>
                      {numeClient && (
                        <p className="text-xs text-[#6B7280] mt-0.5">
                          {numeClient}
                          {" · "}
                          <RelativeTime dateStr={item.updated_at} />
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
