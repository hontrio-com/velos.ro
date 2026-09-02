import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { getImpersonare } from "@/lib/impersonation";
import { getStatieForUser } from "@/lib/get-user-statie";
import type { SubscriptionStatus } from "@/lib/stripe";

// Routes that are accessible even when trial expired / subscription canceled
const BILLING_EXEMPT = ["/setari/abonament", "/setari/profil", "/suspendat"];

// Routes only accessible by the station owner
const OWNER_ONLY_ROUTES = ["/angajati", "/setari", "/smart-page", "/rapoarte", "/remindere"];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const impersonare = await getImpersonare();
  const impersonareBanner = impersonare ? (
    <ImpersonationBanner
      targetEmail={impersonare.target_email}
      targetName={impersonare.target_name}
      adminEmail={impersonare.admin_email}
      expiresAt={impersonare.expires_at}
    />
  ) : null;

  const { data: profileRaw } = await (supabase as any)
    .from("profiles")
    .select("full_name, suspended_at, plan, subscription_status, trial_expires_at, onboarding_completed, role, owner_profile_id, is_admin")
    .eq("id", user.id)
    .single();

  const profile = profileRaw as {
    full_name: string | null;
    suspended_at: string | null;
    plan: string;
    subscription_status: string;
    trial_expires_at: string | null;
    onboarding_completed: boolean;
    role: "owner" | "angajat";
    owner_profile_id: string | null;
    is_admin: boolean | null;
  } | null;

  if (profile?.suspended_at) redirect("/suspendat");

  const role: "owner" | "angajat" = profile?.role ?? "owner";

  // ── Angajat flow ──────────────────────────────────────────────────────────
  if (role === "angajat") {
    // Use service client to bypass RLS — angajati policy only allows owners,
    // so the regular client would return null for the employee's own record.
    const db = createServiceClient();
    const { data: angajatRaw } = await db
      .from("angajati")
      .select("statie_id, permisiuni, statii(id, nume, activa)")
      .eq("profile_id", user.id)
      .eq("activ", true)
      .maybeSingle();

    const angajat = angajatRaw as { statie_id: string; permisiuni: Record<string, boolean> | null; statii: { id: string; nume: string; activa: boolean } | { id: string; nume: string; activa: boolean }[] | null } | null;

    // Sign out and redirect to login — avoids redirect loop since we sign out first
    if (!angajat) {
      await supabase.auth.signOut();
      redirect("/login");
    }

    const statieRaw = Array.isArray(angajat.statii) ? angajat.statii[0] : angajat.statii;
    const statii = statieRaw ? [statieRaw as { id: string; nume: string; activa: boolean }] : [];
    const permisiuni = angajat.permisiuni ?? {};

    // Route-level access control for employees
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") ?? "";

    // Check if employee is trying to access an owner-only route
    const isOwnerOnlyRoute = OWNER_ONLY_ROUTES.some((r) => pathname.startsWith(r));
    // Check if the specific section is in their permissions
    const routePermissionMap: Record<string, string> = {
      "/programari": "programari",
      "/clienti": "clienti",
      "/vehicule": "vehicule",
      "/rapoarte": "rapoarte",
      "/remindere": "remindere",
    };
    const requiredPermission = Object.entries(routePermissionMap).find(([r]) =>
      pathname.startsWith(r)
    )?.[1];

    if (
      (isOwnerOnlyRoute && !requiredPermission) ||
      (requiredPermission && !permisiuni[requiredPermission])
    ) {
      redirect("/dashboard");
    }

    return (
      <DashboardShell
        userEmail={user.email}
        userName={profile?.full_name ?? undefined}
        statii={statii}
        permisiuni={permisiuni}
        role="angajat"
      >
        {impersonareBanner}
        {children}
      </DashboardShell>
    );
  }

  // ── Owner flow ────────────────────────────────────────────────────────────

  const { data: statii } = await supabase
    .from("statii")
    .select("id, nume, activa")
    .eq("owner_id", user.id)
    .order("created_at");

  // Statia efectiv folosita de paginile randate pe server — comutatorul trebuie
  // sa arate exact statia ale carei date sunt afisate.
  const statieActiva = await getStatieForUser();

  // Redirect to onboarding if not completed yet
  if (!profile?.onboarding_completed) redirect("/onboarding");

  // Subscription gating
  const subscriptionStatus = (profile?.subscription_status ?? "trial") as SubscriptionStatus;
  const trialEndsAt = profile?.trial_expires_at ?? null;
  const currentPlan = profile?.plan ?? "trial";

  // If the user has a paid plan but subscription_status is still "trial"
  // (e.g. Stripe webhook failed), treat them as active — not trial_expired.
  const effectiveStatus: SubscriptionStatus =
    currentPlan !== "trial" && subscriptionStatus === "trial"
      ? "active"
      : subscriptionStatus === "trial" && trialEndsAt && new Date(trialEndsAt) < new Date()
      ? "trial_expired"
      : subscriptionStatus;

  if (effectiveStatus === "trial_expired") {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") ?? "";
    const isBillingExempt = BILLING_EXEMPT.some((r) => pathname.startsWith(r));
    if (!isBillingExempt) redirect("/setari/abonament");
  }

  return (
    <DashboardShell
      userEmail={user.email}
      userName={profile?.full_name ?? undefined}
      statii={statii ?? []}
      statieActivaId={statieActiva?.id ?? null}
      permisiuni={null}
      role="owner"
      isAdmin={profile?.is_admin === true}
    >
      {impersonareBanner}
      <TrialBanner
        subscriptionStatus={effectiveStatus}
        trialEndsAt={trialEndsAt}
        plan={profile?.plan ?? "trial"}
      />
      {children}
    </DashboardShell>
  );
}
