"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientTabDetalii } from "./client-tab-detalii";
import { ClientTabVehicule } from "./client-tab-vehicule";
import { ClientTabProgramari } from "./client-tab-programari";
import { ClientTabMesaje } from "./client-tab-mesaje";
import { ClientTabNote } from "./client-tab-note";

interface Client {
  id: string;
  nume: string;
  prenume?: string | null;
  telefon: string;
  email?: string | null;
  cnp?: string | null;
  adresa?: string | null;
  sms_optin?: boolean;
  observatii?: string | null;
  created_at: string;
}

interface Vehicul {
  id: string;
  nr_inmatriculare: string;
  marca: string | null;
  model: string | null;
  an_fabricatie: number | null;
  culoare: string | null;
  tip_vehicul: string | null;
  combustibil: string | null;
  expirare_itp: string | null;
  expirare_rca: string | null;
  expirare_rovinieta: string | null;
  serie_sasiu: string | null;
  observatii: string | null;
  created_at: string;
}

interface Programare {
  id: string;
  data_programare: string;
  ora_start: string | null;
  status: string;
  tip_serviciu: string | null;
  pret: number | null;
  observatii: string | null;
  vehicul: {
    id: string;
    nr_inmatriculare: string;
    marca: string | null;
    model: string | null;
  } | null;
}

interface Mesaj {
  id: string;
  mesaj: string;
  tip: string;
  directie: string;
  status: string;
  created_at: string;
  telefon: string;
}

interface ClientProfilTabsProps {
  client: Client;
  vehicule: Vehicul[];
  programari: Programare[];
  mesaje: Mesaj[];
  statieId: string;
}

export function ClientProfilTabs({
  client,
  vehicule,
  programari,
  mesaje,
  statieId,
}: ClientProfilTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultTab = searchParams.get("tab") ?? "detalii";

  function handleTabChange(value: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    router.replace(url.pathname + url.search, { scroll: false });
  }

  return (
    <Tabs defaultValue={defaultTab} onValueChange={handleTabChange}>
      <TabsList className="h-auto p-0 bg-transparent border-b border-[#F3F4F6] rounded-none w-full justify-start gap-0 mb-6">
        {[
          { value: "detalii", label: "Detalii" },
          { value: "vehicule", label: "Vehicule", count: vehicule.length },
          { value: "programari", label: "Programări", count: programari.length },
          { value: "mesaje", label: "Mesaje", count: mesaje.length },
          { value: "note", label: "Note" },
        ].map(({ value, label, count }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="relative px-4 py-2.5 text-sm font-medium text-[#9CA3AF] rounded-none border-b-2 border-transparent data-[state=active]:border-[#1877F2] data-[state=active]:text-[#1877F2] data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-[#374151] transition-colors flex items-center gap-1.5"
          >
            {label}
            {count !== undefined && count > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-semibold bg-[#F3F4F6] text-[#6B7280] data-[state=active]:bg-[#EFF6FF] data-[state=active]:text-[#1877F2]">
                {count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="detalii" className="mt-0">
        <ClientTabDetalii client={client} />
      </TabsContent>

      <TabsContent value="vehicule" className="mt-0">
        <ClientTabVehicule
          clientId={client.id}
          statieId={statieId}
          vehicule={vehicule}
        />
      </TabsContent>

      <TabsContent value="programari" className="mt-0">
        <ClientTabProgramari programari={programari} />
      </TabsContent>

      <TabsContent value="mesaje" className="mt-0">
        <ClientTabMesaje
          clientId={client.id}
          telefon={client.telefon}
          mesaje={mesaje}
        />
      </TabsContent>

      <TabsContent value="note" className="mt-0">
        <ClientTabNote
          clientId={client.id}
          initialValue={client.observatii ?? null}
        />
      </TabsContent>
    </Tabs>
  );
}
