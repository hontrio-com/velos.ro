import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/types/database.types";

/**
 * Impersonare admin — "conectare temporară" într-un cont de utilizator.
 *
 * Mecanism:
 *  1. Sesiunea adminului (access + refresh token) este pusă deoparte într-un cookie httpOnly.
 *  2. Se generează un magic link prin Admin API (nu se trimite niciun email) și se
 *     consumă server-side, ceea ce înlocuiește cookie-urile de sesiune cu cele ale țintei.
 *  3. La ieșire, sesiunea impersonată este revocată și sesiunea adminului este restaurată
 *     din cookie-ul pus deoparte.
 *
 * Durata maximă este limitată; middleware-ul forțează ieșirea după expirare.
 */

import {
  ADMIN_SESSION_COOKIE,
  DURATA_MINUTE,
  IMPERSONARE_COOKIE,
  type ImpersonareMeta,
} from "@/lib/impersonation-shared";

export { ADMIN_SESSION_COOKIE, DURATA_MINUTE, IMPERSONARE_COOKIE };
export type { ImpersonareMeta };

interface AdminSessionCookie {
  access_token: string;
  refresh_token: string;
  admin_id: string;
  admin_email: string;
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: DURATA_MINUTE * 60,
};

function safeParse<T>(raw: string | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Starea curentă de impersonare, sau null dacă sesiunea este una normală. */
export async function getImpersonare(): Promise<ImpersonareMeta | null> {
  const store = await cookies();
  const meta = safeParse<ImpersonareMeta>(store.get(IMPERSONARE_COOKIE)?.value);
  if (!meta) return null;
  return meta;
}

export async function setAdminSessionCookie(data: AdminSessionCookie) {
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, JSON.stringify(data), cookieOptions);
}

export async function setImpersonareCookie(meta: ImpersonareMeta) {
  const store = await cookies();
  store.set(IMPERSONARE_COOKIE, JSON.stringify(meta), cookieOptions);
}

export async function clearImpersonareCookies() {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
  store.delete(IMPERSONARE_COOKIE);
}

export async function logAuditImpersonare(
  actiune: "impersonate_start" | "impersonate_stop" | "impersonate_denied",
  adminId: string,
  adminEmail: string,
  targetId: string,
  targetLabel: string,
  detalii?: Json
) {
  try {
    const svc = createServiceClient();
    await svc.from("admin_audit_log").insert({
      admin_id: adminId,
      admin_email: adminEmail,
      actiune,
      target_type: "user",
      target_id: targetId,
      target_label: targetLabel,
      detalii: detalii ?? null,
    });
  } catch {
    /* auditul nu blochează acțiunea */
  }
}

/**
 * Restaurează sesiunea adminului și revocă sesiunea impersonată.
 * Returnează true dacă restaurarea a reușit.
 */
export async function restoreAdminSession(): Promise<boolean> {
  const store = await cookies();
  const saved = safeParse<AdminSessionCookie>(store.get(ADMIN_SESSION_COOKIE)?.value);
  const meta = safeParse<ImpersonareMeta>(store.get(IMPERSONARE_COOKIE)?.value);

  if (!saved) {
    await clearImpersonareCookies();
    return false;
  }

  const supabase = await createClient();

  // Tokenul sesiunii impersonate, ca să o putem revoca după restaurare.
  const { data: { session: impSession } } = await supabase.auth.getSession();
  const impAccessToken = impSession?.access_token;

  const { error } = await supabase.auth.setSession({
    access_token: saved.access_token,
    refresh_token: saved.refresh_token,
  });

  if (error) {
    // Sesiunea de admin nu mai poate fi restaurată (token expirat) — curățăm tot,
    // adminul va trebui să se autentifice din nou.
    await clearImpersonareCookies();
    await supabase.auth.signOut({ scope: "local" });
    return false;
  }

  if (impAccessToken) {
    try {
      const svc = createServiceClient();
      await svc.auth.admin.signOut(impAccessToken, "local");
    } catch {
      /* revocarea eșuată nu blochează ieșirea */
    }
  }

  if (meta) {
    await logAuditImpersonare(
      "impersonate_stop",
      saved.admin_id,
      saved.admin_email,
      meta.target_id,
      meta.target_email,
      { durata_secunde: Math.round((Date.now() - meta.started_at) / 1000) }
    );
  }

  await clearImpersonareCookies();
  return true;
}
