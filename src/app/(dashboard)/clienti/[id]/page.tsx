import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/fetch-all";
import { getStatieForUser } from "@/lib/get-user-statie";
import { ClientProfilHeader } from "@/components/clienti/profil/client-profil-header";
import { ClientProfilTabs } from "@/components/clienti/profil/client-profil-tabs";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("clienti")
    .select("nume, prenume")
    .eq("id", id)
    .single();
  if (!data) return { title: "Client" };
  const name = `${data.nume}${data.prenume ? " " + data.prenume : ""}`;
  return { title: name };
}

export default async function ClientProfilPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const statie = await getStatieForUser();
  if (!statie) redirect("/dashboard");

  // Client
  const { data: client } = await supabase
    .from("clienti")
    .select(
      "id, statie_id, nume, prenume, telefon, email, cnp, adresa, observatii, sms_optin, created_at"
    )
    .eq("id", id)
    .eq("statie_id", statie.id)
    .single();
  if (!client) notFound();

  // Vehicule
  const vehiculeRaw = await fetchAll((pFrom, pTo) =>
    supabase
      .from("vehicule")
      .select(
        "id, nr_inmatriculare, marca, model, an_fabricatie, culoare, tip_vehicul, combustibil, expirare_itp, expirare_rca, expirare_rovinieta, serie_sasiu, observatii, created_at"
      )
      .eq("client_id", client.id)
      .eq("statie_id", statie.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(pFrom, pTo)
  );

  // Programari with vehicul
  const programariRaw = await fetchAll((pFrom, pTo) =>
    supabase
      .from("programari")
      .select(
        "id, data_programare, ora_start, status, tip_serviciu, pret, observatii, vehicul:vehicule(id, nr_inmatriculare, marca, model)"
      )
      .eq("client_id", client.id)
      .eq("statie_id", statie.id)
      .order("data_programare", { ascending: false })
      .order("id", { ascending: true })
      .range(pFrom, pTo)
  );

  // Mesaje
  const mesajeRaw = await fetchAll((pFrom, pTo) =>
    supabase
      .from("mesaje")
      .select("id, mesaj, tip, directie, status, created_at, telefon")
      .eq("client_id", client.id)
      .eq("statie_id", statie.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(pFrom, pTo)
  );

  // Normalize
  const vehicule = vehiculeRaw;
  const programari = programariRaw.map((p) => ({
    ...p,
    vehicul: Array.isArray(p.vehicul) ? (p.vehicul[0] ?? null) : p.vehicul,
  }));
  const mesaje = mesajeRaw ?? [];

  // Stats
  const nrProgramari = programari.length;
  const totalCheltuit = programari
    .filter((p) => p.status === "finalizat")
    .reduce((s, p) => s + Number(p.pret ?? 0), 0);
  const dateProg = programari
    .map((p) => p.data_programare)
    .filter(Boolean)
    .sort()
    .reverse();
  const ultimaVizita = dateProg[0] ?? null;

  return (
    <div>
      <ClientProfilHeader
        client={client}
        stats={{
          nrVehicule: vehicule.length,
          nrProgramari,
          totalCheltuit,
          ultimaVizita,
        }}
        statieId={statie.id}
      />
      <ClientProfilTabs
        client={client}
        vehicule={vehicule}
        programari={programari}
        mesaje={mesaje}
        statieId={statie.id}
      />
    </div>
  );
}
