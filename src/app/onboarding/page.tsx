import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getInfoTrial } from "@/lib/sms-disponibil";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: statii }, infoTrial] = await Promise.all([
    supabase.from("profiles").select("onboarding_completed, email").eq("id", user.id).single(),
    supabase.from("statii").select("id").eq("owner_id", user.id).limit(1),
    getInfoTrial(user.id),
  ]);

  if ((profile as any)?.onboarding_completed) redirect("/dashboard");

  const hasStation = (statii?.length ?? 0) > 0;

  // Conturile noi (trial fără SMS): durata reală, din trial_expires_at — corectă și
  // dacă adminul schimbă trial_luni. Conturile vechi neonboardate văd textul de până acum.
  const trialLuni =
    infoTrial.trialFaraSms && infoTrial.trialExpiresAt && infoTrial.createdAt
      ? Math.max(
          1,
          Math.round(
            (new Date(infoTrial.trialExpiresAt).getTime() - new Date(infoTrial.createdAt).getTime()) /
              (30.44 * 24 * 60 * 60 * 1000)
          )
        )
      : null;

  return (
    <OnboardingWizard
      userEmail={(profile as any)?.email ?? user.email ?? ""}
      hasStation={hasStation}
      trialFaraSms={infoTrial.trialFaraSms}
      trialLuni={trialLuni}
    />
  );
}
