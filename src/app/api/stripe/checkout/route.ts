import { NextResponse, type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerClient } from "@supabase/ssr";
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
  const cantitate = Math.max(50, Math.round(Number(body.cantitate)));
  if (!cantitate || cantitate < 50) {
    return NextResponse.json({ error: "Minim 50 SMS-uri" }, { status: 400 });
  }

  // Citim prețul din admin_settings (fallback 0.05€)
  const serviceSupabase = createServiceClient();
  const { data: priceSetting } = await (serviceSupabase as any)
    .from("admin_settings").select("valoare").eq("cheie", "sms_pret_eur").single();
  const pretPerSms = parseFloat(priceSetting?.valoare ?? "0.05");

  const pretTotal = Math.round(cantitate * pretPerSms * 100); // în cenți

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://velos.ro";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    currency: "eur",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: pretTotal,
          product_data: {
            name: `${cantitate} SMS-uri Velos CRM`,
            description: `Pachet de ${cantitate} SMS-uri (${pretPerSms.toFixed(3)}€/SMS) — nu expiră`,
          },
        },
      },
    ],
    metadata: {
      profile_id: user.id,
      cantitate: String(cantitate),
    },
    success_url: `${appUrl}/setari/abonament?sms_success=1&cantitate=${cantitate}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/setari/abonament?sms_cancel=1`,
  });

  return NextResponse.json({ url: session.url });
}
