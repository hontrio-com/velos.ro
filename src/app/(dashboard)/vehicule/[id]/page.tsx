import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { PageTransition } from "@/components/layout/page-transition";
import { VehiculProfilClient } from "@/components/vehicule/profil/vehicul-profil-client";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("vehicule").select("nr_inmatriculare").eq("id", id).single();
  return { title: data ? `Vehicul ${data.nr_inmatriculare}` : "Vehicul" };
}

export default async function VehiculProfilPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: vehicul } = await supabase
    .from("vehicule")
    .select(`
      id, statie_id, nr_inmatriculare, marca, model, an_fabricatie,
      serie_sasiu, vin, culoare, tip_vehicul, combustibil, capacitate_cilindrica,
      masa_maxima, kilometraj,
      expirare_itp, expirare_rca, expirare_rovinieta,
      expirare_revizie, expirare_tahograf, expirare_iscir,
      tip_proprietar, denumire_firma, cui_firma,
      observatii, note_interne, created_at,
      client:clienti(id, statie_id, nume, prenume, telefon, email, cnp, adresa)
    `)
    .eq("id", id)
    .single();

  if (!vehicul) notFound();

  // Verify ownership
  const { data: statie } = await supabase
    .from("statii")
    .select("id, owner_id, durata_slot_minute")
    .eq("id", vehicul.statie_id)
    .single();

  if (!statie || statie.owner_id !== user.id) notFound();

  // Toate stațiile deținute de user — pentru istoricul cross-stație
  const { data: userStatii } = await supabase
    .from("statii")
    .select("id, nume")
    .eq("owner_id", user.id);

  const client = Array.isArray(vehicul.client) ? vehicul.client[0] : vehicul.client;

  return (
    <PageTransition>
      <VehiculProfilClient
        vehicul={{ ...vehicul, client }}
        userStatii={userStatii ?? []}
      />
    </PageTransition>
  );
}
