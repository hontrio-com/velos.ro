"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  DURATA_MINUTE,
  getImpersonare,
  logAuditImpersonare,
  restoreAdminSession,
  setAdminSessionCookie,
  setImpersonareCookie,
  type ImpersonareMeta,
} from "@/lib/impersonation";

/**
 * Pornește impersonarea unui utilizator. Doar pentru conturi cu is_admin.
 * Nu trimite niciun email — magic link-ul este generat și consumat server-side.
 */
export async function startImpersonation(profileId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Neautentificat");

  const svc = createServiceClient();

  const { data: adminProfile } = await svc
    .from("profiles").select("is_admin, email").eq("id", user.id).single();
  if (!adminProfile?.is_admin) throw new Error("Acces interzis");

  if (profileId === user.id) throw new Error("Ești deja conectat în acest cont");

  const { data: target } = await svc
    .from("profiles").select("id, email, full_name, is_admin").eq("id", profileId).single();
  if (!target) throw new Error("Utilizatorul nu există");

  if (target.is_admin) {
    await logAuditImpersonare(
      "impersonate_denied", user.id, adminProfile.email, target.id, target.email,
      { motiv: "tinta este administrator" }
    );
    throw new Error("Nu poți intra în contul altui administrator");
  }

  // Sesiunea curentă de admin, salvată înainte de a fi înlocuită.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.refresh_token) throw new Error("Sesiunea de admin nu a putut fi citită");

  const { data: link, error: linkError } = await svc.auth.admin.generateLink({
    type: "magiclink",
    email: target.email,
  });
  const tokenHash = link?.properties?.hashed_token;
  if (linkError || !tokenHash) {
    throw new Error(`Nu s-a putut genera sesiunea: ${linkError?.message ?? "token lipsă"}`);
  }

  await setAdminSessionCookie({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    admin_id: user.id,
    admin_email: adminProfile.email,
  });

  // Consumarea magic link-ului înlocuiește cookie-urile de sesiune cu cele ale țintei.
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (verifyError) {
    throw new Error(`Autentificarea în contul țintă a eșuat: ${verifyError.message}`);
  }

  const now = Date.now();
  const meta: ImpersonareMeta = {
    target_id: target.id,
    target_email: target.email,
    target_name: target.full_name,
    admin_id: user.id,
    admin_email: adminProfile.email,
    started_at: now,
    expires_at: now + DURATA_MINUTE * 60 * 1000,
  };
  await setImpersonareCookie(meta);

  await logAuditImpersonare(
    "impersonate_start", user.id, adminProfile.email, target.id, target.email,
    { durata_maxima_minute: DURATA_MINUTE }
  );

  redirect("/dashboard");
}

/** Iese din impersonare și restaurează sesiunea de admin. */
export async function stopImpersonation() {
  const meta = await getImpersonare();
  const ok = await restoreAdminSession();
  redirect(ok && meta ? "/admin/utilizatori" : "/login");
}
