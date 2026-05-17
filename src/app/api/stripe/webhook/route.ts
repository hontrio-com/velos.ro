import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe, getPlanFromPriceId, PLAN_CONFIG } from "@/lib/stripe";
import { emiteFactura, type SmartBillClientInfo } from "@/lib/smartbill";

export const dynamic = "force-dynamic";
import { createServiceClient } from "@/lib/supabase/service";

// ── SmartBill helpers ──────────────────────────────────────────────────────

async function getStatieClientInfo(
  supabase: ReturnType<typeof createServiceClient>,
  profileId: string
): Promise<SmartBillClientInfo | null> {
  const { data } = await supabase
    .from("statii")
    .select("nume, cui, adresa, oras, judet, email")
    .eq("owner_id", profileId)
    .eq("activa", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const s = data as any;
  return {
    name: s.nume ?? "Client",
    vatCode: s.cui ?? undefined,
    isTaxPayer: !!s.cui,
    address: s.adresa ?? undefined,
    city: s.oras ?? undefined,
    county: s.judet ?? undefined,
    email: s.email ?? undefined,
  };
}

/**
 * Emite factură SmartBill și înregistrează în tabelul `facturi`.
 * Idempotent: dacă `referinta` există deja, nu emite a doua factură.
 */
async function emiteFacturaIdempotent(
  supabase: ReturnType<typeof createServiceClient>,
  params: {
    profileId: string;
    tip: "sms_purchase" | "subscription_new" | "subscription_renewal";
    referinta: string;
    client: SmartBillClientInfo;
    productName: string;
    amount: number;
    currency: string;
  }
) {
  // Verifică dacă factura a fost deja emisă (idempotență)
  const { data: existing } = await (supabase as any)
    .from("facturi")
    .select("id")
    .eq("referinta", params.referinta)
    .maybeSingle();

  if (existing) return; // deja procesată

  const result = await emiteFactura({
    client: params.client,
    productName: params.productName,
    amount: params.amount,
    currency: params.currency,
  });

  await (supabase as any).from("facturi").insert({
    profile_id: params.profileId,
    tip: params.tip,
    referinta: params.referinta,
    smartbill_serie: result.serie ?? null,
    smartbill_numar: result.numar ?? null,
    suma: params.amount,
    moneda: params.currency.toUpperCase(),
    eroare: result.success ? null : (result.error ?? "Eroare necunoscuta"),
  });
}

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

        // Factură SmartBill pentru achiziție SMS
        const smsClient = await getStatieClientInfo(supabase, profileId);
        if (smsClient) {
          await emiteFacturaIdempotent(supabase, {
            profileId,
            tip: "sms_purchase",
            referinta: session.id,
            client: smsClient,
            productName: `${cantitate} SMS-uri Velos CRM`,
            amount: (session.amount_total ?? 0) / 100,
            currency: session.currency ?? "eur",
          });
        }
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

        // Factură SmartBill pentru abonament nou
        const planConfig = (PLAN_CONFIG as any)[plan];
        const planName = planConfig?.name ?? plan;
        const cycleLabel = cycle === "yearly" ? "anual" : "lunar";
        const subClient = await getStatieClientInfo(supabase, profileId);
        if (subClient) {
          await emiteFacturaIdempotent(supabase, {
            profileId,
            tip: "subscription_new",
            referinta: session.id,
            client: subClient,
            productName: `Abonament Velos CRM - Plan ${planName} (${cycleLabel})`,
            amount: (session.amount_total ?? 0) / 100,
            currency: session.currency ?? "ron",
          });
        }
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
      : stripeStatus === "trialing" ? "trial"
      : "active"; // incomplete, incomplete_expired, unpaid → treat as active (Stripe will follow up)

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
      const profileId = (profile as any).id as string;
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
          .eq("id", profileId);

        // Factură SmartBill pentru reînnoire
        const priceId = invoice.lines?.data?.[0]?.price?.id as string | undefined;
        const planInfo = priceId ? getPlanFromPriceId(priceId) : null;
        const planConfig = planInfo ? (PLAN_CONFIG as any)[planInfo.plan] : null;
        const planName = planConfig?.name ?? planInfo?.plan ?? "unknown";
        const cycleLabel = planInfo?.cycle === "yearly" ? "anual" : "lunar";
        const renewalClient = await getStatieClientInfo(supabase, profileId);
        if (renewalClient) {
          await emiteFacturaIdempotent(supabase, {
            profileId,
            tip: "subscription_renewal",
            referinta: invoice.id,
            client: renewalClient,
            productName: `Abonament Velos CRM - Reinnoire Plan ${planName} (${cycleLabel})`,
            amount: (invoice.amount_paid ?? 0) / 100,
            currency: invoice.currency ?? "ron",
          });
        }
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
