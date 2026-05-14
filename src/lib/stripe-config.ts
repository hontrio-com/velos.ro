// Client-safe Stripe config — no SDK imports, no secret keys
// Import this in client components instead of @/lib/stripe

export type PlanId = "basic" | "pro" | "enterprise";
export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "trial" | "active" | "past_due" | "canceled" | "trial_expired";

export const PLAN_CONFIG = {
  basic: {
    name: "Basic",
    priceRON: { monthly: 149, yearly: 119 },
    smsLimit: 250,
    statiiLimit: 1,
    color: "#059669",
  },
  pro: {
    name: "Pro",
    priceRON: { monthly: 249, yearly: 199 },
    smsLimit: 500,
    statiiLimit: 3,
    color: "#1877F2",
  },
  enterprise: {
    name: "Enterprise",
    priceRON: { monthly: 499, yearly: 399 },
    smsLimit: 1000,
    statiiLimit: -1,
    color: "#7C3AED",
  },
} as const;

export function isValidPlan(plan: string): plan is PlanId {
  return plan in PLAN_CONFIG;
}

export function isValidCycle(cycle: string): cycle is BillingCycle {
  return cycle === "monthly" || cycle === "yearly";
}

export function getSmsLimitForPlan(plan: string): number {
  if (plan === "trial") return 20;
  return PLAN_CONFIG[plan as PlanId]?.smsLimit ?? 0;
}

export function getStatiiLimitForPlan(plan: string): number {
  if (plan === "trial") return 1;
  const limit = PLAN_CONFIG[plan as PlanId]?.statiiLimit;
  return limit === -1 ? Infinity : (limit ?? 1);
}
