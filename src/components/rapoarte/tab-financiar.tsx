"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { format, parseISO, eachDayOfInterval, differenceInDays, eachWeekOfInterval, eachMonthOfInterval, endOfWeek, endOfMonth } from "date-fns";
import { ro } from "date-fns/locale";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRaportFinanciar } from "@/hooks/use-rapoarte";
import type { ZiFinanciar } from "@/lib/actions/rapoarte";

function fmtRon(v: number) {
  return new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(v) + " RON";
}

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
    <div className="bg-white border border-[#F3F4F6] rounded-lg shadow-lg px-3 py-2 text-xs min-w-[140px]">
      <p className="font-semibold text-[#111318] mb-1.5">{label}</p>
      {payload.map((e: { name: string; value: number; color: string }) => (
        <div key={e.name} className="flex justify-between gap-3">
          <span style={{ color: e.color }}>{e.name}</span>
          <span className="font-semibold">{e.name === "Venit" ? fmtRon(e.value) : e.value}</span>
        </div>
      ))}
    </div>
  );
}

function buildChartData(zilnic: ZiFinanciar[], from: string, to: string) {
  const f = parseISO(from), t = parseISO(to);
  const days = differenceInDays(t, f) + 1;
  const byDate = Object.fromEntries(zilnic.map((z) => [z.data, z]));

  if (days <= 35) {
    return eachDayOfInterval({ start: f, end: t }).map((d) => {
      const key = format(d, "yyyy-MM-dd");
      const z = byDate[key];
      return { label: format(d, "d MMM", { locale: ro }), venit: z?.venit ?? 0, finalizate: z?.finalizate ?? 0 };
    });
  } else if (days <= 90) {
    return eachWeekOfInterval({ start: f, end: t }, { weekStartsOn: 1 }).map((ws) => {
      const we = endOfWeek(ws, { weekStartsOn: 1 });
      const cs = ws < f ? f : ws;
      const ce = we > t ? t : we;
      const acc = { venit: 0, finalizate: 0 };
      eachDayOfInterval({ start: cs, end: ce }).forEach((d) => {
        const z = byDate[format(d, "yyyy-MM-dd")];
        if (z) { acc.venit += z.venit; acc.finalizate += z.finalizate; }
      });
      return { label: `${format(cs, "d", { locale: ro })}-${format(ce, "d MMM", { locale: ro })}`, ...acc };
    });
  } else {
    return eachMonthOfInterval({ start: f, end: t }).map((ms) => {
      const me = endOfMonth(ms);
      const cs = ms < f ? f : ms;
      const ce = me > t ? t : me;
      const acc = { venit: 0, finalizate: 0 };
      eachDayOfInterval({ start: cs, end: ce }).forEach((d) => {
        const z = byDate[format(d, "yyyy-MM-dd")];
        if (z) { acc.venit += z.venit; acc.finalizate += z.finalizate; }
      });
      return { label: format(ms, "MMM yyyy", { locale: ro }), ...acc };
    });
  }
}

interface TabFinanciarProps {
  statieId: string;
  from: string;
  to: string;
}

export function TabFinanciar({ statieId, from, to }: TabFinanciarProps) {
  const { data, isLoading, isFetching } = useRaportFinanciar(statieId, from, to);

  const chartData = useMemo(
    () => (data ? buildChartData(data.zilnic, from, to) : []),
    [data, from, to]
  );

  const tickInterval = Math.max(0, Math.floor((chartData.length - 1) / 10) - 1);

  if (isLoading) return <FinanciarSkeleton />;

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-[#9CA3AF]">
        Nicio activitate în această perioadă
      </div>
    );
  }

  const totalVenit = data.zilnic.reduce((s, z) => s + z.venit, 0);

  return (
    <div className={cn("space-y-5 transition-opacity", isFetching && "opacity-60")}>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Venit total", value: fmtRon(data.kpi.venit_total), trend: data.kpi.trend_venit },
          { label: "ITP-uri plătite", value: data.kpi.itp_platite.toString(), trend: data.kpi.trend_itp },
          { label: "Preț mediu / ITP", value: fmtRon(data.kpi.pret_mediu), trend: null },
          { label: "Rată colectare", value: `${data.kpi.rata_colectare}%`, trend: null },
        ].map(({ label, value, trend }) => (
          <div key={label} className="bg-white border border-[#F3F4F6] rounded-xl p-4">
            <p className="text-xs text-[#6B7280] mb-1">{label}</p>
            <p className="text-xl font-bold text-[#111318] leading-tight">{value}</p>
            {trend !== null && (
              <div className="mt-1.5">
                <TrendPill value={trend} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Area chart */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[#111318] mb-3">Venituri zilnice</h3>
        {chartData.some((d) => d.venit > 0) ? (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="venGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1877F2" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval={tickInterval} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip content={(p) => <ChartTip active={p.active} payload={p.payload} label={p.label} />} cursor={{ stroke: "#F3F4F6" }} />
                <Area type="monotone" dataKey="venit" name="Venit" stroke="#1877F2" strokeWidth={2} fill="url(#venGrad)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-sm text-[#9CA3AF]">
            Niciun venit înregistrat
          </div>
        )}
      </div>

      {/* Tip vehicul breakdown */}
      {data.tipVehicul.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bar chart */}
          <div className="bg-white border border-[#F3F4F6] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[#111318] mb-3">Venit pe tip vehicul</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.tipVehicul} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <YAxis type="category" dataKey="tip" tick={{ fontSize: 11, fill: "#374151" }} tickLine={false} axisLine={false} width={90} />
                  <Tooltip content={(p) => <ChartTip active={p.active} payload={p.payload} label={p.label} />} cursor={{ fill: "#F7F8FA" }} />
                  <Bar dataKey="venit" name="Venit" radius={[0, 4, 4, 0]}>
                    {data.tipVehicul.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#1877F2" : i === 1 ? "#60A5FA" : "#93C5FD"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-[#F3F4F6] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[#111318] mb-3">Detalii pe tip vehicul</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#F3F4F6]">
                  <th className="text-left py-2 text-[#6B7280] font-medium">Tip vehicul</th>
                  <th className="text-right py-2 text-[#6B7280] font-medium">Nr ITP</th>
                  <th className="text-right py-2 text-[#6B7280] font-medium">Venit</th>
                  <th className="text-right py-2 text-[#6B7280] font-medium">Preț mediu</th>
                </tr>
              </thead>
              <tbody>
                {data.tipVehicul.map((t) => (
                  <tr key={t.tip} className="border-b border-[#F3F4F6]">
                    <td className="py-2 text-[#111318] font-medium">{t.tip}</td>
                    <td className="py-2 text-right text-[#374151]">{t.nr}</td>
                    <td className="py-2 text-right text-[#374151]">{fmtRon(t.venit)}</td>
                    <td className="py-2 text-right text-[#374151]">{fmtRon(t.pret_mediu)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#E5E7EB]">
                  <td className="py-2 font-semibold text-[#111318]">TOTAL</td>
                  <td className="py-2 text-right font-semibold">{data.tipVehicul.reduce((s, t) => s + t.nr, 0)}</td>
                  <td className="py-2 text-right font-semibold">{fmtRon(totalVenit)}</td>
                  <td className="py-2 text-right font-semibold">{fmtRon(data.kpi.pret_mediu)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Daily table */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl">
        <div className="px-4 py-3 border-b border-[#F3F4F6]">
          <h3 className="text-sm font-semibold text-[#111318]">Detalii zilnice</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#F3F4F6] bg-[#F9FAFB]">
                <th className="text-left px-4 py-2.5 text-[#6B7280] font-medium">Data</th>
                <th className="text-right px-4 py-2.5 text-[#6B7280] font-medium">Total</th>
                <th className="text-right px-4 py-2.5 text-[#6B7280] font-medium">Finalizate</th>
                <th className="text-right px-4 py-2.5 text-[#6B7280] font-medium">Venit</th>
              </tr>
            </thead>
            <tbody>
              {data.zilnic.map((z) => (
                <tr key={z.data} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                  <td className="px-4 py-2 text-[#374151]">
                    {format(parseISO(z.data), "EEEE, d MMM yyyy", { locale: ro })}
                  </td>
                  <td className="px-4 py-2 text-right text-[#374151]">{z.total}</td>
                  <td className="px-4 py-2 text-right text-[#374151]">{z.finalizate}</td>
                  <td className="px-4 py-2 text-right text-[#374151]">{fmtRon(z.venit)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#E5E7EB] bg-[#F9FAFB]">
                <td className="px-4 py-2.5 font-semibold text-[#111318]">TOTAL</td>
                <td className="px-4 py-2.5 text-right font-semibold">{data.zilnic.reduce((s, z) => s + z.total, 0)}</td>
                <td className="px-4 py-2.5 text-right font-semibold">{data.zilnic.reduce((s, z) => s + z.finalizate, 0)}</td>
                <td className="px-4 py-2.5 text-right font-semibold">{fmtRon(totalVenit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function FinanciarSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <Skeleton className="h-[268px] rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-[248px] rounded-xl" />
        <Skeleton className="h-[248px] rounded-xl" />
      </div>
    </div>
  );
}
