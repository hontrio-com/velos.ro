import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe, getPlanFromPriceId, PLAN_CONFIG } from "@/lib/stripe";
import { emiteFactura, type SmartBillClientInfo } from "@/lib/smartbill";
import { sendMetaEvent } from "@/lib/meta-conversions";

export const dynamic = "force-dynamic";
import { createServiceClient } from "@/lib/supabase/service";
import { getPeriodStart, getPeriodEnd, getInvoiceSubscriptionId, getInvoicePriceId } from "@/lib/stripe-compat";
import { crediteazaAchizitieSms } from "@/lib/sms-achizitii";

/** Cauta profilul dupa metadata sau, in lipsa, dupa stripe_customer_id. */
async function resolveProfileId(
  supabase: ReturnType<typeof createServiceClient>,
  metadataProfileId: string | undefined,
  customerId: string | null
): Promise<string | null> {
  if (metadataProfileId) return metadataProfileId;
  if (!customerId) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id" as never, customerId)
    .maybeSingle();
  return (data as any)?.id ?? null;
}

// ── SmartBill helpers ──────────────────────────────────────────────────────

async function getStatieClientInfo(
  supabase: ReturnType<typeof createServiceClient>,
  profileId: string
): Promise<SmartBillClientInfo> {
  // Încearcă să ia datele din prima stație activă a utilizatorului
  const { data: statie } = await supabase
    .from("statii")
    .select("nume, cui, adresa, oras, judet, email")
    .eq("owner_id", profileId)
    .eq("activa", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (statie) {
    const s = statie as any;
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

  // Fallback: date din profilul utilizatorului
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", profileId)
    .single();

  return {
    name: (profile as any)?.full_name ?? "Client Velos CRM",
    email: profile?.email ?? undefined,
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
  // Facturarea nu trebuie să blocheze niciodată activarea abonamentului:
  // orice eroare SmartBill este logată, nu propagată.
  try {
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

    const { error: insertError } = await (supabase as any).from("facturi").insert({
      profile_id: params.profileId,
      tip: params.tip,
      referinta: params.referinta,
      smartbill_serie: result.serie ?? null,
      smartbill_numar: result.numar ?? null,
      suma: params.amount,
      moneda: params.currency.toUpperCase(),
      eroare: result.success ? null : (result.error ?? "Eroare necunoscuta"),
    });
    if (insertError) {
      // Factura poate fi deja emisă în SmartBill: seria/numărul din log permit reconcilierea manuală.
      console.error(
        "[stripe/webhook] Factura nu a putut fi înregistrată în facturi:",
        params.referinta,
        result.serie ?? null,
        result.numar ?? null,
        insertError
      );
    }
  } catch (err) {
    console.error("[stripe/webhook] Emitere factura esuata:", params.referinta, err);
  }
}

// ── Achiziție SMS (checkout în mod "payment") ─────────────────────────────

/**
 * Creditarea trece prin adauga_credit_sms_achizitie: exact o dată per sesiune,
 * oricâte livrări ale aceluiași eveniment și oricât de repede ajunge utilizatorul
 * pe pagina de succes (fulfillSmsSessionAction face același apel, dar nu facturează).
 * Factura o emite doar webhook-ul.
 */
async function proceseazaAchizitieSms(
  supabase: ReturnType<typeof createServiceClient>,
  session: Stripe.Checkout.Session
) {
  const profileId = session.metadata?.profile_id;
  const cantitate = parseInt(session.metadata?.cantitate ?? "0", 10);
  if (!profileId || !cantitate || cantitate <= 0) return;

  // Metodele de plată asincrone (ex. debit SEPA) marchează sesiunea „completed"
  // înainte să ajungă banii. Creditul se dă abia la async_payment_succeeded,
  // care ajunge tot aici.
  if (session.payment_status !== "paid") {
    console.warn("[stripe/webhook] Achiziție SMS încă neplătită:", session.id, session.payment_status);
    return;
  }

  const amount = (session.amount_total ?? 0) / 100;
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  // Eroare de bază de date => aruncă => 500 => Stripe reîncearcă (sigur: idempotent).
  await crediteazaAchizitieSms(supabase, {
    sessionId: session.id,
    profileId,
    cantitate,
    pretTotal: amount,
    paymentIntent,
  });

  // Factura se emite la fiecare livrare a unei sesiuni plătite, indiferent dacă
  // această livrare sau fallback-ul de pe pagina de succes a creditat contul:
  // emiteFacturaIdempotent sare peste dacă factura există deja. O livrare oprită
  // înainte de factură nu răspunde 2xx, iar reîncercarea Stripe o emite.
  await emiteFacturaIdempotent(supabase, {
    profileId,
    tip: "sms_purchase",
    referinta: session.id,
    client: await getStatieClientInfo(supabase, profileId),
    productName: `${cantitate} SMS-uri Velos CRM`,
    amount,
    currency: session.currency ?? "eur",
  });

  const { data: prof } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", profileId)
    .maybeSingle();

  // Meta Pixel — Purchase SMS, după factură (Meta deduplică după eventId; fallback-ul nu trimite evenimentul)
  await sendMetaEvent({
    eventName: "Purchase",
    eventId: `sms_${session.id}`,
    sourceUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://velos.ro"}/remindere`,
    user: {
      email: prof?.email ?? undefined,
      externalId: profileId,
    },
    customData: {
      value: amount,
      currency: (session.currency ?? "eur").toUpperCase(),
      content_name: `${cantitate} SMS-uri Velos`,
    },
  }).catch(console.error);
}

async function handleWebhook(request: NextRequest) {
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
      await proceseazaAchizitieSms(supabase, session);
    }

    // Subscription checkout completed — subscription will be activated via
    // customer.subscription.updated, but we can also set it here immediately
    if (session.mode === "subscription") {
      const profileId = await resolveProfileId(supabase, session.metadata?.profile_id, session.customer as string);
      const plan = session.metadata?.plan;
      const cycle = session.metadata?.cycle ?? "monthly";
      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;

      if (profileId && plan && subscriptionId) {
        // Datele de perioadă sunt utile, dar lipsa lor nu trebuie să blocheze
        // activarea — abonamentul e plătit, contul trebuie deblocat oricum.
        let sub: any = null;
        try {
          sub = await stripe.subscriptions.retrieve(subscriptionId);
        } catch (err) {
          console.error("[stripe/webhook] Nu s-a putut citi abonamentul", subscriptionId, err);
        }
        const periodEnd = getPeriodEnd(sub);
        const periodStart = getPeriodStart(sub);

        await supabase
          .from("profiles")
          .update({
            plan,
            subscription_status: "active",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            billing_cycle: cycle,
            ...(periodEnd ? { subscription_ends_at: periodEnd } : {}),
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
            current_period_start: periodStart,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stripe_subscription_id" }
        );

        // Meta Pixel — Subscribe
        const { data: subProf } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", profileId)
          .maybeSingle();
        const subNameParts = ((subProf as any)?.full_name as string | undefined)?.trim().split(/\s+/) ?? [];
        await sendMetaEvent({
          eventName: "Subscribe",
          eventId: `sub_${subscriptionId}`,
          sourceUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://velos.ro"}/setari/abonament`,
          user: {
            email: (subProf as any)?.email ?? undefined,
            firstName: subNameParts[0],
            lastName: subNameParts.slice(1).join(" ") || undefined,
            externalId: profileId,
          },
          customData: {
            value: (session.amount_total ?? 0) / 100,
            currency: (session.currency ?? "ron").toUpperCase(),
            content_name: `Abonament ${plan} ${cycle}`,
          },
        }).catch(console.error);

        // Factură SmartBill pentru abonament nou
        const planConfig = (PLAN_CONFIG as any)[plan];
        const planName = planConfig?.name ?? plan;
        const cycleLabel = cycle === "yearly" ? "anual" : "lunar";
        await emiteFacturaIdempotent(supabase, {
          profileId,
          tip: "subscription_new",
          referinta: session.id,
          client: await getStatieClientInfo(supabase, profileId),
          productName: `Abonament Velos CRM - Plan ${planName} (${cycleLabel})`,
          amount: (session.amount_total ?? 0) / 100,
          currency: session.currency ?? "ron",
        });
      }
    }
  }

  // ── SMS plătit asincron (ex. debit SEPA): creditul se dă abia acum ──────
  if (event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode === "payment") {
      await proceseazaAchizitieSms(supabase, session);
    }
  }

  // ── Subscription updated (upgrade/downgrade/renewal) ──────────────────
  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as any;
    const profileId = await resolveProfileId(supabase, sub.metadata?.profile_id, sub.customer as string);
    if (!profileId) {
      console.warn("[stripe/webhook] subscription.updated fara profil identificabil:", sub.id);
      return NextResponse.json({ received: true });
    }

    const priceId = sub.items?.data?.[0]?.price?.id;
    const planInfo = priceId ? getPlanFromPriceId(priceId) : null;

    const stripeStatus = sub.status; // active | past_due | canceled | trialing | incomplete | ...
    const subscriptionStatus =
      stripeStatus === "active" ? "active"
      : stripeStatus === "past_due" ? "past_due"
      : stripeStatus === "canceled" ? "canceled"
      : stripeStatus === "trialing" ? "trial"
      : "active"; // incomplete, incomplete_expired, unpaid → treat as active (Stripe will follow up)

    const periodEnd = getPeriodEnd(sub);
    const periodStart = getPeriodStart(sub);

    await supabase
      .from("profiles")
      .update({
        ...(planInfo ? { plan: planInfo.plan, billing_cycle: planInfo.cycle } : {}),
        subscription_status: subscriptionStatus,
        stripe_subscription_id: sub.id,
        ...(periodEnd ? { subscription_ends_at: periodEnd } : {}),
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
        current_period_start: periodStart,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" }
    );
  }

  // ── Subscription canceled/deleted ─────────────────────────────────────
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as any;
    const profileId = await resolveProfileId(supabase, sub.metadata?.profile_id, sub.customer as string);
    if (!profileId) {
      console.warn("[stripe/webhook] subscription.deleted fara profil identificabil:", sub.id);
      return NextResponse.json({ received: true });
    }

    const periodEnd = getPeriodEnd(sub);

    await supabase
      .from("profiles")
      .update({
        plan: "trial",
        subscription_status: "canceled",
        stripe_subscription_id: null,
        ...(periodEnd ? { subscription_ends_at: periodEnd } : {}),
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
      const subId = getInvoiceSubscriptionId(invoice);
      if (subId) {
        let sub: any = null;
        try {
          sub = await stripe.subscriptions.retrieve(subId);
        } catch (err) {
          console.error("[stripe/webhook] Nu s-a putut citi abonamentul la reinnoire", subId, err);
        }
        const periodEnd = getPeriodEnd(sub);
        await supabase
          .from("profiles")
          .update({
            subscription_status: "active",
            ...(periodEnd ? { subscription_ends_at: periodEnd } : {}),
          } as never)
          .eq("id", profileId);

        // Factură SmartBill pentru reînnoire
        const priceId = getInvoicePriceId(invoice);
        const planInfo = priceId ? getPlanFromPriceId(priceId) : null;
        const planConfig = planInfo ? (PLAN_CONFIG as any)[planInfo.plan] : null;
        const planName = planConfig?.name ?? planInfo?.plan ?? "unknown";
        const cycleLabel = planInfo?.cycle === "yearly" ? "anual" : "lunar";
        await emiteFacturaIdempotent(supabase, {
          profileId,
          tip: "subscription_renewal",
          referinta: invoice.id,
          client: await getStatieClientInfo(supabase, profileId),
          productName: `Abonament Velos CRM - Reinnoire Plan ${planName} (${cycleLabel})`,
          amount: (invoice.amount_paid ?? 0) / 100,
          currency: invoice.currency ?? "ron",
        });
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

/**
 * Wrapper cu logare: orice eroare netratata este scrisa in loguri impreuna cu
 * tipul evenimentului, apoi propagata ca 500 pentru ca Stripe sa reincerce.
 * Fara asta, o schimbare de API Stripe trece neobservata (abonamente neactivate,
 * fara nicio urma in loguri).
 */
export async function POST(request: NextRequest) {
  try {
    return await handleWebhook(request);
  } catch (err) {
    console.error("[stripe/webhook] Eroare netratata:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Eroare interna" },
      { status: 500 }
    );
  }
}
