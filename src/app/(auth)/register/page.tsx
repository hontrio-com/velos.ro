import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { GoogleButton } from "@/components/auth/google-button";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthCard } from "@/components/auth/auth-card";
import { isValidPlan, isValidCycle, PLAN_CONFIG, type PlanId, type BillingCycle } from "@/lib/stripe";

export const metadata: Metadata = { title: "Cont nou" };

const PLAN_LABELS: Record<string, { badge: string; price: string; color: string }> = {
  basic:      { badge: "Basic",      price: "149 lei/lună",  color: "#059669" },
  pro:        { badge: "Pro",        price: "249 lei/lună",  color: "#1877F2" },
  enterprise: { badge: "Enterprise", price: "499 lei/lună",  color: "#7C3AED" },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; cycle?: string }>;
}) {
  const { plan, cycle } = await searchParams;
  const validPlan = plan && isValidPlan(plan) ? plan : null;
  const validCycle = cycle && isValidCycle(cycle) ? cycle : "monthly";

  const planInfo = validPlan
    ? {
        id: validPlan,
        name: PLAN_CONFIG[validPlan as PlanId].name,
        price: `${PLAN_CONFIG[validPlan as PlanId].priceRON[validCycle as BillingCycle]} lei/${validCycle === "yearly" ? "lună (anual)" : "lună"}`,
        color: PLAN_CONFIG[validPlan as PlanId].color,
      }
    : null;

  return (
    <AuthCard>
      {/* Plan badge */}
      {planInfo ? (
        <div
          className="mb-5 rounded-xl px-4 py-3 flex items-center justify-between gap-3 border"
          style={{ background: `${planInfo.color}10`, borderColor: `${planInfo.color}30` }}
        >
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-0.5">
              Ai ales planul
            </p>
            <p className="text-sm font-bold" style={{ color: planInfo.color }}>
              {planInfo.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-[#111318]">{planInfo.price}</p>
            <p className="text-xs text-[#9CA3AF]">facturat după înregistrare</p>
          </div>
        </div>
      ) : (
        <div className="mb-5 rounded-xl px-4 py-3 flex items-center gap-3 border border-[#E5E7EB] bg-[#F9FAFB]">
          <div className="h-8 w-8 rounded-lg bg-[#1877F2]/10 flex items-center justify-center shrink-0">
            <span className="text-[#1877F2] text-xs font-bold">15</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#111318]">Trial gratuit 15 zile</p>
            <p className="text-xs text-[#6B7280]">Fără card bancar. Anulezi oricând.</p>
          </div>
        </div>
      )}

      {/* Google */}
      <GoogleButton />

      <div className="my-5">
        <AuthDivider />
      </div>

      {/* Form */}
      <RegisterForm plan={validPlan} cycle={validCycle} />

      <p className="mt-6 text-center text-sm text-[#6B7280]">
        Ai deja cont?{" "}
        <Link href="/login" className="text-[#1877F2] font-medium hover:underline transition-colors">
          Autentifică-te
        </Link>
      </p>
    </AuthCard>
  );
}
