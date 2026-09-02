"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
} from "@/lib/validations/auth";
import { sendBunVenitEmail, sendResetParolaEmail } from "@/lib/actions/email";
import { createServiceClient } from "@/lib/supabase/service";
import { headers, cookies } from "next/headers";
import { sendMetaEvent } from "@/lib/meta-conversions";

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const supabase = await createClient();

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Email sau parolă incorectă" };
  }

  redirect("/dashboard");
}

export async function registerAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const supabase = await createClient();

  const parsed = registerSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
    terms: formData.get("terms") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error, data } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Există deja un cont cu acest email" };
    }
    return { error: error.message };
  }

  await sendBunVenitEmail(parsed.data.email, parsed.data.full_name).catch(console.error);

  if (data.user) {
    const headersList = await headers();
    const cookieStore = await cookies();
    const userAgent = headersList.get("user-agent") ?? undefined;
    const fbc = cookieStore.get("_fbc")?.value;
    const fbp = cookieStore.get("_fbp")?.value;
    const nameParts = parsed.data.full_name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || undefined;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://velos.ro";
    const metaUser = { email: parsed.data.email, firstName, lastName, externalId: data.user.id, userAgent, fbc, fbp };

    await Promise.all([
      sendMetaEvent({ eventName: "CompleteRegistration", eventId: `reg_${data.user.id}`, sourceUrl: `${appUrl}/register`, user: metaUser }),
      sendMetaEvent({ eventName: "StartTrial", eventId: `trial_${data.user.id}`, sourceUrl: `${appUrl}/register`, user: metaUser }),
    ]).catch(console.error);
  }

  redirect("/onboarding");
}

export async function signInWithGoogleAction() {
  const supabase = await createClient();
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${proto}://${host}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${baseUrl}/auth/callback`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error) return { error: error.message };
  if (data.url) redirect(data.url);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(
  _prev: { error: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error: string; success?: boolean }> {
  const supabase = await createClient();

  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const serviceSupabase = createServiceClient();

  // Fetch profile name for personalized email
  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("full_name")
    .eq("email", parsed.data.email)
    .maybeSingle();

  // Generate reset link via Admin API so we can send it through Resend
  const { data: linkData, error: linkError } = await serviceSupabase.auth.admin.generateLink({
    type: "recovery",
    email: parsed.data.email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    },
  });

  if (linkError) return { error: linkError.message };

  const resetUrl = (linkData as any)?.properties?.action_link as string | undefined;
  if (!resetUrl) return { error: "Nu am putut genera link-ul de resetare" };

  await sendResetParolaEmail(
    parsed.data.email,
    profile?.full_name ?? parsed.data.email,
    resetUrl
  );

  return { error: "", success: true };
}
