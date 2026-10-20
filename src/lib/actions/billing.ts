"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { stripe } from "@/lib/stripe";
import { crediteazaAchizitieSms } from "@/lib/sms-achizitii";

/**
 * Fulfills an SMS purchase session idempotently.
 * Called from the success page as a fallback in case the webhook failed.
 *
 * Creditarea trece prin adauga_credit_sms_achizitie (migrația 012): webhook-ul și
 * această funcție pot rula simultan, dar contul se creditează o singură dată.
 * Aici DOAR se creditează (soldul apare imediat pe pagina de succes); factura o
 * emite exclusiv webhook-ul, la fiecare sesiune plătită.
 *
 * `pending: true` — sesiune finalizată, dar plata asincronă (ex. debit SEPA) nu a
 * fost încă confirmată; creditul vine din webhook la async_payment_succeeded.
 */
export async function fulfillSmsSessionAction(
  sessionId: string
): Promise<{ success: boolean; cantitate?: number; alreadyFulfilled?: boolean; pending?: boolean }> {
  if (!sessionId?.startsWith("cs_")) {
    return { success: false };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const serviceClient = createServiceClient();

  // Scurtătură: webhook-ul a ajuns deja — nu mai întrebăm Stripe.
  // Doar achizițiile proprii: cantitatea întoarsă ajunge în bannerul paginii.
  const { data: existing } = await serviceClient
    .from("sms_purchases")
    .select("cantitate")
    .eq("stripe_session_id", sessionId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (existing) {
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
    // Plată asincronă în curs: sesiunea e finalizată, dar banii nu au ajuns încă.
    const inAsteptare =
      session.mode === "payment" &&
      session.status === "complete" &&
      session.payment_status === "unpaid" &&
      session.metadata?.profile_id === user.id;
    return inAsteptare ? { success: false, pending: true } : { success: false };
  }

  // Verify the session belongs to the logged-in user
  const profileId = session.metadata?.profile_id;
  if (profileId !== user.id) {
    return { success: false };
  }

  const cantitate = parseInt(session.metadata?.cantitate ?? "0", 10);
  if (!cantitate || cantitate <= 0) return { success: false };

  let creditat: boolean;
  try {
    creditat = await crediteazaAchizitieSms(serviceClient, {
      sessionId: session.id,
      profileId: user.id,
      cantitate,
      pretTotal: (session.amount_total ?? 0) / 100,
      paymentIntent:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
    });
  } catch (err) {
    console.error("[billing] Creditare SMS eșuată (rămâne pe seama webhook-ului):", sessionId, err);
    return { success: false };
  }

  // Webhook-ul a creditat între timp.
  if (!creditat) return { success: true, cantitate, alreadyFulfilled: true };

  return { success: true, cantitate };
}
