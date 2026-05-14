"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, ChevronLeft, Loader2, Zap, Shield, Star, Gift, CalendarDays, MessageSquare, BarChart3, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PLAN_CONFIG, type PlanId, type BillingCycle } from "@/lib/stripe-config";
import { completeTrialOnboardingAction, startPaidOnboardingAction } from "@/lib/actions/onboarding";
import type { StatieOnboardingData } from "@/lib/actions/onboarding";

const STEPS = ["Bun venit", "Stația ta", "Alege planul"] as const;

const PLAN_FEATURES: Record<PlanId, string[]> = {
  basic: ["1 stație ITP", "250 SMS / lună", "Programări + Calendar", "Clienți & Vehicule", "Rapoarte de bază"],
  pro: ["3 stații ITP", "500 SMS / lună", "Toate funcțiile Basic", "Remindere automate", "Rapoarte avansate"],
  enterprise: ["Stații nelimitate", "1000 SMS / lună", "Toate funcțiile Pro", "Suport prioritar", "API access"],
};

const PLAN_ICONS: Record<PlanId, React.ReactNode> = {
  basic: <Shield className="h-4 w-4" />,
  pro: <Zap className="h-4 w-4" />,
  enterprise: <Star className="h-4 w-4" />,
};

export function OnboardingWizard({ userEmail, hasStation }: { userEmail: string; hasStation: boolean }) {
  const [step, setStep] = useState(hasStation ? 2 : 0);
  const [statie, setStatie] = useState<StatieOnboardingData>({ nume: "", oras: "", telefon: "" });
  const [statieError, setStatieError] = useState<Partial<StatieOnboardingData>>({});
  const [selectedPlan, setSelectedPlan] = useState<PlanId | "trial" | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const planIds = Object.keys(PLAN_CONFIG) as PlanId[];

  function validateStatie(): boolean {
    const errs: Partial<StatieOnboardingData> = {};
    if (!statie.nume.trim()) errs.nume = "Numele stației este obligatoriu";
    if (!statie.oras.trim()) errs.oras = "Orașul este obligatoriu";
    setStatieError(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (step === 1 && !validateStatie()) return;
    setStep((s) => s + 1);
  }

  function handleFinish() {
    if (!selectedPlan) {
      setError("Selectează un plan pentru a continua");
      return;
    }
    setError(null);

    startTransition(async () => {
      if (selectedPlan === "trial") {
        const result = await completeTrialOnboardingAction(statie);
        if (result?.error) setError(result.error);
      } else {
        const result = await startPaidOnboardingAction(statie, selectedPlan, cycle);
        if (result?.error) {
          setError(result.error);
        } else if (result?.checkoutUrl) {
          window.location.href = result.checkoutUrl;
        }
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#F3F4F6]">
        <Image
          src="/logo441x245.png"
          alt="Velos"
          width={132}
          height={74}
          className="h-8 w-auto object-contain"
          priority
        />
        <span className="text-xs text-[#9CA3AF]">{userEmail}</span>
      </div>

      {/* Progress */}
      <div className="px-6 pt-8 pb-0 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                    i < step
                      ? "bg-[#1877F2] text-white"
                      : i === step
                      ? "bg-[#1877F2] text-white ring-4 ring-[#BFDBFE]"
                      : "bg-white border border-[#E5E7EB] text-[#9CA3AF]"
                  )}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium hidden sm:block",
                    i <= step ? "text-[#111318]" : "text-[#9CA3AF]"
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-2" style={{ background: i < step ? "#1877F2" : "#E5E7EB" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 pb-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.22 }}
                className="bg-white rounded-2xl border border-[#F3F4F6] p-8 shadow-sm"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-[#1877F2]" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-[#111318]">Bun venit pe Velos.ro!</h1>
                    <p className="mt-2 text-[#6B7280] text-sm leading-relaxed max-w-md">
                      Platforma completă pentru gestionarea stațiilor ITP. În câțiva pași simpli,
                      îți configurăm contul și ești gata să începi.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 w-full mt-2">
                    {[
                      { icon: <CalendarDays className="h-5 w-5 text-[#1877F2]" />, label: "Programări", desc: "Calendar inteligent" },
                      { icon: <MessageSquare className="h-5 w-5 text-[#1877F2]" />, label: "SMS-uri", desc: "Remindere automate" },
                      { icon: <BarChart3 className="h-5 w-5 text-[#1877F2]" />, label: "Rapoarte", desc: "Statistici în timp real" },
                    ].map((f) => (
                      <div key={f.label} className="bg-[#F7F8FA] rounded-xl p-3 text-center flex flex-col items-center gap-1">
                        <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center mb-0.5">{f.icon}</div>
                        <div className="text-xs font-semibold text-[#111318]">{f.label}</div>
                        <div className="text-xs text-[#9CA3AF]">{f.desc}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleNext}
                    className="mt-2 flex items-center gap-2 bg-[#1877F2] hover:bg-[#1565D8] text-white font-semibold px-8 py-3 rounded-xl transition-colors"
                  >
                    Hai să începem <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.22 }}
                className="bg-white rounded-2xl border border-[#F3F4F6] p-8 shadow-sm"
              >
                <h2 className="text-xl font-bold text-[#111318] mb-1">Configurează stația ta</h2>
                <p className="text-sm text-[#6B7280] mb-6">
                  Aceste informații vor apărea în pagina publică de programări.
                </p>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1.5">
                      Numele stației <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={statie.nume}
                      onChange={(e) => { setStatie((s) => ({ ...s, nume: e.target.value })); setStatieError((err) => ({ ...err, nume: undefined })); }}
                      placeholder="ex: Stația ITP Nord"
                      className={cn(
                        "w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors bg-white",
                        statieError.nume
                          ? "border-red-400 focus:border-red-500"
                          : "border-[#E5E7EB] focus:border-[#1877F2]"
                      )}
                    />
                    {statieError.nume && <p className="mt-1 text-xs text-red-500">{statieError.nume}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1.5">
                      Orașul <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={statie.oras}
                      onChange={(e) => { setStatie((s) => ({ ...s, oras: e.target.value })); setStatieError((err) => ({ ...err, oras: undefined })); }}
                      placeholder="ex: București"
                      className={cn(
                        "w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors bg-white",
                        statieError.oras
                          ? "border-red-400 focus:border-red-500"
                          : "border-[#E5E7EB] focus:border-[#1877F2]"
                      )}
                    />
                    {statieError.oras && <p className="mt-1 text-xs text-red-500">{statieError.oras}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1.5">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={statie.telefon}
                      onChange={(e) => setStatie((s) => ({ ...s, telefon: e.target.value }))}
                      placeholder="ex: 0721 000 000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] focus:border-[#1877F2] text-sm outline-none transition-colors bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-8">
                  <button
                    onClick={() => setStep(0)}
                    className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111318] transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" /> Înapoi
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#1565D8] text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
                  >
                    Continuă <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.22 }}
              >
                <div className="bg-white rounded-2xl border border-[#F3F4F6] p-6 shadow-sm mb-4">
                  <h2 className="text-xl font-bold text-[#111318] mb-1">Alege planul tău</h2>
                  <p className="text-sm text-[#6B7280] mb-5">
                    Poți schimba planul oricând. Fără taxe ascunse.
                  </p>

                  {/* Billing cycle toggle */}
                  <div className="flex items-center gap-3 mb-6">
                    <Label
                      htmlFor="cycle-switch"
                      className={cn("text-sm font-medium cursor-pointer", cycle === "monthly" ? "text-[#111318]" : "text-[#9CA3AF]")}
                    >
                      Lunar
                    </Label>
                    <Switch
                      id="cycle-switch"
                      checked={cycle === "yearly"}
                      onCheckedChange={(v) => setCycle(v ? "yearly" : "monthly")}
                    />
                    <Label
                      htmlFor="cycle-switch"
                      className={cn("text-sm font-medium cursor-pointer", cycle === "yearly" ? "text-[#111318]" : "text-[#9CA3AF]")}
                    >
                      Anual
                    </Label>
                    {cycle === "yearly" && (
                      <span className="text-xs font-semibold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full">
                        Economisesti ~20%
                      </span>
                    )}
                  </div>

                  {/* Plan cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                    {planIds.map((planId) => {
                      const config = PLAN_CONFIG[planId];
                      const price = config.priceRON[cycle];
                      const isSelected = selectedPlan === planId;
                      const isPro = planId === "pro";
                      return (
                        <button
                          key={planId}
                          onClick={() => { setSelectedPlan(planId); setError(null); }}
                          className={cn(
                            "relative text-left rounded-xl border-2 p-4 transition-all",
                            isSelected
                              ? "border-[#1877F2] bg-[#EFF6FF]"
                              : "border-[#E5E7EB] bg-white hover:border-[#BFDBFE]"
                          )}
                        >
                          {isPro && (
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#1877F2] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                              RECOMANDAT
                            </div>
                          )}
                          <div className={cn("flex items-center gap-2 mb-3", isPro ? "mt-1" : "")}>
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ background: `${config.color}15`, color: config.color }}
                            >
                              {PLAN_ICONS[planId]}
                            </div>
                            <span className="font-bold text-[#111318] text-sm">{config.name}</span>
                          </div>
                          <div className="mb-3">
                            <span className="text-2xl font-bold text-[#111318]">{price}</span>
                            <span className="text-xs text-[#9CA3AF] ml-1">RON/lună</span>
                          </div>
                          <ul className="space-y-1.5">
                            {PLAN_FEATURES[planId].map((f) => (
                              <li key={f} className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                                <Check className="h-3 w-3 text-[#059669] shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                          {isSelected && (
                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Trial option */}
                  <button
                    onClick={() => { setSelectedPlan("trial"); setError(null); }}
                    className={cn(
                      "w-full rounded-xl border-2 px-4 py-3 flex items-center justify-between transition-all text-sm",
                      selectedPlan === "trial"
                        ? "border-[#1877F2] bg-[#EFF6FF]"
                        : "border-dashed border-[#E5E7EB] hover:border-[#BFDBFE]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center">
                        <Gift className="h-4 w-4 text-[#6B7280]" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-[#111318]">Testeaza gratuit - 15 zile</div>
                        <div className="text-xs text-[#9CA3AF]">Toate functiile Pro, fara card</div>
                      </div>
                    </div>
                    {selectedPlan === "trial" && (
                      <div className="w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>

                  {error && (
                    <p className="mt-3 text-sm text-red-500 text-center">{error}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setStep(1)}
                    disabled={isPending}
                    className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111318] transition-colors disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" /> Înapoi
                  </button>
                  <button
                    onClick={handleFinish}
                    disabled={isPending || !selectedPlan}
                    className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#1565D8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
                  >
                    {isPending ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Se procesează...</>
                    ) : selectedPlan && selectedPlan !== "trial" ? (
                      <>Continuă la plată <ChevronRight className="h-4 w-4" /></>
                    ) : (
                      <>Finalizează <ChevronRight className="h-4 w-4" /></>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
