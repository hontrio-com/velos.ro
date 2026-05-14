import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, email")
    .eq("id", user.id)
    .single();

  if ((profile as any)?.onboarding_completed) redirect("/dashboard");

  return (
    <OnboardingWizard userEmail={(profile as any)?.email ?? user.email ?? ""} />
  );
}
