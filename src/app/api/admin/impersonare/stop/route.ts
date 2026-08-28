import { NextResponse } from "next/server";
import { restoreAdminSession } from "@/lib/impersonation";

/**
 * Ieșire din impersonare. Folosit de middleware la expirarea celor 60 de minute
 * și ca variantă de rezervă pentru butonul din banner.
 */
export async function GET(request: Request) {
  const ok = await restoreAdminSession();
  const url = new URL(request.url);
  return NextResponse.redirect(
    new URL(ok ? "/admin/utilizatori" : "/login", url.origin)
  );
}
