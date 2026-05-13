"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, type PieLabelRenderProps } from "recharts";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import { TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRaportItp } from "@/hooks/use-rapoarte";

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

const RADIAN = Math.PI / 180;
function PieLabel(props: PieLabelRenderProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (!cx || !cy || !midAngle || !innerRadius || !outerRadius || !percent || Number(percent) < 0.06) return null;
  const r = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
  const x = Number(cx) + r * Math.cos(-Number(midAngle) * RADIAN);
  const y = Number(cy) + r * Math.sin(-Number(midAngle) * RADIAN);
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>{`${(Number(percent) * 100).toFixed(0)}%`}</text>;
}

type SortKey = "data_inspectie" | "vehicul" | "client" | "rezultat";
type SortDir = "asc" | "desc";

interface TabItpProps {
  statieId: string;
  from: string;
  to: string;
}

export function TabItp({ statieId, from, to }: TabItpProps) {
  const { data, isLoading, isFetching } = useRaportItp(statieId, from, to);
  const [sortKey, setSortKey] = useState<SortKey>("data_inspectie");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(0);
  }

  if (isLoading) return <ItpSkeleton />;

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-[#9CA3AF]">
        Nicio inspecție în această perioadă
      </div>
    );
  }

  const sorted = [...data.lista].sort((a, b) => {
    const va = a[sortKey] ?? "";
    const vb = b[sortKey] ?? "";
    return sortDir === "asc"
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va));
  });
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return null;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  }

  const BADGE_COLORS: Record<string, string> = {
    admis: "bg-[#DCFCE7] text-[#15803D]",
    readmis: "bg-[#DBEAFE] text-[#1877F2]",
    respins: "bg-red-100 text-red-700",
  };

  return (
    <div className={cn("space-y-5 transition-opacity", isFetching && "opacity-60")}>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "ITP efectuate", value: data.kpi.total, trend: data.kpi.trend_total },
          { label: "Admise", value: data.kpi.admise, trend: null },
          { label: "Respinse", value: data.kpi.respinse, trend: null },
          { label: "Rată admitere", value: `${data.kpi.rata_admitere}%`, trend: null },
        ].map(({ label, value, trend }) => (
          <div key={label} className="bg-white border border-[#E5E7EB] rounded-xl p-4">
            <p className="text-xs text-[#6B7280] mb-1">{label}</p>
            <p className="text-xl font-bold text-[#111318] leading-tight">{value}</p>
            {trend !== null && <div className="mt-1.5"><TrendPill value={trend} /></div>}
          </div>
        ))}
      </div>

      {/* Rezultate pie */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[#111318] mb-3">Distribuție rezultate ITP</h3>
        {data.rezultate.some((r) => r.count > 0) ? (
          <div className="flex items-center gap-6">
            <div className="h-[160px] w-[160px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.rezultate.filter((r) => r.count > 0)}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={75}
                    paddingAngle={2}
                    dataKey="count"
                    labelLine={false}
                    label={PieLabel}
                  >
                    {data.rezultate.filter((r) => r.count > 0).map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const e = payload[0];
                    return (
                      <div className="bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs shadow-lg">
                        <p className="font-semibold" style={{ color: e.payload.color }}>{e.name}</p>
                        <p className="font-bold">{e.value}</p>
                      </div>
                    );
                  }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 flex-1">
              {data.rezultate.map((r) => (
                <div key={r.rezultat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: r.color }} />
                      <span className="font-medium text-[#374151]">{r.label}</span>
                    </div>
                    <span className="font-semibold text-[#111318]">
                      {r.count} <span className="text-[#9CA3AF] font-normal">
                        ({data.kpi.total > 0 ? Math.round((r.count / data.kpi.total) * 100) : 0}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#F7F8FA] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${data.kpi.total > 0 ? (r.count / data.kpi.total) * 100 : 0}%`, background: r.color }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-[#9CA3AF] pt-1">
                Rată admitere: <span className="font-semibold text-[#111318]">{data.kpi.rata_admitere}%</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[160px] flex items-center justify-center text-sm text-[#9CA3AF]">
            Nicio inspecție înregistrată
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl">
        <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#111318]">Lista inspecții</h3>
          <span className="text-xs text-[#9CA3AF]">{data.lista.length} inspecții</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                {([
                  { key: "data_inspectie" as SortKey, label: "Data" },
                  { key: "vehicul" as SortKey, label: "Vehicul" },
                  { key: "client" as SortKey, label: "Client" },
                  { key: "rezultat" as SortKey, label: "Rezultat" },
                ] as { key: SortKey; label: string }[]).map(({ key, label }) => (
                  <th
                    key={key}
                    className="text-left px-4 py-2.5 text-[#6B7280] font-medium cursor-pointer hover:text-[#111318] select-none"
                    onClick={() => toggleSort(key)}
                  >
                    <span className="inline-flex items-center gap-1">{label}<SortIcon k={key} /></span>
                  </th>
                ))}
                <th className="text-left px-4 py-2.5 text-[#6B7280] font-medium">Inspector</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((r) => (
                <tr key={r.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]">
                  <td className="px-4 py-2.5 text-[#374151]">
                    {format(parseISO(r.data_inspectie), "d MMM yyyy", { locale: ro })}
                  </td>
                  <td className="px-4 py-2.5 text-[#374151] font-medium">{r.vehicul}</td>
                  <td className="px-4 py-2.5 text-[#374151]">{r.client}</td>
                  <td className="px-4 py-2.5">
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", BADGE_COLORS[r.rezultat] ?? "bg-[#F7F8FA] text-[#6B7280]")}>
                      {r.rezultat.charAt(0).toUpperCase() + r.rezultat.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[#9CA3AF]">{r.inspector ?? "—"}</td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#9CA3AF]">Nicio inspecție</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#E5E7EB]">
            <span className="text-xs text-[#9CA3AF]">Pagina {page + 1} din {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2 py-1 text-xs rounded border border-[#E5E7EB] disabled:opacity-40 hover:bg-[#F9FAFB]"
              >
                ←
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="px-2 py-1 text-xs rounded border border-[#E5E7EB] disabled:opacity-40 hover:bg-[#F9FAFB]"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ItpSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <Skeleton className="h-[220px] rounded-xl" />
      <Skeleton className="h-[360px] rounded-xl" />
    </div>
  );
}
