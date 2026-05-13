import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
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

  const { data: statie } = await supabase
    .from("statii")
    .select("id")
    .eq("owner_id", user.id)
    .eq("activa", true)
    .order("created_at")
    .limit(1)
    .single();

  if (!statie) redirect("/setari");

  return (
    <PageTransition>
      <PageHeader title="Vehicule" />
      <VehiculeClient statieId={statie.id} />
    </PageTransition>
  );
}
