"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, AlertTriangle, CheckCircle2, XCircle, Clock, CreditCard, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import type { SubscriptionStatus } from "@/lib/stripe";
import { CumparaSmsModal } from "@/components/sms/cumpara-sms-modal";

// ─── Plan definitions ────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: { monthly: 149, yearly: 119 },
    description: "Pentru statiile cu un singur punct de lucru.",
    features: [
      "250 SMS-uri / luna",
      "1 statie ITP",
      "Programari online",
      "CRM complet",
      "Rapoarte de baza",
      "Suport prin email",
    ],
    cta: "Alege Basic",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: 249, yearly: 199 },
    description: "Cel mai ales de statiile in crestere.",
    features: [
      "500 SMS-uri / luna",
      "3 statii ITP",
      "Programari online",
      "CRM complet",
      "Rapoarte avansate",
      "Export PDF si CSV",
      "Suport prioritar",
    ],
    cta: "Alege Pro",
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: { monthly: 499, yearly: 399 },
    description: "Pentru retele mari cu nevoi specifice.",
    features: [
      "1000 SMS-uri / luna",
      "Statii nelimitate",
      "Programari online",
      "CRM complet",
      "Rapoarte avansate",
      "Export PDF si CSV",
      "Suport dedicat",
      "Onboarding personalizat",
    ],
    cta: "Alege Enterprise",
    highlight: false,
  },
] as const;

type PlanId = (typeof PLANS)[number]["id"];

const STATUS_CONFIG: Record<SubscriptionStatus, { label: string; color: string; bg: string; borderColor: string; icon: React.ElementType }> = {
  trial:         { label: "Trial activ",    color: "#1877F2", bg: "#EFF6FF", borderColor: "#BFDBFE", icon: Clock },
  active:        { label: "Activ",          color: "#059669", bg: "#ECFDF5", borderColor: "#A7F3D0", icon: CheckCircle2 },
  past_due:      { label: "Plata esalata",  color: "#DC2626", bg: "#FEF2F2", borderColor: "#FECACA", icon: XCircle },
  canceled:      { label: "Anulat",         color: "#EA580C", bg: "#FFF7ED", borderColor: "#FED7AA", icon: AlertTriangle },
  trial_expired: { label: "Trial expirat",  color: "#DC2626", bg: "#FEF2F2", borderColor: "#FECACA", icon: XCircle },
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
  smsSuccessCantitate: number | null;
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
  smsSuccessCantitate,
}: AbonamentClientProps) {
  const router = useRouter();
  const [yearly, setYearly] = useState(billingCycle === "yearly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [smsModalOpen, setSmsModalOpen] = useState(false);

  const statusInfo = STATUS_CONFIG[subscriptionStatus];
  const StatusIcon = statusInfo.icon;

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

  const currentPlanName = PLANS.find((p) => p.id === currentPlan)?.name ?? currentPlan;

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Notifications */}
      {successPlan && (
        <div className="rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-[#059669] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#065F46]">Abonament activat cu succes!</p>
            <p className="text-xs text-[#047857]">Planul tau a fost actualizat. Poti folosi toate functiile platformei.</p>
          </div>
        </div>
      )}
      {smsSuccessCantitate != null && smsSuccessCantitate > 0 && (
        <div className="rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-[#059669] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#065F46]">{smsSuccessCantitate} SMS-uri adaugate cu succes!</p>
            <p className="text-xs text-[#047857]">Creditul tau SMS a fost actualizat. SMS-urile nu expira niciodata.</p>
          </div>
        </div>
      )}
      {wasCanceled && (
        <div className="rounded-xl bg-[#FFF7ED] border border-[#FED7AA] px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-[#EA580C] shrink-0" />
          <p className="text-sm text-[#92400E]">Plata a fost anulata. Poti alege un plan oricand.</p>
        </div>
      )}

      {/* Current plan card */}
      <div
        className="rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4"
        style={{ background: statusInfo.bg, borderColor: statusInfo.borderColor }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
          style={{ background: `${statusInfo.color}20` }}
        >
          <StatusIcon className="h-5 w-5" style={{ color: statusInfo.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-[#111318]">Plan {currentPlanName}</p>
            <Badge
              className="text-xs font-semibold h-5 px-2 border-0"
              style={{ backgroundColor: `${statusInfo.color}20`, color: statusInfo.color }}
            >
              {statusInfo.label}
            </Badge>
          </div>
          {subscriptionStatus === "trial" && trialEndsAt && (
            <p className="text-xs text-[#6B7280] mt-0.5">
              Trial activ pana pe{" "}
              <strong className="text-[#374151]">
                {format(parseISO(trialEndsAt), "d MMMM yyyy", { locale: ro })}
              </strong>
            </p>
          )}
          {subscriptionStatus === "active" && subscriptionEndsAt && (
            <p className="text-xs text-[#6B7280] mt-0.5">
              Reinnoire automata pe{" "}
              <strong className="text-[#374151]">
                {format(parseISO(subscriptionEndsAt), "d MMMM yyyy", { locale: ro })}
              </strong>
              {" "}· Facturare {yearly ? "anuala" : "lunara"}
            </p>
          )}
          {subscriptionStatus === "past_due" && (
            <p className="text-xs text-[#DC2626] mt-0.5">
              Ultima plata a esuat. Actualizeaza metoda de plata pentru a evita suspendarea.
            </p>
          )}
          {subscriptionStatus === "canceled" && subscriptionEndsAt && (
            <p className="text-xs text-[#6B7280] mt-0.5">
              Accesul expira pe{" "}
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
              Actualizeaza plata
            </Button>
          )}
          {subscriptionStatus === "active" && hasStripeCustomer && (
            <Button size="sm" variant="outline" onClick={handleBillingPortal} className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              Gestioneaza facturarea
            </Button>
          )}
          {subscriptionStatus === "canceled" && (
            <Button size="sm" className="gap-1.5" onClick={() => handleSelectPlan(currentPlan !== "trial" ? currentPlan : "basic")}>
              <RefreshCw className="h-3.5 w-3.5" />
              Reactiveaza
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

      {/* Plans grid — same style as landing page */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
        {PLANS.map((plan) => {
          const price = yearly ? plan.price.yearly : plan.price.monthly;
          const isCurrent = plan.id === currentPlan && subscriptionStatus === "active";
          const isLoading = loadingPlan === plan.id;
          const isDisabled = isCurrent || isLoading;

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col",
                plan.highlight && !isCurrent && "border-2 border-[#1877F2] shadow-lg",
                isCurrent && "ring-2 ring-[#1877F2]"
              )}
            >
              <CardContent className={cn("flex flex-col flex-1 gap-5", plan.highlight ? "pt-4" : "pt-6")}>
                {plan.highlight && (
                  <div className="flex justify-center">
                    <Badge className="px-3 py-1 text-xs font-bold">Recomandat</Badge>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-2.5 right-3">
                    <Badge className="px-3 py-0.5 text-[10px] font-bold bg-[#1877F2]">Activ</Badge>
                  </div>
                )}

                <div>
                  <h3 className="text-base font-bold text-[#111318] mb-1">{plan.name}</h3>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed">{plan.description}</p>
                </div>

                <div>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-[#111318]">{price} lei</span>
                    <span className="text-sm text-[#9CA3AF] mb-1">/luna</span>
                  </div>
                  {yearly && plan.price.monthly > 0 && (
                    <p className="text-xs text-[#9CA3AF] mt-0.5 line-through">{plan.price.monthly} lei/luna</p>
                  )}
                </div>

                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-[#1877F2]" />
                      <span className="text-sm text-[#374151]">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.highlight && !isCurrent ? "default" : "outline"}
                  className="w-full justify-center py-2.5 h-auto text-sm font-semibold"
                  disabled={isDisabled}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {isLoading ? "Se proceseaza..." : isCurrent ? "Plan curent" : plan.cta}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-sm text-[#9CA3AF]">
        Toate preturile sunt in lei, TVA inclus. Poti anula oricand.
      </p>

      {/* SMS Credit */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#111318]">Credit SMS suplimentar</p>
          <p className="text-xs text-[#6B7280] mt-0.5">
            {smsCredit > 0
              ? `Ai ${smsCredit} SMS-uri cumparate suplimentar care nu expira.`
              : "Nu ai SMS-uri suplimentare. Le poti cumpara in orice moment."}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSmsModalOpen(true)}
          className="shrink-0"
        >
          Cumpara SMS-uri
        </Button>
      </div>

      {/* FAQ */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#111318] mb-4">Intrebari frecvente</h3>
        <div className="grid gap-4 sm:grid-cols-2 text-xs text-[#6B7280]">
          {[
            ["Pot anula oricand?", "Da. Poti anula din portalul de facturare Stripe. Accesul ramane activ pana la sfarsitul perioadei platite."],
            ["Cum se reseteaza SMS-urile?", "Quota de SMS-uri din plan se reseteaza in prima zi a fiecarei luni. Credit-ul suplimentar cumparat nu expira niciodata."],
            ["Pot schimba planul?", "Da, oricand. La upgrade platesti diferenta proportional. La downgrade, noul plan intra in vigoare de la reinnoire."],
            ["Ce se intampla la expirare trial?", "Datele nu se sterg. Poti alege un plan oricand pentru a recapata accesul complet."],
          ].map(([q, a]) => (
            <div key={q}>
              <p className="font-medium text-[#374151] mb-1">{q}</p>
              <p>{a}</p>
            </div>
          ))}
        </div>
      </div>

      <CumparaSmsModal open={smsModalOpen} onClose={() => setSmsModalOpen(false)} />
    </div>
  );
}
