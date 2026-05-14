"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
} from "@/lib/validations/auth";
import { sendBunVenitEmail } from "@/lib/actions/email";
import { stripe, PLAN_CONFIG, isValidPlan, isValidCycle, type PlanId, type BillingCycle } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const supabase = await createClient();

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Email sau parolă incorectă" };
  }

  redirect("/dashboard");
}

export async function registerAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const supabase = await createClient();

  const parsed = registerSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
    terms: formData.get("terms") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error, data } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Există deja un cont cu acest email" };
    }
    return { error: error.message };
  }

  // Send welcome email (fire and forget)
  sendBunVenitEmail(parsed.data.email, parsed.data.full_name).catch(console.error);

  // If plan specified → create Stripe subscription checkout
  const planRaw = formData.get("plan") as string | null;
  const cycleRaw = (formData.get("cycle") as string | null) ?? "monthly";

  if (planRaw && isValidPlan(planRaw) && data.user) {
    const plan = planRaw as PlanId;
    const cycle = isValidCycle(cycleRaw) ? (cycleRaw as BillingCycle) : "monthly";
    const planConfig = PLAN_CONFIG[plan];
    const priceId = planConfig.priceId[cycle];

    if (priceId) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: parsed.data.email,
        name: parsed.data.full_name,
        metadata: { profile_id: data.user.id },
      });

      // Save stripe_customer_id immediately
      const serviceSupabase = createServiceClient();
      await serviceSupabase
        .from("profiles")
        .update({ stripe_customer_id: customer.id } as never)
        .eq("id", data.user.id);

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://velos.ro";

      // Create subscription checkout session
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customer.id,
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: {
          metadata: { profile_id: data.user.id, plan, cycle },
        },
        metadata: { profile_id: data.user.id, plan, cycle, type: "subscription" },
        success_url: `${appUrl}/setari/abonament?success=1&plan=${plan}`,
        cancel_url: `${appUrl}/setari/abonament?canceled=1`,
        allow_promotion_codes: true,
        billing_address_collection: "auto",
        tax_id_collection: { enabled: true },
        locale: "ro",
      });

      if (session.url) redirect(session.url);
    }
  }

  redirect("/dashboard");
}

export async function signInWithGoogleAction() {
  const supabase = await createClient();
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${proto}://${host}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${baseUrl}/auth/callback`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error) return { error: error.message };
  if (data.url) redirect(data.url);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(
  _prev: { error: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error: string; success?: boolean }> {
  const supabase = await createClient();

  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password` }
  );

  if (error) return { error: error.message };

  return { error: "", success: true };
}
