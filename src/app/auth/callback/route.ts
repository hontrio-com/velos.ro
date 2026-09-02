import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sendBunVenitEmail } from "@/lib/actions/email";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tip = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Send welcome email for new OAuth users (first sign-in)
      const user = data?.user;
      if (user?.email) {
        const createdAt = new Date(user.created_at).getTime();
        const lastSignIn = new Date(user.last_sign_in_at ?? user.created_at).getTime();
        const isNewUser = Math.abs(lastSignIn - createdAt) < 5000;
        if (isNewUser) {
          const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email;
          await sendBunVenitEmail(user.email, name).catch(() => null);
        }
      }
      return response;
    }
    return NextResponse.redirect(`${origin}/login`);
  }

  // Link-uri de email verificate pe server (confirmare cont, invitatie, magic link):
  // vin cu token_hash + type, nu cu ?code. Inainte cadeau tacut pe /login.
  if (tokenHash && tip) {
    if (tip === "recovery") {
      return NextResponse.redirect(`${origin}/reset-password?token_hash=${tokenHash}`);
    }

    const response = NextResponse.redirect(`${origin}${next}`);
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({
      type: tip as "magiclink" | "signup" | "invite" | "email_change",
      token_hash: tokenHash,
    });

    if (!error) return response;
    return NextResponse.redirect(`${origin}/login?error=link_invalid`);
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
