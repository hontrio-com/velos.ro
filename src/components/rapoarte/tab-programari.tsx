"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  type PieLabelRenderProps,
} from "recharts";
import { format, parseISO, eachDayOfInterval, differenceInDays, eachWeekOfInterval, eachMonthOfInterval, endOfWeek, endOfMonth } from "date-fns";
import { ro } from "date-fns/locale";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRaportProgramari } from "@/hooks/use-rapoarte";
import type { ZiProgramari } from "@/lib/actions/rapoarte";

function TrendPill({ value }: { value: number }) {
  if (value === 0) return <span className="flex items-center gap-0.5 text-[10px] text-[#9CA3AF]"><Minus className="h-2.5 w-2.5" />0%</span>;
  const up = value > 0;
  return (
    <span className={cn("flex items-center gap-0.5 text-[10px] font-medium", up ? "text-[#15803D]" : "text-red-600")}>
      {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {up ? "+" : ""}{value}%
    </span>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-[#111318] mb-1.5">{label}</p>
      {payload.map((e: { name: string; value: number; color: string }) => (
        <div key={e.name} className="flex justify-between gap-3">
          <span style={{ color: e.color }}>{e.name}</span>
          <span className="font-semibold">{e.value}</span>
        </div>
      ))}
    </div>
  );
}

const RADIAN = Math.PI / 180;
function PieLabel(props: PieLabelRenderProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (!cx || !cy || !midAngle || !innerRadius || !outerRadius || !percent || Number(percent) < 0.06) return null;
  const r = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
  const x = Number(cx) + r * Math.cos(-Number(midAngle) * RADIAN);
  const y = Number(cy) + r * Math.sin(-Number(midAngle) * RADIAN);
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>{`${(Number(percent) * 100).toFixed(0)}%`}</text>;
}

function buildChartData(zilnic: ZiProgramari[], from: string, to: string) {
  const f = parseISO(from), t = parseISO(to);
  const days = differenceInDays(t, f) + 1;
  const byDate = Object.fromEntries(zilnic.map((z) => [z.data, z]));

  function empty() { return { finalizat: 0, in_lucru: 0, programat: 0, neprezent: 0, anulat: 0 }; }
  function addDay(acc: ReturnType<typeof empty>, key: string) {
    const z = byDate[key];
    if (z) {
      acc.finalizat += z.finalizate;
      acc.neprezent += z.neprezent;
      acc.anulat += z.anulate;
    }
    return acc;
  }

  if (days <= 35) {
    return eachDayOfInterval({ start: f, end: t }).map((d) => {
      const key = format(d, "yyyy-MM-dd");
      return { label: format(d, "d MMM", { locale: ro }), ...addDay(empty(), key) };
    });
  } else if (days <= 90) {
    return eachWeekOfInterval({ start: f, end: t }, { weekStartsOn: 1 }).map((ws) => {
      const we = endOfWeek(ws, { weekStartsOn: 1 });
      const cs = ws < f ? f : ws;
      const ce = we > t ? t : we;
      const acc = empty();
      eachDayOfInterval({ start: cs, end: ce }).forEach((d) => addDay(acc, format(d, "yyyy-MM-dd")));
      return { label: `${format(cs, "d", { locale: ro })}-${format(ce, "d MMM", { locale: ro })}`, ...acc };
    });
  } else {
    return eachMonthOfInterval({ start: f, end: t }).map((ms) => {
      const me = endOfMonth(ms);
      const cs = ms < f ? f : ms;
      const ce = me > t ? t : me;
      const acc = empty();
      eachDayOfInterval({ start: cs, end: ce }).forEach((d) => addDay(acc, format(d, "yyyy-MM-dd")));
      return { label: format(ms, "MMM yyyy", { locale: ro }), ...acc };
    });
  }
}

interface TabProgramariProps {
  statieId: string;
  from: string;
  to: string;
}

export function TabProgramari({ statieId, from, to }: TabProgramariProps) {
  const { data, isLoading, isFetching } = useRaportProgramari(statieId, from, to);

  const chartData = useMemo(
    () => (data ? buildChartData(data.zilnic, from, to) : []),
    [data, from, to]
  );
  const tickInterval = Math.max(0, Math.floor((chartData.length - 1) / 10) - 1);

  if (isLoading) return <ProgramariSkeleton />;

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-[#9CA3AF]">
        Nicio activitate în această perioadă
      </div>
    );
  }

  const totalRow = {
    total: data.zilnic.reduce((s, z) => s + z.total, 0),
    finalizate: data.zilnic.reduce((s, z) => s + z.finalizate, 0),
    neprezent: data.zilnic.reduce((s, z) => s + z.neprezent, 0),
    anulate: data.zilnic.reduce((s, z) => s + z.anulate, 0),
    venit: data.zilnic.reduce((s, z) => s + z.venit, 0),
  };

  return (
    <div className={cn("space-y-5 transition-opacity", isFetching && "opacity-60")}>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total programări", value: data.kpi.total, trend: data.kpi.trend_total },
          { label: "Finalizate", value: data.kpi.finalizate, trend: data.kpi.trend_finalizate },
          { label: "Neprezent", value: data.kpi.neprezent, trend: null },
          { label: "Rată prezență", value: `${data.kpi.rata_prezenta}%`, trend: null },
        ].map(({ label, value, trend }) => (
          <div key={label} className="bg-white border border-[#E5E7EB] rounded-xl p-4">
            <p className="text-xs text-[#6B7280] mb-1">{label}</p>
            <p className="text-xl font-bold text-[#111318] leading-tight">{value}</p>
            {trend !== null && <div className="mt-1.5"><TrendPill value={trend} /></div>}
          </div>
        ))}
      </div>

      {/* Stacked Bar Chart */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[#111318] mb-3">Programări pe zile</h3>
        {chartData.some((d) => d.finalizat + d.neprezent + d.anulat > 0) ? (
          <>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval={tickInterval} />
                  <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={(p) => <ChartTip active={p.active} payload={p.payload} label={p.label} />} cursor={{ fill: "#F7F8FA" }} />
                  <Bar dataKey="finalizat" name="Finalizat" stackId="a" fill="#16A34A" />
                  <Bar dataKey="neprezent" name="Neprezent" stackId="a" fill="#EA580C" />
                  <Bar dataKey="anulat" name="Anulat" stackId="a" fill="#DC2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {[
                { label: "Finalizat", color: "#16A34A" },
                { label: "Neprezent", color: "#EA580C" },
                { label: "Anulat", color: "#DC2626" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                  <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-sm text-[#9CA3AF]">Nicio activitate</div>
        )}
      </div>

      {/* Status distribution donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[#111318] mb-3">Distribuție status</h3>
          {data.statusDist.some((d) => d.count > 0) ? (
            <div className="flex items-center gap-4">
              <div className="h-[160px] w-[160px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.statusDist.filter((d) => d.count > 0)} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="count" labelLine={false} label={PieLabel}>
                      {data.statusDist.filter((d) => d.count > 0).map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const e = payload[0];
                      return <div className="bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs shadow-lg"><p className="font-semibold" style={{ color: e.payload.color }}>{e.name}</p><p className="font-bold">{e.value}</p></div>;
                    }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex-1">
                {data.statusDist.filter((d) => d.count > 0).map((s) => (
                  <div key={s.status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-[#6B7280]">{s.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">{s.count}</span>
                      <span className="text-[#9CA3AF]">({data.kpi.total > 0 ? Math.round((s.count / data.kpi.total) * 100) : 0}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[160px] flex items-center justify-center text-sm text-[#9CA3AF]">Fără date</div>
          )}
        </div>

        {/* Daily table */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl">
          <div className="px-4 py-3 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-semibold text-[#111318]">Rezumat pe zile</h3>
          </div>
          <div className="max-h-[220px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#F9FAFB]">
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left px-4 py-2 text-[#6B7280] font-medium">Data</th>
                  <th className="text-right px-4 py-2 text-[#6B7280] font-medium">Total</th>
                  <th className="text-right px-4 py-2 text-[#6B7280] font-medium">Fin.</th>
                  <th className="text-right px-4 py-2 text-[#6B7280] font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {data.zilnic.map((z) => (
                  <tr key={z.data} className={cn("border-b border-[#E5E7EB]", z.rata < 70 && z.total > 0 && "bg-red-50/40")}>
                    <td className="px-4 py-1.5 text-[#374151]">{format(parseISO(z.data), "d MMM", { locale: ro })}</td>
                    <td className="px-4 py-1.5 text-right">{z.total}</td>
                    <td className="px-4 py-1.5 text-right">{z.finalizate}</td>
                    <td className={cn("px-4 py-1.5 text-right font-medium", z.rata >= 85 ? "text-[#15803D]" : z.rata >= 70 ? "text-amber-600" : "text-red-600")}>
                      {z.rata}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#E5E7EB] bg-[#F9FAFB]">
                  <td className="px-4 py-2 font-semibold text-[#111318]">TOTAL</td>
                  <td className="px-4 py-2 text-right font-semibold">{totalRow.total}</td>
                  <td className="px-4 py-2 text-right font-semibold">{totalRow.finalizate}</td>
                  <td className="px-4 py-2 text-right font-semibold">{data.kpi.rata_prezenta}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgramariSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <Skeleton className="h-[268px] rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-[220px] rounded-xl" />
        <Skeleton className="h-[220px] rounded-xl" />
      </div>
    </div>
  );
}
