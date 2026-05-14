import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import type { SubscriptionStatus } from "@/lib/stripe";

// Routes that are accessible even when trial expired / subscription canceled
const BILLING_EXEMPT = ["/setari/abonament", "/setari/profil", "/suspendat"];

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

  const [{ data: profile }, { data: statii }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, suspended_at, plan, subscription_status, trial_expires_at, onboarding_completed")
      .eq("id", user.id)
      .single(),
    supabase
      .from("statii")
      .select("id, nume, activa")
      .eq("owner_id", user.id)
      .order("created_at"),
  ]);

  if (profile?.suspended_at) redirect("/suspendat");

  // Redirect to onboarding if not completed yet
  if (!(profile as any)?.onboarding_completed) redirect("/onboarding");

  // Subscription gating — check if trial is still valid
  const subscriptionStatus = ((profile as any)?.subscription_status ?? "trial") as SubscriptionStatus;
  const trialEndsAt = (profile as any)?.trial_expires_at as string | null;

  // If trial is stored as 'trial' but the date has passed, treat as expired
  const effectiveStatus: SubscriptionStatus =
    subscriptionStatus === "trial" && trialEndsAt && new Date(trialEndsAt) < new Date()
      ? "trial_expired"
      : subscriptionStatus;

  // Gate access for expired trial — redirect to billing page (except exempt routes)
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
    >
      <TrialBanner
        subscriptionStatus={effectiveStatus}
        trialEndsAt={trialEndsAt}
        plan={(profile as any)?.plan ?? "trial"}
      />
      {children}
    </DashboardShell>
  );
}
