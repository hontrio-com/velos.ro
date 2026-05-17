"use client";

import { useState, useEffect } from "react";
import { getSmartPageStatsAction } from "@/lib/actions/smart-page";
import type { SmartPageStats } from "@/lib/actions/smart-page";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { TrendingUp, Eye, Smartphone, Monitor, Globe, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  google:    { label: "Google",     color: "#4285F4" },
  facebook:  { label: "Facebook",   color: "#1877F2" },
  instagram: { label: "Instagram",  color: "#E1306C" },
  tiktok:    { label: "TikTok",     color: "#010101" },
  whatsapp:  { label: "WhatsApp",   color: "#25D366" },
  twitter:   { label: "X / Twitter",color: "#1DA1F2" },
  direct:    { label: "Direct",     color: "#6B7280" },
  other:     { label: "Altele",     color: "#9CA3AF" },
};

function KpiCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
      <p className="text-xs text-[#6B7280] font-medium">{label}</p>
      <p className="text-2xl font-bold text-[#111318] mt-1">{value.toLocaleString("ro-RO")}</p>
      {sub && <p className="text-[11px] text-[#9CA3AF] mt-0.5">{sub}</p>}
    </div>
  );
}

function PercentBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#374151] font-medium">{label}</span>
        <span className="text-[#6B7280]">{value} <span className="text-[#9CA3AF]">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  let formattedLabel = label ?? "";
  try { formattedLabel = format(parseISO(label ?? ""), "d MMM", { locale: ro }); } catch {}
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-lg px-3 py-2">
      <p className="text-xs text-[#6B7280]">{formattedLabel}</p>
      <p className="text-sm font-bold text-[#111318]">{payload[0].value} vizualizări</p>
    </div>
  );
}

export function SmartPageStatsTab({ statieId }: { statieId: string }) {
  const [stats, setStats] = useState<SmartPageStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSmartPageStatsAction(statieId).then((res) => {
      if ("error" in res) setError(res.error);
      else setStats(res);
      setLoading(false);
    });
  }, [statieId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#9CA3AF]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>
    );
  }

  if (!stats) return null;

  const hasData = stats.totalAllTime > 0;
  const totalSources = stats.bySource.reduce((s, r) => s + r.views, 0);
  const totalDevices = stats.byDevice.reduce((s, r) => s + r.views, 0);
  const mobileViews = stats.byDevice.find((d) => d.device === "mobile")?.views ?? 0;
  const desktopViews = stats.byDevice.find((d) => d.device === "desktop")?.views ?? 0;
  const mobilePercent = totalDevices > 0 ? Math.round((mobileViews / totalDevices) * 100) : 0;

  // Chart data: show last 14 days with short labels
  const chartData = stats.byDay.slice(-14).map((d) => ({
    ...d,
    label: format(parseISO(d.date), "d MMM", { locale: ro }),
  }));

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3 flex items-start gap-2">
        <TrendingUp className="h-4 w-4 text-[#1877F2] shrink-0 mt-0.5" />
        <p className="text-xs text-[#374151]">
          Statisticile se actualizează în timp real. Vizualizările sunt înregistrate din browsere — crawlerele și
          roboții nu sunt numărați.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Azi" value={stats.totalToday} />
        <KpiCard label="Ultimele 7 zile" value={stats.total7d} />
        <KpiCard label="Ultimele 30 zile" value={stats.total30d} />
        <KpiCard label="Total vizualizări" value={stats.totalAllTime} sub="toate timpurile" />
      </div>

      {!hasData ? (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 flex flex-col items-center gap-3 text-center">
          <div className="h-14 w-14 rounded-2xl bg-[#F9FAFB] flex items-center justify-center">
            <Eye className="h-7 w-7 text-[#9CA3AF]" />
          </div>
          <p className="text-sm font-medium text-[#374151]">Nicio vizualizare încă</p>
          <p className="text-xs text-[#9CA3AF] max-w-xs">
            Activează Smart Page și distribuie link-ul pentru a vedea statisticile.
          </p>
        </div>
      ) : (
        <>
          {/* Daily chart */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
            <p className="text-sm font-semibold text-[#111318] mb-4">Vizualizări zilnice — ultimele 14 zile</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={18}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F3F4F6" }} />
                <Bar dataKey="views" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.date === new Date().toISOString().slice(0, 10) ? "#1877F2" : "#BFDBFE"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Sources */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-4 w-4 text-[#6B7280]" />
                <p className="text-sm font-semibold text-[#111318]">Surse de trafic</p>
              </div>
              <div className="space-y-3">
                {stats.bySource.length > 0 ? (
                  stats.bySource.map((s) => {
                    const cfg = SOURCE_CONFIG[s.source] ?? { label: s.source, color: "#9CA3AF" };
                    return (
                      <PercentBar
                        key={s.source}
                        label={cfg.label}
                        value={s.views}
                        total={totalSources}
                        color={cfg.color}
                      />
                    );
                  })
                ) : (
                  <p className="text-xs text-[#9CA3AF]">Nicio sursă înregistrată</p>
                )}
              </div>
            </div>

            {/* Devices */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="h-4 w-4 text-[#6B7280]" />
                <p className="text-sm font-semibold text-[#111318]">Dispozitive</p>
              </div>

              {totalDevices > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-6 py-2">
                    <div className="text-center">
                      <Smartphone className="h-6 w-6 text-[#1877F2] mx-auto mb-1" />
                      <p className="text-xl font-bold text-[#111318]">{mobilePercent}%</p>
                      <p className="text-xs text-[#6B7280]">Mobile</p>
                    </div>
                    <div className="h-10 w-px bg-[#E5E7EB]" />
                    <div className="text-center">
                      <Monitor className="h-6 w-6 text-[#6B7280] mx-auto mb-1" />
                      <p className="text-xl font-bold text-[#111318]">{100 - mobilePercent}%</p>
                      <p className="text-xs text-[#6B7280]">Desktop</p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {stats.byDevice.map((d) => (
                      <PercentBar
                        key={d.device}
                        label={d.device === "mobile" ? "Mobile" : d.device === "tablet" ? "Tabletă" : "Desktop"}
                        value={d.views}
                        total={totalDevices}
                        color={d.device === "mobile" ? "#1877F2" : d.device === "tablet" ? "#7C3AED" : "#6B7280"}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#9CA3AF]">Niciun dispozitiv înregistrat</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
