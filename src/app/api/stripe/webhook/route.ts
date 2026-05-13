import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const profileId = session.metadata?.profile_id;
    const cantitate = parseInt(session.metadata?.cantitate ?? "0", 10);

    if (!profileId || !cantitate) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Fetch current credit and increment atomically
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

    // Log purchase
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

  return NextResponse.json({ received: true });
}
