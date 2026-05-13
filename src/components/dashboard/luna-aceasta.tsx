"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, CheckCircle2, DollarSign, TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LunaAceastaProps {
  luna: {
    label: string;
    finalizate: number;
    venit: number;
    rataAdmis: number | null;
  };
  lunaPrec: {
    finalizate: number;
    venit: number;
  };
}

function Trend({ current, prev }: { current: number; prev: number }) {
  if (prev === 0 && current === 0) return null;
  if (prev === 0) return <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />;

  const pct = Math.round(((current - prev) / prev) * 100);
  if (Math.abs(pct) < 2) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;

  return pct > 0 ? (
    <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600">
      <TrendingUp className="h-3.5 w-3.5" />
      +{pct}%
    </span>
  ) : (
    <span className="flex items-center gap-0.5 text-xs font-medium text-red-500">
      <TrendingDown className="h-3.5 w-3.5" />
      {pct}%
    </span>
  );
}

export function LunaAceasta({ luna, lunaPrec }: LunaAceastaProps) {
  const stats = [
    {
      label: "Finalizate",
      value: luna.finalizate.toLocaleString("ro-RO"),
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      trend: <Trend current={luna.finalizate} prev={lunaPrec.finalizate} />,
    },
    {
      label: "Venituri",
      value: `${luna.venit.toLocaleString("ro-RO")} RON`,
      icon: DollarSign,
      color: "text-violet-600",
      bg: "bg-violet-50",
      trend: <Trend current={luna.venit} prev={lunaPrec.venit} />,
    },
    ...(luna.rataAdmis !== null
      ? [
          {
            label: "ITP Admis",
            value: `${luna.rataAdmis}%`,
            icon: BarChart3,
            color: "text-blue-600",
            bg: "bg-blue-50",
            trend: null,
          },
        ]
      : []),
  ];

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {luna.label}
          </CardTitle>
          <Link
            href="/rapoarte"
            className="flex items-center gap-1 h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            Rapoarte
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("grid gap-4", stats.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2")}>
          {stats.map(({ label, value, icon: Icon, color, bg, trend }) => (
            <div
              key={label}
              className="flex flex-col gap-2 rounded-xl border border-border bg-background p-4"
            >
              <div className="flex items-center justify-between">
                <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", bg)}>
                  <Icon className={cn("h-3.5 w-3.5", color)} />
                </div>
                {trend}
              </div>
              <div>
                <p className="text-xl font-bold text-foreground leading-tight">
                  {value}
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
        {lunaPrec.finalizate > 0 && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Luna trecuta: {lunaPrec.finalizate} finalizate,{" "}
            {lunaPrec.venit.toLocaleString("ro-RO")} RON
          </p>
        )}
      </CardContent>
    </Card>
  );
}
