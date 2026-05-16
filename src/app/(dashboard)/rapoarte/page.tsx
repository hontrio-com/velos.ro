import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getStatieForUser } from "@/lib/get-user-statie";
import { redirect } from "next/navigation";
import { PageTransition } from "@/components/layout/page-transition";
import { RapoarteClient } from "@/components/rapoarte/rapoarte-client";

export const metadata: Metadata = { title: "Rapoarte" };

export default async function RapoartePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const statie = await getStatieForUser();

  if (!statie) redirect("/dashboard");

  return (
    <PageTransition>
      <div className="px-4 lg:px-6 py-4">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-[#111318]">Rapoarte</h1>
        </div>
        <RapoarteClient
          statieId={statie.id}
          statieNume={statie.nume}
          statieSlug={statie.slug}
          profileId={user.id}
        />
      </div>
    </PageTransition>
  );
}
