"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  TrendingUp,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/hooks/use-count-up";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, delay },
});

interface TrendPillProps {
  pct: number | null;
  label: string;
}

function TrendPill({ pct, label }: TrendPillProps) {
  if (pct === null) return null;
  if (Math.abs(pct) < 1) {
    return (
      <span className="text-xs text-[#9CA3AF]">Stabil {label}</span>
    );
  }
  const up = pct > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full",
        up
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-600"
      )}
    >
      {up ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {up ? "+" : ""}{pct}% {label}
    </span>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const count = useCountUp(value);
  return <>{count.toLocaleString("ro-RO")}</>;
}

interface KpiCardProps {
  title: string;
  value: number;
  valueLabel?: string;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  trend: number | null;
  trendLabel: string;
  href: string;
  delay: number;
  numeric?: boolean;
}

function KpiCard({
  title,
  value,
  valueLabel,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
  trendLabel,
  href,
  delay,
  numeric = true,
}: KpiCardProps) {
  return (
    <motion.div {...fadeUp(delay)} className="h-full">
      <Link href={href} className="block h-full group">
        <div
          className={cn(
            "bg-white border border-[#E5E7EB] rounded-xl p-5 h-full cursor-pointer",
            "hover:border-[#E5E7EB] transition-all duration-150",
            "hover:-translate-y-px hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] text-[#6B7280] font-medium">{title}</span>
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                iconBg
              )}
            >
              <Icon className={cn("h-[18px] w-[18px]", iconColor)} />
            </div>
          </div>

          <p className="text-[32px] font-semibold text-[#111318] leading-none tracking-tight mb-1">
            {numeric ? <AnimatedNumber value={value} /> : value.toLocaleString("ro-RO")}
            {valueLabel && (
              <span className="text-base font-medium text-[#6B7280] ml-1">
                {valueLabel}
              </span>
            )}
          </p>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <TrendPill pct={trend} label={trendLabel} />
            <span className="text-[12px] text-[#9CA3AF]">{subtitle}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export interface KpiCardsProps {
  programariAzi: number;
  finalizateAzi: number;
  venitLuna: number;
  remindereAzi: number;
  trendProgramari?: number | null;
  trendFinalizate?: number | null;
  trendVenit?: number | null;
  lunaCurenta?: string;
}

export function KpiCards({
  programariAzi,
  finalizateAzi,
  venitLuna,
  remindereAzi,
  trendProgramari = null,
  trendFinalizate = null,
  trendVenit = null,
  lunaCurenta = "",
}: KpiCardsProps) {
  const cards: KpiCardProps[] = [
    {
      title: "Programări azi",
      value: programariAzi,
      subtitle:
        programariAzi > 0
          ? `${finalizateAzi} finalizate · ${programariAzi - finalizateAzi} în așteptare`
          : "Nicio programare",
      icon: CalendarDays,
      iconColor: "text-[#1877F2]",
      iconBg: "bg-[#EFF6FF]",
      trend: trendProgramari,
      trendLabel: "față de ieri",
      href: "/programari",
      delay: 0.08,
    },
    {
      title: "Finalizate azi",
      value: finalizateAzi,
      subtitle:
        programariAzi > 0
          ? `din ${programariAzi} programate`
          : "Nicio programare",
      icon: CheckCircle2,
      iconColor: "text-[#16A34A]",
      iconBg: "bg-[#DCFCE7]",
      trend: trendFinalizate,
      trendLabel: "față de ieri",
      href: "/programari",
      delay: 0.14,
    },
    {
      title: "Venit luna",
      value: venitLuna,
      valueLabel: "RON",
      subtitle: lunaCurenta ? `în ${lunaCurenta}` : "",
      icon: TrendingUp,
      iconColor: "text-[#7C3AED]",
      iconBg: "bg-[#F5F3FF]",
      trend: trendVenit,
      trendLabel: "față de luna trecută",
      href: "/rapoarte",
      delay: 0.2,
    },
    {
      title: "Remindere",
      value: remindereAzi,
      subtitle:
        remindereAzi > 0 ? `${remindereAzi} de trimis acum` : "Toate trimise ✓",
      icon: Bell,
      iconColor: remindereAzi > 0 ? "text-[#EA580C]" : "text-[#9CA3AF]",
      iconBg: remindereAzi > 0 ? "bg-[#FFF7ED]" : "bg-[#F9FAFB]",
      trend: null,
      trendLabel: "",
      href: "/remindere",
      delay: 0.26,
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <KpiCard key={card.title} {...card} />
      ))}
    </div>
  );
}
