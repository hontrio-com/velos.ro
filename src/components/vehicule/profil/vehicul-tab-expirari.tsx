"use client";

import { differenceInDays, parseISO, format, addDays } from "date-fns";
import { ro } from "date-fns/locale";
import { ShieldCheck, AlertTriangle, Clock, CheckCircle2, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VehiculComplet } from "./vehicul-profil-client";

interface Props { vehicul: VehiculComplet }

interface ExpiryItem {
  label: string;
  date: string | null;
  tip: "legal" | "tehnic" | "fiscal";
}

function getStatus(date: string | null) {
  if (!date) return "lipsa" as const;
  const days = differenceInDays(parseISO(date), new Date());
  if (days < 0) return "expirat" as const;
  if (days <= 7) return "urgent" as const;
  if (days <= 30) return "curand" as const;
  return "valid" as const;
}

const STATUS_CONFIG = {
  valid:   { label: "Valid", icon: ShieldCheck,   className: "bg-[#DCFCE7] text-[#15803D]", bar: "#16A34A" },
  curand:  { label: "Expiră curând", icon: Clock,  className: "bg-amber-100 text-amber-700",  bar: "#F59E0B" },
  urgent:  { label: "Urgent!", icon: AlertTriangle, className: "bg-orange-100 text-orange-700", bar: "#EA580C" },
  expirat: { label: "Expirat", icon: XCircle,      className: "bg-red-100 text-red-700",       bar: "#DC2626" },
  lipsa:   { label: "Lipsă", icon: Info,           className: "bg-[#F3F4F6] text-[#9CA3AF]",  bar: "#E5E7EB" },
};

function ExpiryCard({ label, date, tip }: ExpiryItem) {
  const status = getStatus(date);
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  const days = date ? differenceInDays(parseISO(date), new Date()) : null;

  const tipColor = {
    legal: "#1877F2",
    tehnic: "#7C3AED",
    fiscal: "#059669",
  }[tip];

  // Progress bar: 365 days = 100%, current remaining
  const pct = date && days !== null
    ? Math.max(0, Math.min(100, ((days) / 365) * 100))
    : 0;

  return (
    <div className={cn("bg-white border border-[#F3F4F6] rounded-xl p-4 space-y-3", status === "expirat" && "border-red-200")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: tipColor }} />
          <span className="text-sm font-semibold text-[#111318]">{label}</span>
        </div>
        <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0", cfg.className)}>
          <Icon className="h-3 w-3" />
          {cfg.label}
        </div>
      </div>

      {date ? (
        <>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#6B7280]">
              {format(parseISO(date), "d MMMM yyyy", { locale: ro })}
            </span>
            {days !== null && (
              <span className={cn("font-semibold", days < 0 ? "text-red-600" : days <= 30 ? "text-amber-600" : "text-[#374151]")}>
                {days < 0 ? `Expirat de ${Math.abs(days)} zile` : days === 0 ? "Expiră azi!" : `${days} zile rămase`}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: cfg.bar }}
            />
          </div>
        </>
      ) : (
        <p className="text-xs text-[#9CA3AF]">Dată necompletată — editează profilul vehiculului</p>
      )}
    </div>
  );
}

export function VehiculTabExpirari({ vehicul }: Props) {
  const items: ExpiryItem[] = [
    { label: "ITP", date: vehicul.expirare_itp, tip: "legal" },
    { label: "RCA", date: vehicul.expirare_rca, tip: "legal" },
    { label: "Rovinietă", date: vehicul.expirare_rovinieta, tip: "fiscal" },
    { label: "Revizie", date: vehicul.expirare_revizie, tip: "tehnic" },
    { label: "Tahograf", date: vehicul.expirare_tahograf, tip: "tehnic" },
    { label: "ISCIR", date: vehicul.expirare_iscir, tip: "tehnic" },
  ];

  const expired = items.filter((i) => getStatus(i.date) === "expirat");
  const urgent = items.filter((i) => getStatus(i.date) === "urgent");
  const curand = items.filter((i) => getStatus(i.date) === "curand");
  const valid = items.filter((i) => getStatus(i.date) === "valid");

  // Alert banner
  const hasAlerts = expired.length > 0 || urgent.length > 0;

  return (
    <div className="space-y-4">
      {/* Alert */}
      {hasAlerts && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">
              {expired.length > 0 && `${expired.length} document${expired.length > 1 ? "e expirate" : " expirat"}`}
              {expired.length > 0 && urgent.length > 0 && " · "}
              {urgent.length > 0 && `${urgent.length} expiră în mai puțin de 7 zile`}
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              {[...expired, ...urgent].map((i) => i.label).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Expirate", count: expired.length, color: "#DC2626", bg: "#FEF2F2" },
          { label: "Urgente", count: urgent.length, color: "#EA580C", bg: "#FFF7ED" },
          { label: "Curând", count: curand.length, color: "#F59E0B", bg: "#FFFBEB" },
          { label: "Valabile", count: valid.length, color: "#16A34A", bg: "#F0FDF4" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className="bg-white border border-[#F3F4F6] rounded-xl p-3 text-center">
            <p className="text-2xl font-bold" style={{ color }}>{count}</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Legends */}
      <div className="flex items-center gap-3 text-[11px] text-[#9CA3AF]">
        {[
          { color: "#1877F2", label: "Documente legale" },
          { color: "#7C3AED", label: "Tehnice" },
          { color: "#059669", label: "Fiscale" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <ExpiryCard key={item.label} {...item} />
        ))}
      </div>

      {/* Hint */}
      <div className="bg-[#F7F8FA] border border-[#F3F4F6] rounded-xl px-4 py-3 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-[#9CA3AF] mt-0.5 shrink-0" />
        <p className="text-xs text-[#6B7280]">
          Datele de expirare se setează din tabul <strong>Profil</strong>. Remindere automate se configurează din modulul <strong>Remindere</strong>.
        </p>
      </div>
    </div>
  );
}
