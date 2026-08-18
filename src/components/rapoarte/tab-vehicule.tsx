"use client";

import { useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { format, parseISO, isValid } from "date-fns";
import { ro } from "date-fns/locale";
import { TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRaportVehicule } from "@/hooks/use-rapoarte";
import type { CategorieStat } from "@/lib/actions/rapoarte";

function TrendPill({ value }: { value: number }) {
  if (value === 0)
    return (
      <span className="flex items-center gap-0.5 text-[10px] text-[#9CA3AF]">
        <Minus className="h-2.5 w-2.5" />0%
      </span>
    );
  const up = value > 0;
  return (
    <span className={cn("flex items-center gap-0.5 text-[10px] font-medium", up ? "text-[#15803D]" : "text-red-600")}>
      {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {up ? "+" : ""}{value}%
    </span>
  );
}

/** Donut + legendă cu bare de proporție — folosit pentru tip / combustibil / vârstă. */
function DonutCard({
  titlu,
  date,
  total,
  gol,
}: {
  titlu: string;
  date: CategorieStat[];
  total: number;
  gol: string;
}) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-[#111318] mb-3">{titlu}</h3>
      {date.length > 0 ? (
        <div className="flex items-center gap-5">
          <div className="h-[140px] w-[140px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={date}
                  cx="50%" cy="50%"
                  innerRadius={40} outerRadius={66}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="label"
                >
                  {date.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const e = payload[0];
                  return (
                    <div className="bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs shadow-lg">
                      <p className="font-semibold" style={{ color: e.payload.color }}>{e.payload.label}</p>
                      <p className="font-bold">{e.value} vehicule</p>
                    </div>
                  );
                }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 flex-1 min-w-0">
            {date.map((r) => (
              <div key={r.cheie} className="space-y-1">
                <div className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: r.color }} />
                    <span className="font-medium text-[#374151] truncate">{r.label}</span>
                  </div>
                  <span className="font-semibold text-[#111318] shrink-0">
                    {r.count}{" "}
                    <span className="text-[#9CA3AF] font-normal">
                      ({total > 0 ? Math.round((r.count / total) * 100) : 0}%)
                    </span>
                  </span>
                </div>
                <div className="h-1.5 bg-[#F7F8FA] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${total > 0 ? (r.count / total) * 100 : 0}%`, background: r.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-[140px] flex items-center justify-center text-sm text-[#9CA3AF]">{gol}</div>
      )}
    </div>
  );
}

type SortKey = "nr_inmatriculare" | "marca" | "vizite" | "ultima_vizita" | "expirare_itp";
type SortDir = "asc" | "desc";

const REZULTAT_BADGE: Record<string, string> = {
  admis: "bg-[#DCFCE7] text-[#15803D]",
  readmis: "bg-[#DBEAFE] text-[#1877F2]",
  respins: "bg-red-100 text-red-700",
};

function SortIcon({ k, sortKey, sortDir }: { k: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== k) return null;
  return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
}

function fmtData(d: string | null): string {
  if (!d) return "—";
  const parsed = parseISO(d);
  return isValid(parsed) ? format(parsed, "d MMM yyyy", { locale: ro }) : "—";
}

interface TabVehiculeProps {
  statieId: string;
  from: string;
  to: string;
}

export function TabVehicule({ statieId, from, to }: TabVehiculeProps) {
  const { data, isLoading, isFetching } = useRaportVehicule(statieId, from, to);
  const [sortKey, setSortKey] = useState<SortKey>("ultima_vizita");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(0);
  }

  if (isLoading) return <VehiculeSkeleton />;

  if (!data || data.lista.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-[#9CA3AF]">
        Niciun vehicul în această perioadă
      </div>
    );
  }

  const sorted = [...data.lista].sort((a, b) => {
    const va = a[sortKey] ?? "";
    const vb = b[sortKey] ?? "";
    if (typeof va === "number" && typeof vb === "number") {
      return sortDir === "asc" ? va - vb : vb - va;
    }
    return sortDir === "asc"
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va));
  });
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const unice = data.kpi.vehicule_unice;

  return (
    <div className={cn("space-y-5 transition-opacity", isFetching && "opacity-60")}>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Vehicule la ITP", value: unice, trend: data.kpi.trend_vehicule },
          { label: "Total vizite", value: data.kpi.vizite_total, trend: null },
          { label: "Vehicule noi", value: data.kpi.vehicule_noi, trend: null },
          { label: "Reveniri (2+ vizite)", value: data.kpi.revenite, trend: null },
        ].map(({ label, value, trend }) => (
          <div key={label} className="bg-white border border-[#E5E7EB] rounded-xl p-4">
            <p className="text-xs text-[#6B7280] mb-1">{label}</p>
            <p className="text-xl font-bold text-[#111318] leading-tight">{value}</p>
            {trend !== null && <div className="mt-1.5"><TrendPill value={trend} /></div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <p className="text-xs text-[#6B7280] mb-1">Vizite / vehicul</p>
          <p className="text-xl font-bold text-[#111318] leading-tight">{data.kpi.vizite_medii}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <p className="text-xs text-[#6B7280] mb-1">Vârstă medie parc</p>
          <p className="text-xl font-bold text-[#111318] leading-tight">
            {data.kpi.varsta_medie > 0 ? `${data.kpi.varsta_medie} ani` : "—"}
          </p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <p className="text-xs text-[#6B7280] mb-1">Marcă dominantă</p>
          <p className="text-xl font-bold text-[#111318] leading-tight truncate">
            {data.marci[0]?.label ?? "—"}
          </p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <p className="text-xs text-[#6B7280] mb-1">Tip dominant</p>
          <p className="text-xl font-bold text-[#111318] leading-tight truncate">
            {data.tipDist[0]?.label ?? "—"}
          </p>
        </div>
      </div>

      {/* Distribuții */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DonutCard titlu="Tip vehicul" date={data.tipDist} total={unice} gol="Niciun vehicul" />
        <DonutCard titlu="Combustibil" date={data.combustibil} total={unice} gol="Fără date" />
      </div>

      {/* Top mărci */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[#111318] mb-3">Top mărci</h3>
        {data.marci.length > 0 ? (
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.marci} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="#F3F4F6" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={90}
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#F9FAFB" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const e = payload[0];
                    return (
                      <div className="bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs shadow-lg">
                        <p className="font-semibold text-[#111318]">{e.payload.label}</p>
                        <p className="font-bold text-[#1877F2]">{e.value} vehicule</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {data.marci.map((m, i) => <Cell key={i} fill={m.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-sm text-[#9CA3AF]">Fără date</div>
        )}
      </div>

      {/* Vârsta parcului */}
      <DonutCard titlu="Vârsta parcului auto" date={data.varsta} total={unice} gol="Fără an de fabricație" />

      {/* Tabel */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl">
        <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#111318]">Vehicule la ITP</h3>
          <span className="text-xs text-[#9CA3AF]">{data.lista.length} vehicule</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                {([
                  { key: "nr_inmatriculare" as SortKey, label: "Nr. înmatriculare" },
                  { key: "marca" as SortKey, label: "Marcă / Model" },
                ] as { key: SortKey; label: string }[]).map(({ key, label }) => (
                  <th
                    key={key}
                    className="text-left px-4 py-2.5 text-[#6B7280] font-medium cursor-pointer hover:text-[#111318] select-none"
                    onClick={() => toggleSort(key)}
                  >
                    <span className="inline-flex items-center gap-1">{label}<SortIcon k={key} sortKey={sortKey} sortDir={sortDir} /></span>
                  </th>
                ))}
                <th className="text-left px-4 py-2.5 text-[#6B7280] font-medium">Tip</th>
                <th className="text-left px-4 py-2.5 text-[#6B7280] font-medium">An</th>
                <th className="text-left px-4 py-2.5 text-[#6B7280] font-medium">Client</th>
                {([
                  { key: "vizite" as SortKey, label: "Vizite" },
                  { key: "ultima_vizita" as SortKey, label: "Ultima vizită" },
                ] as { key: SortKey; label: string }[]).map(({ key, label }) => (
                  <th
                    key={key}
                    className="text-left px-4 py-2.5 text-[#6B7280] font-medium cursor-pointer hover:text-[#111318] select-none"
                    onClick={() => toggleSort(key)}
                  >
                    <span className="inline-flex items-center gap-1">{label}<SortIcon k={key} sortKey={sortKey} sortDir={sortDir} /></span>
                  </th>
                ))}
                <th className="text-left px-4 py-2.5 text-[#6B7280] font-medium">Rezultat</th>
                <th
                  className="text-left px-4 py-2.5 text-[#6B7280] font-medium cursor-pointer hover:text-[#111318] select-none"
                  onClick={() => toggleSort("expirare_itp")}
                >
                  <span className="inline-flex items-center gap-1">Expiră ITP<SortIcon k="expirare_itp" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((v) => (
                <tr key={v.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]">
                  <td className="px-4 py-2.5 text-[#111318] font-semibold">{v.nr_inmatriculare}</td>
                  <td className="px-4 py-2.5 text-[#374151]">
                    {[v.marca, v.model].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-[#6B7280]">
                    {data.tipDist.find((t) => t.cheie === (v.tip_vehicul ?? "necunoscut"))?.label ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-[#6B7280]">{v.an_fabricatie ?? "—"}</td>
                  <td className="px-4 py-2.5 text-[#374151]">{v.client}</td>
                  <td className="px-4 py-2.5 text-[#374151] font-medium">{v.vizite}</td>
                  <td className="px-4 py-2.5 text-[#374151]">{fmtData(v.ultima_vizita)}</td>
                  <td className="px-4 py-2.5">
                    {v.ultim_rezultat ? (
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                        REZULTAT_BADGE[v.ultim_rezultat] ?? "bg-[#F7F8FA] text-[#6B7280]"
                      )}>
                        {v.ultim_rezultat.charAt(0).toUpperCase() + v.ultim_rezultat.slice(1)}
                      </span>
                    ) : (
                      <span className="text-[#9CA3AF]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[#6B7280]">{fmtData(v.expirare_itp)}</td>
                </tr>
              ))}
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

function VehiculeSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
      <Skeleton className="h-[300px] rounded-xl" />
      <Skeleton className="h-[360px] rounded-xl" />
    </div>
  );
}
