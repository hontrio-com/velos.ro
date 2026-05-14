import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export type PlanId = "basic" | "pro" | "enterprise";
export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "trial" | "active" | "past_due" | "canceled" | "trial_expired";

export const PLAN_CONFIG = {
  basic: {
    name: "Basic",
    priceRON: { monthly: 149, yearly: 119 },
    priceId: {
      monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY!,
      yearly: process.env.STRIPE_PRICE_BASIC_YEARLY!,
    },
    smsLimit: 250,
    statiiLimit: 1,
    color: "#059669",
  },
  pro: {
    name: "Pro",
    priceRON: { monthly: 249, yearly: 199 },
    priceId: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY!,
    },
    smsLimit: 500,
    statiiLimit: 3,
    color: "#1877F2",
  },
  enterprise: {
    name: "Enterprise",
    priceRON: { monthly: 499, yearly: 399 },
    priceId: {
      monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY!,
      yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY!,
    },
    smsLimit: 1000,
    statiiLimit: -1, // unlimited
    color: "#7C3AED",
  },
} as const;

export function getPlanFromPriceId(priceId: string): { plan: PlanId; cycle: BillingCycle } | null {
  for (const [planId, config] of Object.entries(PLAN_CONFIG)) {
    if (config.priceId.monthly === priceId) return { plan: planId as PlanId, cycle: "monthly" };
    if (config.priceId.yearly === priceId) return { plan: planId as PlanId, cycle: "yearly" };
  }
  return null;
}

export function isValidPlan(plan: string): plan is PlanId {
  return plan in PLAN_CONFIG;
}

export function isValidCycle(cycle: string): cycle is BillingCycle {
  return cycle === "monthly" || cycle === "yearly";
}

/** SMS limit per month based on plan */
export function getSmsLimitForPlan(plan: string): number {
  if (plan === "trial") return 20;
  return PLAN_CONFIG[plan as PlanId]?.smsLimit ?? 0;
}

/** Max statii based on plan */
export function getStatiiLimitForPlan(plan: string): number {
  if (plan === "trial") return 1;
  const limit = PLAN_CONFIG[plan as PlanId]?.statiiLimit;
  return limit === -1 ? Infinity : (limit ?? 1);
}
