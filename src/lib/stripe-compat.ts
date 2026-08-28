/**
 * Compatibilitate intre versiunile de API Stripe.
 *
 * In API 2025-03-31.basil si ulterioare (SDK-ul e fixat pe 2026-04-22.dahlia)
 * Stripe a mutat/eliminat campuri pe care se baza webhook-ul:
 *   Subscription.current_period_start/end -> SubscriptionItem.current_period_start/end
 *   Invoice.subscription                  -> Invoice.parent.subscription_details.subscription
 *   InvoiceLineItem.price.id              -> InvoiceLineItem.pricing.price_details.price
 *
 * Functiile de mai jos citesc ambele forme, ca sa functioneze indiferent de
 * versiunea de API cu care este trimis evenimentul.
 */

/** Converteste un timestamp Stripe (secunde) in ISO; null daca lipseste sau e invalid. */
export function toIso(unixSeconds: unknown): string | null {
  if (typeof unixSeconds !== "number" || !Number.isFinite(unixSeconds)) return null;
  const d = new Date(unixSeconds * 1000);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function getPeriodStart(sub: any): string | null {
  return toIso(sub?.items?.data?.[0]?.current_period_start ?? sub?.current_period_start);
}

export function getPeriodEnd(sub: any): string | null {
  return toIso(sub?.items?.data?.[0]?.current_period_end ?? sub?.current_period_end);
}

export function getInvoiceSubscriptionId(invoice: any): string | null {
  const raw =
    invoice?.parent?.subscription_details?.subscription ??
    invoice?.subscription_details?.subscription ??
    invoice?.subscription ??
    invoice?.lines?.data?.[0]?.parent?.subscription_item_details?.subscription ??
    null;
  if (!raw) return null;
  return typeof raw === "string" ? raw : (raw.id ?? null);
}

export function getInvoicePriceId(invoice: any): string | undefined {
  const line = invoice?.lines?.data?.[0];
  const raw = line?.pricing?.price_details?.price ?? line?.price?.id;
  return typeof raw === "string" ? raw : undefined;
}
