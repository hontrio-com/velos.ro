"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
} from "@/lib/validations/auth";
import { sendBunVenitEmail } from "@/lib/actions/email";

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

  // Send welcome email (fire and forget)
  sendBunVenitEmail(parsed.data.email, parsed.data.full_name).catch(console.error);

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

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password` }
  );

  if (error) return { error: error.message };

  return { error: "", success: true };
}
