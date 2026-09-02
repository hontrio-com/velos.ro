"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarDays, Plus, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgramariCalendar } from "@/components/programari/programari-calendar";
import { ProgramareDrawer } from "@/components/programari/programare-drawer";
import { ProgramareNouaDrawer } from "@/components/programari/programare-noua-drawer";

/**
 * Calendarul din pagina Programări, adus în Dashboard: se văd programările
 * existente, se deschide fișa uneia cu un click și se face una nouă dând click
 * pe o zi/oră liberă. Foloseste exact aceleasi componente ca pagina Programari,
 * ca sa nu existe doua comportamente diferite pentru acelasi lucru.
 */
export function CalendarProgramari({ statieId }: { statieId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [programareSelectata, setProgramareSelectata] = useState<string | null>(null);
  const [drawerNouDeschis, setDrawerNouDeschis] = useState(false);
  const [dataNoua, setDataNoua] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [oraNoua, setOraNoua] = useState<string | null>(null);

  function deschideProgramareNoua(data?: string, ora?: string) {
    setDataNoua(data ?? format(new Date(), "yyyy-MM-dd"));
    setOraNoua(ora ?? null);
    setDrawerNouDeschis(true);
  }

  function reincarcaDatele() {
    queryClient.invalidateQueries({ queryKey: ["programari-calendar", statieId] });
    queryClient.invalidateQueries({ queryKey: ["programari", statieId] });
    queryClient.invalidateQueries({ queryKey: ["programari-stats", statieId] });
    // Dashboard-ul e randat pe server (KPI-uri, "Programări azi"), deci are
    // nevoie de refresh ca sa reflecte programarea tocmai salvata.
    router.refresh();
  }

  return (
    <>
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Calendar programări
            </CardTitle>

            <div className="flex items-center gap-2">
              <button
                onClick={() => deschideProgramareNoua()}
                className="flex items-center gap-1.5 h-8 px-3 bg-[#1877F2] text-white text-xs font-medium rounded-lg hover:bg-[#1565D8] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Programare nouă
              </button>
              <Link
                href="/programari"
                className="hidden sm:flex items-center gap-1 text-xs font-medium text-[#6B7280] hover:text-[#111318] transition-colors"
              >
                Vezi toate
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ProgramariCalendar
            statieId={statieId}
            onSelectProgramare={(id) => setProgramareSelectata(id)}
            onAddProgramare={(data, ora) => deschideProgramareNoua(data, ora)}
          />
        </CardContent>
      </Card>

      <ProgramareNouaDrawer
        open={drawerNouDeschis}
        onClose={() => setDrawerNouDeschis(false)}
        statieId={statieId}
        defaultDate={dataNoua}
        defaultTime={oraNoua}
        onSuccess={() => {
          setDrawerNouDeschis(false);
          reincarcaDatele();
        }}
      />

      <ProgramareDrawer
        programareId={programareSelectata}
        onClose={() => setProgramareSelectata(null)}
        onUpdate={reincarcaDatele}
      />
    </>
  );
}
