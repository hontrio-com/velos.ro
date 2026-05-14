import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe, getPlanFromPriceId } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[stripe/webhook] Invalid signature:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // ── SMS one-time purchase ──────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // SMS purchase (one-time payment, no subscription)
    if (session.mode === "payment") {
      const profileId = session.metadata?.profile_id;
      const cantitate = parseInt(session.metadata?.cantitate ?? "0", 10);
      if (profileId && cantitate) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("sms_credit")
          .eq("id", profileId)
          .single();

        const currentCredit = (prof as any)?.sms_credit ?? 0;
        await supabase
          .from("profiles")
          .update({ sms_credit: currentCredit + cantitate } as never)
          .eq("id", profileId);

        await (supabase as any).from("sms_purchases").upsert(
          {
            profile_id: profileId,
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent as string,
            cantitate,
            pret_total: (session.amount_total ?? 0) / 100,
            status: "completed",
            completed_at: new Date().toISOString(),
          },
          { onConflict: "stripe_session_id" }
        );
      }
    }

    // Subscription checkout completed — subscription will be activated via
    // customer.subscription.updated, but we can also set it here immediately
    if (session.mode === "subscription") {
      const profileId = session.metadata?.profile_id;
      const plan = session.metadata?.plan;
      const cycle = session.metadata?.cycle ?? "monthly";
      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;

      if (profileId && plan && subscriptionId) {
        // Fetch subscription to get period dates
        const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;
        const periodEnd = new Date(sub.current_period_end * 1000).toISOString();

        await supabase
          .from("profiles")
          .update({
            plan,
            subscription_status: "active",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            billing_cycle: cycle,
            subscription_ends_at: periodEnd,
            onboarding_completed: true,
          } as never)
          .eq("id", profileId);

        // Upsert in subscriptions history
        await (supabase as any).from("subscriptions").upsert(
          {
            profile_id: profileId,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            plan,
            billing_cycle: cycle,
            status: "active",
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stripe_subscription_id" }
        );
      }
    }
  }

  // ── Subscription updated (upgrade/downgrade/renewal) ──────────────────
  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as any;
    const profileId = sub.metadata?.profile_id;
    if (!profileId) return NextResponse.json({ received: true });

    const priceId = sub.items.data[0]?.price.id;
    const planInfo = priceId ? getPlanFromPriceId(priceId) : null;

    const stripeStatus = sub.status; // active | past_due | canceled | trialing | incomplete | ...
    const subscriptionStatus =
      stripeStatus === "active" ? "active"
      : stripeStatus === "past_due" ? "past_due"
      : stripeStatus === "canceled" ? "canceled"
      : "active";

    const periodEnd = new Date(sub.current_period_end * 1000).toISOString();

    await supabase
      .from("profiles")
      .update({
        ...(planInfo ? { plan: planInfo.plan, billing_cycle: planInfo.cycle } : {}),
        subscription_status: subscriptionStatus,
        stripe_subscription_id: sub.id,
        subscription_ends_at: periodEnd,
      } as never)
      .eq("id", profileId);

    await (supabase as any).from("subscriptions").upsert(
      {
        profile_id: profileId,
        stripe_subscription_id: sub.id,
        stripe_customer_id: sub.customer as string,
        plan: planInfo?.plan ?? "basic",
        billing_cycle: planInfo?.cycle ?? "monthly",
        status: stripeStatus,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" }
    );
  }

  // ── Subscription canceled/deleted ─────────────────────────────────────
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as any;
    const profileId = sub.metadata?.profile_id;
    if (!profileId) return NextResponse.json({ received: true });

    await supabase
      .from("profiles")
      .update({
        plan: "trial",
        subscription_status: "canceled",
        stripe_subscription_id: null,
        subscription_ends_at: new Date(sub.current_period_end * 1000).toISOString(),
      } as never)
      .eq("id", profileId);

    await (supabase as any).from("subscriptions")
      .update({ status: "canceled", canceled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", sub.id);
  }

  // ── Invoice paid (renewal) ────────────────────────────────────────────
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as any;
    const customerId = invoice.customer as string;
    if (!customerId || invoice.billing_reason === "subscription_create") {
      // subscription_create is handled by checkout.session.completed
      return NextResponse.json({ received: true });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id" as never, customerId)
      .single();

    if (profile) {
      const subId = invoice.subscription as string;
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId) as any;
        const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
        await supabase
          .from("profiles")
          .update({
            subscription_status: "active",
            subscription_ends_at: periodEnd,
          } as never)
          .eq("id", (profile as any).id);
      }
    }
  }

  // ── Invoice payment failed ────────────────────────────────────────────
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as any;
    const customerId = invoice.customer as string;
    if (!customerId) return NextResponse.json({ received: true });

    await supabase
      .from("profiles")
      .update({ subscription_status: "past_due" } as never)
      .eq("stripe_customer_id" as never, customerId);
  }

  return NextResponse.json({ received: true });
}
