import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripeInstance(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop: string | symbol) {
    return (getStripeInstance() as any)[prop as string];
  },
});

// Re-export client-safe types and config
export type { PlanId, BillingCycle, SubscriptionStatus } from "@/lib/stripe-config";
export { isValidPlan, isValidCycle, getSmsLimitForPlan, getStatiiLimitForPlan } from "@/lib/stripe-config";

// Server-side PLAN_CONFIG includes priceIds (env vars, not exposed to client)
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
    statiiLimit: -1,
    color: "#7C3AED",
  },
} as const;

export function getPlanFromPriceId(priceId: string): { plan: import("@/lib/stripe-config").PlanId; cycle: import("@/lib/stripe-config").BillingCycle } | null {
  for (const [planId, config] of Object.entries(PLAN_CONFIG)) {
    if (config.priceId.monthly === priceId) return { plan: planId as import("@/lib/stripe-config").PlanId, cycle: "monthly" };
    if (config.priceId.yearly === priceId) return { plan: planId as import("@/lib/stripe-config").PlanId, cycle: "yearly" };
  }
  return null;
}
