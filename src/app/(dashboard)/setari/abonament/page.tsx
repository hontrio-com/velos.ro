import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageTransition } from "@/components/layout/page-transition";
import { AbonamentClient } from "@/components/setari/abonament/abonament-client";

export const metadata: Metadata = { title: "Abonament" };

export default async function AbonamentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, email")
    .eq("id", user.id)
    .single();

  const plan = profile?.plan ?? "trial";

  return (
    <PageTransition>
      <div className="px-4 lg:px-6 py-4">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#111318]">Abonament</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Gestionează planul tău și quota de SMS-uri
          </p>
        </div>
        <AbonamentClient currentPlan={plan} email={profile?.email ?? user.email ?? ""} />
      </div>
    </PageTransition>
  );
}
