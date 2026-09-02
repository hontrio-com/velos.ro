import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { IMPERSONARE_COOKIE, parseImpersonareCookie } from "@/lib/impersonation-shared";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Impersonare expirată → ieșire forțată, restaurând sesiunea de admin.
  const impersonare = parseImpersonareCookie(request.cookies.get(IMPERSONARE_COOKIE)?.value);
  if (impersonare && Date.now() > impersonare.expires_at) {
    return NextResponse.redirect(new URL("/api/admin/impersonare/stop", request.url));
  }

  const protectedRoutes = [
    "/dashboard",
    "/programari",
    "/clienti",
    "/vehicule",
    "/remindere",
    "/mesaje",
    "/rapoarte",
    "/setari",
    "/calendar",
    "/smart-page",
    "/admin",
    "/onboarding",
  ];

  const authRoutes = ["/login", "/register", "/forgot-password"];

  if (!user && protectedRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && authRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Pathname-ul trebuie sa ajunga in headerele CERERII, ca sa fie citibil cu
  // headers() in layout-uri; setat pe raspuns (cum era) nu ajunge niciodata la
  // componente, iar verificarea permisiunilor de angajat ramanea fara efect.
  const antete = new Headers(request.headers);
  antete.set("x-pathname", pathname);

  const raspunsFinal = NextResponse.next({ request: { headers: antete } });
  response.cookies.getAll().forEach((c) => raspunsFinal.cookies.set(c));
  raspunsFinal.headers.set("x-pathname", pathname);
  return raspunsFinal;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|booking/|auth/).*)",
  ],
};
