/**
 * Constante și tipuri pentru impersonare, fără dependențe de next/headers —
 * pot fi importate și din middleware (Edge runtime).
 */

export const ADMIN_SESSION_COOKIE = "itp_admin_session";
export const IMPERSONARE_COOKIE = "itp_impersonare";
export const DURATA_MINUTE = 60;

export interface ImpersonareMeta {
  target_id: string;
  target_email: string;
  target_name: string | null;
  admin_id: string;
  admin_email: string;
  started_at: number;
  expires_at: number;
}

export function parseImpersonareCookie(raw: string | undefined): ImpersonareMeta | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ImpersonareMeta;
  } catch {
    return null;
  }
}
