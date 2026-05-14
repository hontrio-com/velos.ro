"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Zap, Star, Crown, Building2, ExternalLink, AlertTriangle, CheckCircle2, XCircle, Clock, CreditCard, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import type { SubscriptionStatus } from "@/lib/stripe";

// ─── Plan definitions ────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "trial",
    name: "Trial",
    price: { monthly: 0, yearly: 0 },
    description: "Testezi fără risc",
    icon: Zap,
    color: "#6B7280",
    bg: "#F9FAFB",
    features: ["1 stație ITP", "20 SMS incluse (total)", "CRM complet", "Programări online", "Rapoarte de bază"],
    cta: "Plan curent",
    hidden: true, // Nu se poate alege manual
  },
  {
    id: "basic",
    name: "Basic",
    price: { monthly: 149, yearly: 119 },
    description: "1 stație ITP",
    icon: Star,
    color: "#059669",
    bg: "#ECFDF5",
    features: ["1 stație ITP", "250 SMS/lună", "Programări online", "CRM complet", "Rapoarte de bază", "Suport email"],
    cta: "Alege Basic",
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: 249, yearly: 199 },
    description: "Până la 3 stații",
    icon: Crown,
    color: "#1877F2",
    bg: "#EFF6FF",
    features: ["3 stații ITP", "500 SMS/lună", "Programări online", "CRM complet", "Rapoarte avansate", "Export PDF & CSV", "Suport prioritar"],
    cta: "Alege Pro",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: { monthly: 499, yearly: 399 },
    description: "Stații nelimitate",
    icon: Building2,
    color: "#7C3AED",
    bg: "#F5F3FF",
    features: ["Stații nelimitate", "1000 SMS/lună", "Programări online", "CRM complet", "Rapoarte avansate", "Export PDF & CSV", "Suport dedicat", "Onboarding personalizat"],
    cta: "Alege Enterprise",
  },
] as const;

const STATUS_CONFIG: Record<SubscriptionStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  trial:         { label: "Trial activ",         color: "#1877F2", bg: "#EFF6FF", icon: Clock },
  active:        { label: "Activ",                color: "#059669", bg: "#ECFDF5", icon: CheckCircle2 },
  past_due:      { label: "Plată eșuată",         color: "#DC2626", bg: "#FEF2F2", icon: XCircle },
  canceled:      { label: "Anulat",               color: "#EA580C", bg: "#FFF7ED", icon: AlertTriangle },
  trial_expired: { label: "Trial expirat",        color: "#DC2626", bg: "#FEF2F2", icon: XCircle },
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface AbonamentClientProps {
  currentPlan: string;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  billingCycle: string;
  subscriptionEndsAt: string | null;
  hasStripeCustomer: boolean;
  email: string;
  smsCredit: number;
  successPlan: string | null;
  wasCanceled: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AbonamentClient({
  currentPlan,
  subscriptionStatus,
  trialEndsAt,
  billingCycle,
  subscriptionEndsAt,
  hasStripeCustomer,
  email,
  smsCredit,
  successPlan,
  wasCanceled,
}: AbonamentClientProps) {
  const router = useRouter();
  const [yearly, setYearly] = useState(billingCycle === "yearly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const statusInfo = STATUS_CONFIG[subscriptionStatus];
  const StatusIcon = statusInfo.icon;
  const visiblePlans = PLANS.filter((p) => !p.hidden);

  async function handleSelectPlan(planId: string) {
    if (planId === currentPlan && subscriptionStatus === "active") return;

    if (planId === "enterprise") {
      window.location.href = `mailto:contact@velos.ro?subject=Plan%20Enterprise%20-%20${encodeURIComponent(email)}`;
      return;
    }

    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/stripe/subscription-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, cycle: yearly ? "yearly" : "monthly" }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPlan(null);
    }
  }

  function handleBillingPortal() {
    router.push("/api/stripe/billing-portal?returnUrl=" + encodeURIComponent(window.location.href));
  }

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Success / canceled toasts */}
      {successPlan && (
        <div className="rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-[#059669] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#065F46]">Abonament activat cu succes!</p>
            <p className="text-xs text-[#047857]">Planul tău a fost actualizat. Poți folosi toate funcțiile platformei.</p>
          </div>
        </div>
      )}

      {wasCanceled && (
        <div className="rounded-xl bg-[#FFF7ED] border border-[#FED7AA] px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-[#EA580C] shrink-0" />
          <p className="text-sm text-[#92400E]">Plata a fost anulată. Poți alege un plan oricând.</p>
        </div>
      )}

      {/* Current status card */}
      <div
        className="rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4"
        style={{ background: statusInfo.bg, borderColor: `${statusInfo.color}30` }}
      >
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0"
          style={{ background: `${statusInfo.color}20` }}
        >
          <StatusIcon className="h-5 w-5" style={{ color: statusInfo.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-[#111318]">
              Plan {PLANS.find((p) => p.id === currentPlan)?.name ?? currentPlan}
            </p>
            <Badge
              className="text-xs font-semibold h-5 px-2"
              style={{ backgroundColor: `${statusInfo.color}20`, color: statusInfo.color, border: "none" }}
            >
              {statusInfo.label}
            </Badge>
          </div>

          {subscriptionStatus === "trial" && trialEndsAt && (
            <p className="text-xs text-[#6B7280] mt-0.5">
              Trial activ până pe{" "}
              <strong className="text-[#374151]">
                {format(parseISO(trialEndsAt), "d MMMM yyyy", { locale: ro })}
              </strong>
            </p>
          )}
          {subscriptionStatus === "active" && subscriptionEndsAt && (
            <p className="text-xs text-[#6B7280] mt-0.5">
              Reînnoire automată pe{" "}
              <strong className="text-[#374151]">
                {format(parseISO(subscriptionEndsAt), "d MMMM yyyy", { locale: ro })}
              </strong>
              {" "}· Facturare {yearly ? "anuală" : "lunară"}
            </p>
          )}
          {subscriptionStatus === "past_due" && (
            <p className="text-xs text-[#DC2626] mt-0.5">
              Ultima plată a eșuat. Actualizează metoda de plată pentru a evita suspendarea.
            </p>
          )}
          {subscriptionStatus === "canceled" && subscriptionEndsAt && (
            <p className="text-xs text-[#6B7280] mt-0.5">
              Accesul expiră pe{" "}
              <strong className="text-[#374151]">
                {format(parseISO(subscriptionEndsAt), "d MMMM yyyy", { locale: ro })}
              </strong>
            </p>
          )}
          {subscriptionStatus === "trial_expired" && (
            <p className="text-xs text-[#DC2626] mt-0.5">
              Perioada de trial a expirat. Alege un plan pentru a continua.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {subscriptionStatus === "past_due" && (
            <Button size="sm" variant="destructive" onClick={handleBillingPortal} className="gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              Actualizează plata
            </Button>
          )}
          {subscriptionStatus === "active" && hasStripeCustomer && (
            <Button size="sm" variant="outline" onClick={handleBillingPortal} className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              Gestionează facturarea
            </Button>
          )}
          {subscriptionStatus === "canceled" && (
            <Button size="sm" className="gap-1.5" onClick={() => handleSelectPlan(currentPlan !== "trial" ? currentPlan : "basic")}>
              <RefreshCw className="h-3.5 w-3.5" />
              Reactivează
            </Button>
          )}
        </div>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center gap-3">
        <span className={cn("text-sm font-medium", !yearly ? "text-[#111318]" : "text-[#9CA3AF]")}>Lunar</span>
        <Switch checked={yearly} onCheckedChange={setYearly} />
        <span className={cn("text-sm font-medium", yearly ? "text-[#111318]" : "text-[#9CA3AF]")}>Anual</span>
        {yearly && (
          <Badge variant="secondary" className="text-[#059669] bg-[#059669]/10 border-0 text-xs">
            2 luni gratuit
          </Badge>
        )}
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {visiblePlans.map((plan) => {
          const Icon = plan.icon;
          const price = yearly ? plan.price.yearly : plan.price.monthly;
          const isCurrent = plan.id === currentPlan && subscriptionStatus === "active";
          const isLoading = loadingPlan === plan.id;
          const isDisabled = isCurrent || isLoading;

          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-xl border bg-white p-5 flex flex-col transition-shadow",
                isCurrent ? "ring-2 shadow-sm" : "hover:shadow-md",
                plan.popular && !isCurrent && "border-[#1877F2]/40"
              )}
              style={isCurrent ? { borderColor: plan.color } : undefined}
            >
              {plan.popular && (
                <div
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold text-white whitespace-nowrap"
                  style={{ backgroundColor: plan.color }}
                >
                  Recomandat
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
                  <span className="text-2xl font-bold text-[#111318]">
                    {plan.id === "enterprise" && price === 499 ? "499+" : price}
                  </span>
                  <span className="text-xs text-[#9CA3AF]">lei/lună</span>
                </div>
                {yearly && plan.price.monthly > 0 && (
                  <p className="text-[11px] text-[#9CA3AF] line-through">{plan.price.monthly} lei/lună</p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: plan.color }} />
                    <span className="text-xs text-[#374151]">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                size="sm"
                className={cn("w-full h-8 text-xs font-semibold")}
                style={!isDisabled ? { backgroundColor: plan.color, color: "#fff" } : undefined}
                variant={isDisabled ? "outline" : "default"}
                disabled={isDisabled}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {isLoading ? "Se procesează..." : isCurrent ? "Plan curent" : plan.cta}
              </Button>
            </div>
          );
        })}
      </div>

      {/* SMS Credit */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#111318]">Credit SMS suplimentar</p>
          <p className="text-xs text-[#6B7280] mt-0.5">
            {smsCredit > 0
              ? `Ai ${smsCredit} SMS-uri cumpărate suplimentar care nu expiră.`
              : "Nu ai SMS-uri suplimentare. Le poți cumpăra în orice moment."}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push("/setari/abonament/sms")}
          className="shrink-0"
        >
          Cumpără SMS-uri
        </Button>
      </div>

      {/* FAQ */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#111318] mb-4">Întrebări frecvente</h3>
        <div className="grid gap-4 sm:grid-cols-2 text-xs text-[#6B7280]">
          {[
            ["Pot anula oricând?", "Da. Poți anula din portalul de facturare Stripe. Accesul rămâne activ până la sfârșitul perioadei plătite."],
            ["Cum se resetează SMS-urile?", "Quota de SMS-uri din plan se resetează în prima zi a fiecărei luni. Credit-ul suplimentar cumpărat nu expiră niciodată."],
            ["Pot schimba planul?", "Da, oricând. La upgrade plătești diferența proporțional. La downgrade, noul plan intră în vigoare de la reînnoire."],
            ["Ce se întâmplă la expirare trial?", "Datele nu se șterg. Poți alege un plan oricând pentru a recăpăta accesul complet."],
          ].map(([q, a]) => (
            <div key={q}>
              <p className="font-medium text-[#374151] mb-1">{q}</p>
              <p>{a}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
