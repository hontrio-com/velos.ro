"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { stripe, PLAN_CONFIG, isValidPlan, isValidCycle, type PlanId, type BillingCycle } from "@/lib/stripe";
import { redirect } from "next/navigation";
import { sendStatieNouaEmail } from "@/lib/actions/email";

export interface StatieOnboardingData {
  nume: string;
  oras: string;
  telefon: string;
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

async function createStatie(
  userId: string,
  data: StatieOnboardingData,
  ownerEmail: string,
  ownerName: string
) {
  const supabase = await createClient();
  const slug = generateSlug(data.nume);

  const { data: statie, error } = await supabase
    .from("statii")
    .insert({
      owner_id: userId,
      nume: data.nume,
      slug,
      oras: data.oras,
      telefon: data.telefon || null,
    } as never)
    .select("id, slug")
    .single();

  if (error) throw new Error(error.message);

  const statieId = (statie as any).id as string;
  const statieSlug = (statie as any).slug as string;

  // Create default station settings row (required by reminders, SMS templates, etc.)
  await supabase.from("setari_statie").insert({ statie_id: statieId } as never);

  await sendStatieNouaEmail(ownerEmail, {
    numeProprietar: ownerName,
    numeStatie: data.nume,
    slugStatie: statieSlug,
  }).catch(console.error);

  return { id: statieId, slug: statieSlug };
}

async function markOnboardingComplete(userId: string) {
  const serviceSupabase = createServiceClient();
  await serviceSupabase
    .from("profiles")
    .update({ onboarding_completed: true } as never)
    .eq("id", userId);
}

// ── Trial onboarding ────────────────────────────────────────────
export async function completeTrialOnboardingAction(
  statieData: StatieOnboardingData
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .single();

  const ownerEmail = (profile as any)?.email ?? user.email ?? "";
  const ownerName = (profile as any)?.full_name ?? ownerEmail;

  try {
    await createStatie(user.id, statieData, ownerEmail, ownerName);
    await markOnboardingComplete(user.id);
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută" };
  }

  redirect("/dashboard");
}

// ── Paid onboarding ─────────────────────────────────────────────
export async function startPaidOnboardingAction(
  statieData: StatieOnboardingData,
  planRaw: string,
  cycleRaw: string
): Promise<{ error?: string; checkoutUrl?: string }> {
  if (!isValidPlan(planRaw)) return { error: "Plan invalid" };
  if (!isValidCycle(cycleRaw)) return { error: "Ciclu invalid" };

  const plan = planRaw as PlanId;
  const cycle = cycleRaw as BillingCycle;
  const priceId = PLAN_CONFIG[plan].priceId[cycle];
  if (!priceId) return { error: "Prețul nu este configurat" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email, full_name")
    .eq("id", user.id)
    .single();

  const ownerEmail = (profile as any)?.email ?? user.email ?? "";
  const ownerName = (profile as any)?.full_name ?? ownerEmail;

  // Only create station if one doesn't exist yet (handles refresh/cancel flow)
  const { data: existingStatie } = await supabase
    .from("statii")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!existingStatie) {
    try {
      await createStatie(user.id, statieData, ownerEmail, ownerName);
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : "Eroare la creare stație" };
    }
  }

  // NOTE: onboarding_completed is marked AFTER payment — in /onboarding/success
  // or as a backup in the checkout.session.completed webhook

  try {
    // Get or create Stripe customer
    let customerId = (profile as any)?.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: (profile as any)?.email ?? user.email,
        metadata: { profile_id: user.id },
      });
      customerId = customer.id;

      const serviceSupabase = createServiceClient();
      await serviceSupabase
        .from("profiles")
        .update({ stripe_customer_id: customerId } as never)
        .eq("id", user.id);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://velos.ro";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: { profile_id: user.id, plan, cycle },
      },
      metadata: { profile_id: user.id, plan, cycle, type: "subscription" },
      success_url: `${appUrl}/onboarding/success?plan=${plan}`,
      cancel_url: `${appUrl}/onboarding`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_update: { name: "auto", address: "auto" },
      tax_id_collection: { enabled: true },
      locale: "ro",
    });

    return { checkoutUrl: session.url ?? undefined };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Eroare la inițializarea plații" };
  }
}
