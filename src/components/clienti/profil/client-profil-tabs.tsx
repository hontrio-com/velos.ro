"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClientTabDetalii } from "./client-tab-detalii";
import { ClientTabVehicule } from "./client-tab-vehicule";
import { ClientTabProgramari } from "./client-tab-programari";
import { ClientTabMesaje } from "./client-tab-mesaje";
import { ClientTabNote } from "./client-tab-note";

interface Client {
  id: string; nume: string; prenume?: string | null; telefon: string;
  email?: string | null; cnp?: string | null; adresa?: string | null;
  sms_optin?: boolean; observatii?: string | null; created_at: string;
}
interface Vehicul {
  id: string; nr_inmatriculare: string; marca: string | null; model: string | null;
  an_fabricatie: number | null; culoare: string | null; tip_vehicul: string | null;
  combustibil: string | null; expirare_itp: string | null; expirare_rca: string | null;
  expirare_rovinieta: string | null; serie_sasiu: string | null; observatii: string | null;
  created_at: string;
}
interface Programare {
  id: string; data_programare: string; ora_start: string | null; status: string;
  tip_serviciu: string | null; pret: number | null; observatii: string | null;
  vehicul: { id: string; nr_inmatriculare: string; marca: string | null; model: string | null; } | null;
}
interface Mesaj {
  id: string; mesaj: string; tip: string; directie: string; status: string;
  created_at: string; telefon: string;
}
interface ClientProfilTabsProps {
  client: Client; vehicule: Vehicul[]; programari: Programare[];
  mesaje: Mesaj[]; statieId: string;
}
type TabValue = "detalii" | "vehicule" | "programari" | "mesaje" | "note";

export function ClientProfilTabs({ client, vehicule, programari, mesaje, statieId }: ClientProfilTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabValue>(
    (searchParams.get("tab") as TabValue) ?? "detalii"
  );

  function handleTabChange(value: TabValue) {
    setActiveTab(value);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    router.replace(url.pathname + url.search, { scroll: false });
  }

  const TABS = [
    { value: "detalii"    as const, label: "Detalii",    count: undefined },
    { value: "vehicule"   as const, label: "Vehicule",   count: vehicule.length },
    { value: "programari" as const, label: "Programări", count: programari.length },
    { value: "mesaje"     as const, label: "Mesaje",     count: mesaje.length },
    { value: "note"       as const, label: "Note",       count: undefined },
  ];

  return (
    <div>
      <div className="flex overflow-x-auto border-b border-[#E5E7EB] mb-6" style={{ scrollbarWidth: "none" }}>
        {TABS.map(({ value, label, count }) => {
          const isActive = activeTab === value;
          return (
            <button key={value} type="button" onClick={() => handleTabChange(value)}
              className={[
                "relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                "border-b-2 -mb-px focus-visible:outline-none",
                isActive ? "text-[#1877F2] border-[#1877F2]" : "text-[#6B7280] border-transparent hover:text-[#111318]",
              ].join(" ")}
            >
              {label}
              {count !== undefined && count > 0 && (
                <span className={["inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold",
                  isActive ? "bg-[#EFF6FF] text-[#1877F2]" : "bg-[#F7F8FA] text-[#6B7280]",
                ].join(" ")}>{count}</span>
              )}
            </button>
          );
        })}
      </div>
      {activeTab === "detalii"    && <ClientTabDetalii client={client} />}
      {activeTab === "vehicule"   && <ClientTabVehicule clientId={client.id} statieId={statieId} vehicule={vehicule} />}
      {activeTab === "programari" && <ClientTabProgramari programari={programari} />}
      {activeTab === "mesaje"     && <ClientTabMesaje clientId={client.id} telefon={client.telefon} mesaje={mesaje} />}
      {activeTab === "note"       && <ClientTabNote clientId={client.id} initialValue={client.observatii ?? null} />}
    </div>
  );
}
