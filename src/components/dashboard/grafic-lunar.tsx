"use client";

import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";

export interface ZiData {
  zi: string;
  programari: number;
  finalizate: number;
  venit: number;
}

interface GraficLunarProps {
  data: ZiData[];
  lunaLabel: string;
}

interface TooltipEntry {
  dataKey?: string;
  value?: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const programari = payload.find((p) => p.dataKey === "programari")?.value ?? 0;
  const finalizate = payload.find((p) => p.dataKey === "finalizate")?.value ?? 0;
  const venit = payload.find((p) => p.dataKey === "venit")?.value ?? 0;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-md p-3 text-sm min-w-[140px]">
      <p className="font-semibold text-[#111318] mb-1.5">Ziua {label}</p>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#6B7280]">
            <span className="h-2 w-2 rounded-full bg-[#1877F2] inline-block" />
            Programări
          </span>
          <span className="font-medium text-[#111318]">{programari}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#6B7280]">
            <span className="h-2 w-2 rounded-full bg-[#16A34A] inline-block" />
            Finalizate
          </span>
          <span className="font-medium text-[#111318]">{finalizate}</span>
        </div>
        {(venit as number) > 0 && (
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-[#F3F4F6]">
            <span className="text-[#6B7280]">Venit</span>
            <span className="font-medium text-[#111318]">
              {(venit as number).toLocaleString("ro-RO")} RON
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function GraficLunar({ data, lunaLabel }: GraficLunarProps) {
  return (
    <Card className="border-[#F3F4F6] shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 text-[#111318]">
            <BarChart3 className="h-4 w-4 text-[#1877F2]" />
            Activitate {lunaLabel}
          </CardTitle>
          <Link
            href="/rapoarte"
            className="flex items-center gap-1 h-7 px-2 text-xs font-medium text-[#6B7280] hover:text-[#111318] hover:bg-[#F9FAFB] rounded-md transition-colors"
          >
            Rapoarte
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-4">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gradientBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1877F2" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F3F4F6"
              vertical={false}
            />
            <XAxis
              dataKey="zi"
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              interval={4}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#E5E7EB", strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="programari"
              stroke="#1877F2"
              strokeWidth={2}
              fill="url(#gradientBlue)"
              dot={false}
              activeDot={{ r: 4, fill: "#1877F2", strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="finalizate"
              stroke="#16A34A"
              strokeWidth={2}
              fill="url(#gradientGreen)"
              dot={false}
              activeDot={{ r: 4, fill: "#16A34A", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 px-1">
          <span className="flex items-center gap-1.5 text-xs text-[#6B7280]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1877F2] inline-block" />
            Programări
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[#6B7280]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#16A34A] inline-block" />
            Finalizate
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
