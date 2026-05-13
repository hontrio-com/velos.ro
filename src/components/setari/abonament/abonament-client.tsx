"use client";

import { useState } from "react";
import { Check, Zap, Star, Building2, Crown, MessageSquare, CalendarDays, Users, BarChart3, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Plan {
  id: string;
  name: string;
  price: string;
  priceNote: string;
  sms: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "trial",
    name: "Trial",
    price: "Gratuit",
    priceNote: "30 de zile",
    sms: "50 SMS/lună",
    description: "Pentru a testa platforma",
    icon: Zap,
    color: "#6B7280",
    bg: "#F9FAFB",
    cta: "Plan curent",
    features: [
      "1 stație ITP",
      "50 SMS-uri/lună",
      "Programări nelimitate",
      "Gestionare clienți",
      "Rapoarte de bază",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    price: "99 RON",
    priceNote: "/ lună",
    sms: "200 SMS/lună",
    description: "Pentru stații mici",
    icon: Star,
    color: "#059669",
    bg: "#ECFDF5",
    cta: "Alege Basic",
    features: [
      "1 stație ITP",
      "200 SMS-uri/lună",
      "Programări nelimitate",
      "Remindere automate",
      "Export CSV & PDF",
      "Suport email",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "199 RON",
    priceNote: "/ lună",
    sms: "500 SMS/lună",
    description: "Cel mai popular",
    icon: Crown,
    color: "#1877F2",
    bg: "#EFF6FF",
    cta: "Alege Pro",
    popular: true,
    features: [
      "Până la 3 stații ITP",
      "500 SMS-uri/lună",
      "Programări online (booking)",
      "Remindere automate avansate",
      "Rapoarte detaliate",
      "Export CSV & PDF",
      "Suport prioritar",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Personalizat",
    priceNote: "",
    sms: "SMS nelimitat",
    description: "Pentru rețele de stații",
    icon: Building2,
    color: "#7C3AED",
    bg: "#F5F3FF",
    cta: "Contactează-ne",
    features: [
      "Stații nelimitate",
      "SMS-uri nelimitate",
      "API dedicat",
      "SLA garantat",
      "Manager de cont dedicat",
      "Integrare personalizată",
      "Factură lunară",
    ],
  },
];

const FEATURE_ICONS: Record<string, React.ElementType> = {
  "SMS": MessageSquare,
  "Programări": CalendarDays,
  "clienți": Users,
  "Rapoarte": BarChart3,
  "stații": Shield,
};

interface AbonamentClientProps {
  currentPlan: string;
  email: string;
}

export function AbonamentClient({ currentPlan, email }: AbonamentClientProps) {
  const [loading, setLoading] = useState<string | null>(null);

  function handleSelect(planId: string) {
    if (planId === currentPlan) return;
    if (planId === "enterprise") {
      window.location.href = `mailto:contact@itpbase.ro?subject=Enterprise%20-%20${encodeURIComponent(email)}`;
      return;
    }
    setLoading(planId);
    // Redirect to contact / payment flow
    setTimeout(() => {
      window.location.href = `mailto:contact@itpbase.ro?subject=Upgrade%20la%20${planId}%20-%20${encodeURIComponent(email)}`;
      setLoading(null);
    }, 300);
  }

  const currentPlanData = PLANS.find((p) => p.id === currentPlan) ?? PLANS[0];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Current plan banner */}
      <div
        className="rounded-xl border p-4 flex items-center gap-4"
        style={{ background: currentPlanData.bg, borderColor: `${currentPlanData.color}30` }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
          style={{ background: `${currentPlanData.color}20` }}
        >
          <currentPlanData.icon className="h-5 w-5" style={{ color: currentPlanData.color }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#111318]">
            Plan curent: <span style={{ color: currentPlanData.color }}>{currentPlanData.name}</span>
          </p>
          <p className="text-xs text-[#6B7280] mt-0.5">{currentPlanData.sms} incluse</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-[#111318]">{currentPlanData.price}</p>
          {currentPlanData.priceNote && (
            <p className="text-[11px] text-[#6B7280]">{currentPlanData.priceNote}</p>
          )}
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = plan.id === currentPlan;
          const isLoading = loading === plan.id;

          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-xl border bg-white p-5 flex flex-col transition-shadow",
                isCurrent
                  ? "ring-2 shadow-sm"
                  : "hover:shadow-md",
                plan.popular && !isCurrent && "border-[#1877F2]/40"
              )}
              style={isCurrent ? { borderColor: plan.color } : undefined}
            >
              {plan.popular && (
                <div
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: plan.color }}
                >
                  Cel mai popular
                </div>
              )}

              {isCurrent && (
                <div
                  className="absolute -top-2.5 right-3 px-3 py-0.5 rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: plan.color }}
                >
                  Activ
                </div>
              )}

              {/* Header */}
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                  style={{ background: `${plan.color}15` }}
                >
                  <Icon className="h-4 w-4" style={{ color: plan.color }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111318]">{plan.name}</p>
                  <p className="text-[11px] text-[#9CA3AF]">{plan.description}</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-[#111318]">{plan.price}</span>
                  {plan.priceNote && (
                    <span className="text-xs text-[#9CA3AF]">{plan.priceNote}</span>
                  )}
                </div>
                <p className="text-[11px] font-medium mt-0.5" style={{ color: plan.color }}>
                  {plan.sms}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check
                      className="h-3.5 w-3.5 mt-0.5 shrink-0"
                      style={{ color: plan.color }}
                    />
                    <span className="text-xs text-[#374151]">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                size="sm"
                className={cn(
                  "w-full h-8 text-xs font-semibold transition-all",
                  isCurrent
                    ? "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6] cursor-default"
                    : ""
                )}
                style={
                  !isCurrent
                    ? { backgroundColor: plan.color, color: "#fff" }
                    : undefined
                }
                disabled={isCurrent || isLoading}
                onClick={() => handleSelect(plan.id)}
              >
                {isLoading ? "Se procesează..." : isCurrent ? "Plan curent" : plan.cta}
              </Button>
            </div>
          );
        })}
      </div>

      {/* FAQ / contact */}
      <div className="bg-[#F7F8FA] border border-[#F3F4F6] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#111318] mb-3">Întrebări frecvente</h3>
        <div className="grid gap-4 sm:grid-cols-2 text-xs text-[#6B7280]">
          <div>
            <p className="font-medium text-[#374151] mb-1">Cum se numără SMS-urile?</p>
            <p>Fiecare SMS trimis (reminder, confirmare, manual) consumă 1 unitate din quota lunară. Quota se resetează în prima zi a fiecărei luni.</p>
          </div>
          <div>
            <p className="font-medium text-[#374151] mb-1">Pot schimba planul oricând?</p>
            <p>Da, poți face upgrade sau downgrade în orice moment. Schimbările intră în vigoare imediat sau la începutul lunii viitoare.</p>
          </div>
          <div>
            <p className="font-medium text-[#374151] mb-1">Ce se întâmplă dacă depășesc quota?</p>
            <p>SMS-urile nu mai sunt trimise automat. Poți cumpăra SMS-uri suplimentare sau face upgrade la un plan superior.</p>
          </div>
          <div>
            <p className="font-medium text-[#374151] mb-1">Cum plătesc?</p>
            <p>Acceptăm card bancar, transfer bancar și factură fiscală. Contactează-ne la <a href="mailto:contact@itpbase.ro" className="text-[#1877F2] hover:underline">contact@itpbase.ro</a> pentru detalii.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
