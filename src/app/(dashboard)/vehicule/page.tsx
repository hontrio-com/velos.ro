import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getStatieForUser } from "@/lib/get-user-statie";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/layout/page-transition";
import { VehiculeClient } from "@/components/vehicule/vehicule-client";

export const metadata: Metadata = { title: "Vehicule" };

export default async function VehiculePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const statie = await getStatieForUser();

  if (!statie) redirect("/dashboard");

  return (
    <PageTransition>
      <PageHeader title="Vehicule" />
      <VehiculeClient statieId={statie.id} />
    </PageTransition>
  );
}
