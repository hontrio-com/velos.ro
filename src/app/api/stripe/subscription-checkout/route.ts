import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { stripe, PLAN_CONFIG, isValidPlan, isValidCycle, type PlanId, type BillingCycle } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) =>
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          ),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  const body = await request.json();
  const plan = body.plan as string;
  const cycle = (body.cycle ?? "monthly") as string;

  if (!isValidPlan(plan)) {
    return NextResponse.json({ error: "Plan invalid" }, { status: 400 });
  }
  if (!isValidCycle(cycle)) {
    return NextResponse.json({ error: "Ciclu de facturare invalid" }, { status: 400 });
  }

  const planConfig = PLAN_CONFIG[plan as PlanId];
  const priceId = planConfig.priceId[cycle as BillingCycle];

  if (!priceId) {
    return NextResponse.json({ error: "Prețul Stripe nu este configurat" }, { status: 500 });
  }

  // Fetch or create Stripe customer
  const serviceSupabase = createServiceClient();
  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("stripe_customer_id, email, full_name")
    .eq("id", user.id)
    .single();

  let customerId = (profile as any)?.stripe_customer_id as string | null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email,
      name: (profile as any)?.full_name ?? undefined,
      metadata: { profile_id: user.id },
    });
    customerId = customer.id;

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
    success_url: `${appUrl}/setari/abonament?success=1&plan=${plan}`,
    cancel_url: `${appUrl}/setari/abonament?canceled=1`,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    tax_id_collection: { enabled: true },
    locale: "ro",
  });

  return NextResponse.json({ url: session.url });
}
