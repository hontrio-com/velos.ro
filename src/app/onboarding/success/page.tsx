import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";

export default async function OnboardingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Mark onboarding complete — payment was confirmed by Stripe success URL
  const serviceSupabase = createServiceClient();
  await serviceSupabase
    .from("profiles")
    .update({ onboarding_completed: true } as never)
    .eq("id", user.id);

  const { plan } = await searchParams;
  redirect(`/setari/abonament?success=1${plan ? `&plan=${plan}` : ""}`);
}
