"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { stripe } from "@/lib/stripe";
import { emiteFactura } from "@/lib/smartbill";

/**
 * Fulfills an SMS purchase session idempotently.
 * Called from the success page as a fallback in case the webhook failed.
 * Uses stripe_session_id as unique key to prevent double-crediting.
 */
export async function fulfillSmsSessionAction(
  sessionId: string
): Promise<{ success: boolean; cantitate?: number; alreadyFulfilled?: boolean }> {
  if (!sessionId?.startsWith("cs_")) {
    return { success: false };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const serviceClient = createServiceClient();

  // Check if already fulfilled (idempotency guard)
  const { data: existing } = await (serviceClient as any)
    .from("sms_purchases")
    .select("cantitate, profile_id")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (existing) {
    // Already fulfilled — just return success (guard against double-credit)
    return { success: true, cantitate: existing.cantitate, alreadyFulfilled: true };
  }

  // Not fulfilled yet — verify with Stripe
  let session: any;
  try {
    session = await (stripe.checkout.sessions as any).retrieve(sessionId);
  } catch {
    return { success: false };
  }

  if (session.payment_status !== "paid" || session.mode !== "payment") {
    return { success: false };
  }

  // Verify the session belongs to the logged-in user
  const profileId = session.metadata?.profile_id;
  if (profileId !== user.id) {
    return { success: false };
  }

  const cantitate = parseInt(session.metadata?.cantitate ?? "0", 10);
  if (!cantitate || cantitate <= 0) return { success: false };

  // Credit SMS to profile
  const { data: prof } = await serviceClient
    .from("profiles")
    .select("sms_credit" as any)
    .eq("id", user.id)
    .single();

  const currentCredit = (prof as any)?.sms_credit ?? 0;

  await serviceClient
    .from("profiles")
    .update({ sms_credit: currentCredit + cantitate } as never)
    .eq("id", user.id);

  // Record in sms_purchases to prevent double-fulfillment
  await (serviceClient as any).from("sms_purchases").insert({
    profile_id: user.id,
    stripe_session_id: session.id,
    stripe_payment_intent: session.payment_intent ?? null,
    cantitate,
    pret_total: (session.amount_total ?? 0) / 100,
    status: "completed",
    completed_at: new Date().toISOString(),
  });

  // Factură SmartBill (idempotentă — verifică dacă a fost deja emisă de webhook)
  const { data: facturaExisting } = await (serviceClient as any)
    .from("facturi")
    .select("id")
    .eq("referinta", session.id)
    .maybeSingle();

  if (!facturaExisting) {
    const { data: statie } = await serviceClient
      .from("statii")
      .select("nume, cui, adresa, oras, judet, email")
      .eq("owner_id", user.id)
      .eq("activa", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (statie) {
      const s = statie as any;
      const facturaResult = await emiteFactura({
        client: {
          name: s.nume ?? "Client",
          vatCode: s.cui ?? undefined,
          isTaxPayer: !!s.cui,
          address: s.adresa ?? undefined,
          city: s.oras ?? undefined,
          county: s.judet ?? undefined,
          email: s.email ?? undefined,
        },
        productName: `${cantitate} SMS-uri Velos CRM`,
        amount: (session.amount_total ?? 0) / 100,
        currency: session.currency ?? "eur",
      });

      await (serviceClient as any).from("facturi").insert({
        profile_id: user.id,
        tip: "sms_purchase",
        referinta: session.id,
        smartbill_serie: facturaResult.serie ?? null,
        smartbill_numar: facturaResult.numar ?? null,
        suma: (session.amount_total ?? 0) / 100,
        moneda: (session.currency ?? "eur").toUpperCase(),
        eroare: facturaResult.success ? null : (facturaResult.error ?? "Eroare necunoscuta"),
      });
    }
  }

  return { success: true, cantitate };
}
