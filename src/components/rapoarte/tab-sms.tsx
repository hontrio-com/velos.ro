"use client";

import { useState } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, parseISO, eachDayOfInterval, differenceInDays, eachWeekOfInterval, endOfWeek, eachMonthOfInterval, endOfMonth } from "date-fns";
import { ro } from "date-fns/locale";
import { MessageSquare, ChevronUp, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRaportSms } from "@/hooks/use-rapoarte";
import type { ZiSms } from "@/lib/actions/rapoarte";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#F3F4F6] rounded-lg shadow-lg px-3 py-2 text-xs">
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

function buildChartData(zilnic: ZiSms[], from: string, to: string) {
  const f = parseISO(from), t = parseISO(to);
  const days = differenceInDays(t, f) + 1;
  const byDate = Object.fromEntries(zilnic.map((z) => [z.data, z]));

  if (days <= 35) {
    return eachDayOfInterval({ start: f, end: t }).map((d) => {
      const key = format(d, "yyyy-MM-dd");
      const z = byDate[key];
      return { label: format(d, "d MMM", { locale: ro }), livrate: z?.livrate ?? 0, erori: z?.erori ?? 0 };
    });
  } else if (days <= 90) {
    return eachWeekOfInterval({ start: f, end: t }, { weekStartsOn: 1 }).map((ws) => {
      const we = endOfWeek(ws, { weekStartsOn: 1 });
      const cs = ws < f ? f : ws; const ce = we > t ? t : we;
      const acc = { livrate: 0, erori: 0 };
      eachDayOfInterval({ start: cs, end: ce }).forEach((d) => {
        const z = byDate[format(d, "yyyy-MM-dd")];
        if (z) { acc.livrate += z.livrate; acc.erori += z.erori; }
      });
      return { label: `${format(cs, "d", { locale: ro })}-${format(ce, "d MMM", { locale: ro })}`, ...acc };
    });
  } else {
    return eachMonthOfInterval({ start: f, end: t }).map((ms) => {
      const me = endOfMonth(ms);
      const cs = ms < f ? f : ms; const ce = me > t ? t : me;
      const acc = { livrate: 0, erori: 0 };
      eachDayOfInterval({ start: cs, end: ce }).forEach((d) => {
        const z = byDate[format(d, "yyyy-MM-dd")];
        if (z) { acc.livrate += z.livrate; acc.erori += z.erori; }
      });
      return { label: format(ms, "MMM yyyy", { locale: ro }), ...acc };
    });
  }
}

function QuotaCard({ luna, trimise, limita }: { luna: string; trimise: number; limita: number }) {
  const pct = limita > 0 ? (trimise / limita) * 100 : 0;
  const color = pct > 90 ? "#DC2626" : pct > 70 ? "#EA580C" : "#1877F2";
  let monthLabel = luna;
  try { monthLabel = format(parseISO(luna + "-01"), "MMM yyyy", { locale: ro }); } catch { /* noop */ }
  return (
    <div className="bg-white border border-[#F3F4F6] rounded-xl p-3">
      <p className="text-xs font-medium text-[#111318] mb-1 capitalize">{monthLabel}</p>
      <p className="text-sm font-bold text-[#111318]">
        {trimise}<span className="text-xs font-normal text-[#9CA3AF]"> / {limita === 9999 ? "∞" : limita}</span>
      </p>
      <div className="mt-2 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
      <p className="text-[10px] text-[#9CA3AF] mt-1">{Math.round(pct)}% utilizat</p>
    </div>
  );
}

type SortKey = "created_at" | "client" | "status";
type SortDir = "asc" | "desc";

const STATUS_BADGE: Record<string, string> = {
  livrat: "bg-[#DCFCE7] text-[#15803D]",
  trimis: "bg-[#DBEAFE] text-[#1877F2]",
  eroare: "bg-red-100 text-red-700",
  pending: "bg-amber-50 text-amber-700",
};

interface TabSmsProps {
  statieId: string;
  profileId: string;
  from: string;
  to: string;
}

export function TabSms({ statieId, profileId, from, to }: TabSmsProps) {
  const { data, isLoading, isFetching } = useRaportSms(statieId, profileId, from, to);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  if (isLoading) return <SmsSkeleton />;

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-[#9CA3AF]">
        Nicio activitate SMS în această perioadă
      </div>
    );
  }

  const chartData = buildChartData(data.zilnic, from, to);
  const tickInterval = Math.max(0, Math.floor((chartData.length - 1) / 10) - 1);

  const sorted = [...data.lista].sort((a, b) => {
    const va = (a as unknown as Record<string, string>)[sortKey] ?? "";
    const vb = (b as unknown as Record<string, string>)[sortKey] ?? "";
    return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
  });
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
    setPage(0);
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return null;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  }

  const maxTip = Math.max(...data.tipDist.map((t) => t.count), 1);

  return (
    <div className={cn("space-y-5 transition-opacity", isFetching && "opacity-60")}>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "SMS trimise", value: data.kpi.total },
          { label: "Livrate", value: data.kpi.livrate },
          { label: "Erori", value: data.kpi.erori },
          { label: "Rată livrare", value: `${data.kpi.rata_livrare}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-[#F3F4F6] rounded-xl p-4">
            <p className="text-xs text-[#6B7280] mb-1">{label}</p>
            <p className="text-xl font-bold text-[#111318] leading-tight">{value}</p>
          </div>
        ))}
      </div>

      {/* Area chart */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[#111318] mb-3">SMS pe zile</h3>
        {chartData.some((d) => d.livrate + d.erori > 0) ? (
          <>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="livGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval={tickInterval} />
                  <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={(p) => <ChartTip active={p.active} payload={p.payload} label={p.label} />} />
                  <Area type="monotone" dataKey="livrate" name="Livrate" stroke="#16A34A" strokeWidth={2} fill="url(#livGrad)" dot={false} />
                  <Area type="monotone" dataKey="erori" name="Erori" stroke="#DC2626" strokeWidth={1.5} fill="url(#errGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-sm text-[#9CA3AF]">Niciun SMS trimis</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tip breakdown */}
        {data.tipDist.length > 0 && (
          <div className="bg-white border border-[#F3F4F6] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[#111318] mb-3">Distribuție pe tip reminder</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.tipDist} layout="vertical" margin={{ top: 0, right: 50, left: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: "#374151" }} tickLine={false} axisLine={false} width={130} />
                  <Tooltip content={(p) => <ChartTip active={p.active} payload={p.payload} label={p.label} />} cursor={{ fill: "#F7F8FA" }} />
                  <Bar dataKey="count" name="SMS" radius={[0, 4, 4, 0]}>
                    {data.tipDist.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#1877F2" : i === 1 ? "#60A5FA" : "#93C5FD"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Quota history */}
        <div className="bg-white border border-[#F3F4F6] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-4 w-4 text-[#6B7280]" />
            <h3 className="text-sm font-semibold text-[#111318]">Quota SMS lunară</h3>
          </div>
          {data.quota && (
            <div className="mb-3 p-3 bg-[#F7F8FA] rounded-lg">
              <p className="text-xs text-[#6B7280] mb-1">Luna curentă</p>
              <p className="text-lg font-bold text-[#111318]">
                {data.quota.trimise}
                <span className="text-sm font-normal text-[#9CA3AF]"> / {data.quota.limita === 9999 ? "∞" : data.quota.limita}</span>
              </p>
              <p className="text-xs text-[#6B7280]">
                {data.quota.ramase} rămase
              </p>
            </div>
          )}
          {data.quotaHistory.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {data.quotaHistory.slice(0, 6).map((q) => (
                <QuotaCard key={q.luna} {...q} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#9CA3AF]">Fără istoric disponibil</p>
          )}
          {data.tipDist.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {data.tipDist.map((t) => (
                <div key={t.tip} className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className="h-full bg-[#1877F2] rounded-full" style={{ width: `${(t.count / maxTip) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-[#6B7280] w-20 truncate">{t.label}</span>
                  <span className="text-[10px] font-semibold text-[#374151] w-5 text-right">{t.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SMS log table */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl">
        <div className="px-4 py-3 border-b border-[#F3F4F6] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#111318]">Log SMS</h3>
          <span className="text-xs text-[#9CA3AF]">{data.lista.length} mesaje</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#F3F4F6] bg-[#F9FAFB]">
                <th className="text-left px-4 py-2.5 text-[#6B7280] font-medium cursor-pointer hover:text-[#111318] select-none" onClick={() => toggleSort("created_at")}>
                  <span className="inline-flex items-center gap-1">Data<SortIcon k="created_at" /></span>
                </th>
                <th className="text-left px-4 py-2.5 text-[#6B7280] font-medium cursor-pointer hover:text-[#111318] select-none" onClick={() => toggleSort("client")}>
                  <span className="inline-flex items-center gap-1">Client<SortIcon k="client" /></span>
                </th>
                <th className="text-left px-4 py-2.5 text-[#6B7280] font-medium">Telefon</th>
                <th className="text-left px-4 py-2.5 text-[#6B7280] font-medium">Mesaj</th>
                <th className="text-left px-4 py-2.5 text-[#6B7280] font-medium cursor-pointer hover:text-[#111318] select-none" onClick={() => toggleSort("status")}>
                  <span className="inline-flex items-center gap-1">Status<SortIcon k="status" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((m) => (
                <tr key={m.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                  <td className="px-4 py-2.5 text-[#374151] whitespace-nowrap">
                    {format(parseISO(m.created_at), "d MMM, HH:mm", { locale: ro })}
                  </td>
                  <td className="px-4 py-2.5 text-[#374151] font-medium">{m.client}</td>
                  <td className="px-4 py-2.5 text-[#374151] font-mono">{m.telefon}</td>
                  <td className="px-4 py-2.5 text-[#6B7280] max-w-[200px] truncate">{m.mesaj.slice(0, 60)}{m.mesaj.length > 60 && "…"}</td>
                  <td className="px-4 py-2.5">
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", STATUS_BADGE[m.status] ?? "bg-[#F3F4F6] text-[#6B7280]")}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#9CA3AF]">Niciun SMS</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#F3F4F6]">
            <span className="text-xs text-[#9CA3AF]">Pagina {page + 1} din {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-2 py-1 text-xs rounded border border-[#E5E7EB] disabled:opacity-40 hover:bg-[#F9FAFB]">←</button>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className="px-2 py-1 text-xs rounded border border-[#E5E7EB] disabled:opacity-40 hover:bg-[#F9FAFB]">→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SmsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <Skeleton className="h-[248px] rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-[248px] rounded-xl" />
        <Skeleton className="h-[248px] rounded-xl" />
      </div>
    </div>
  );
}
