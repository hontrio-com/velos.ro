"use client";

import Link from "next/link";
import { BarChart, Bar, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { Eye, ExternalLink, TrendingUp } from "lucide-react";

interface DayView { date: string; views: number }

interface SmartPageWidgetProps {
  slug: string;
  totalToday: number;
  total7d: number;
  total30d: number;
  byDay7: DayView[];
}

function MiniTooltip({ active, payload }: { active?: boolean; payload?: { value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg px-2 py-1 text-xs shadow-sm">
      {payload[0].value} vizualizări
    </div>
  );
}

export function SmartPageWidget({ slug, totalToday, total7d, total30d, byDay7 }: SmartPageWidgetProps) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF]">
            <Eye className="h-4 w-4 text-[#1877F2]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#111318]">Smart Page</p>
            <p className="text-[11px] text-[#9CA3AF]">velos.ro/{slug}</p>
          </div>
        </div>
        <Link
          href="/smart-page"
          className="flex items-center gap-1 text-[11px] text-[#1877F2] hover:underline font-medium"
        >
          Detalii
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Azi", value: totalToday },
          { label: "7 zile", value: total7d },
          { label: "30 zile", value: total30d },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#F7F8FA] rounded-lg px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-[#111318] leading-none">{value.toLocaleString("ro-RO")}</p>
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Sparkline */}
      {total7d > 0 ? (
        <div>
          <p className="text-[10px] text-[#9CA3AF] mb-1.5 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Ultimele 7 zile
          </p>
          <ResponsiveContainer width="100%" height={52}>
            <BarChart data={byDay7} barSize={10} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <Tooltip content={<MiniTooltip />} cursor={false} />
              <Bar dataKey="views" radius={[3, 3, 0, 0]}>
                {byDay7.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.date === today ? "#1877F2" : "#BFDBFE"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-xs text-[#9CA3AF] text-center py-2">
          Nicio vizualizare în ultimele 7 zile
        </p>
      )}
    </div>
  );
}
