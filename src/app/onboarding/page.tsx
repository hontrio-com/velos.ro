import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: statii }] = await Promise.all([
    supabase.from("profiles").select("onboarding_completed, email").eq("id", user.id).single(),
    supabase.from("statii").select("id").eq("owner_id", user.id).limit(1),
  ]);

  if ((profile as any)?.onboarding_completed) redirect("/dashboard");

  const hasStation = (statii?.length ?? 0) > 0;

  return (
    <OnboardingWizard
      userEmail={(profile as any)?.email ?? user.email ?? ""}
      hasStation={hasStation}
    />
  );
}
