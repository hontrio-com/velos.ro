"use client";

import { useState } from "react";
import { useQueryState } from "nuqs";
import { format, parseISO, differenceInDays, isValid } from "date-fns";
import { ro } from "date-fns/locale";
import { Download, FileText, Loader2, DollarSign, CalendarDays, ShieldCheck, MessageSquare, Users, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "./date-range-picker";
import { TabFinanciar } from "./tab-financiar";
import { TabProgramari } from "./tab-programari";
import { TabItp } from "./tab-itp";
import { TabVehicule } from "./tab-vehicule";
import { TabSms } from "./tab-sms";
import { TabAngajati } from "./tab-angajati";
import {
  useRaportFinanciar,
  useRaportProgramari,
  useRaportItp,
  useRaportVehicule,
  useRaportSms,
} from "@/hooks/use-rapoarte";
import { getRaportAngajatiAction } from "@/lib/actions/rapoarte";

type Tab = "financiar" | "programari" | "itp" | "vehicule" | "sms" | "angajati";

const TABS: Tab[] = ["financiar", "programari", "itp", "vehicule", "sms", "angajati"];

interface RapoarteClientProps {
  statieId: string;
  statieNume: string;
  statieSlug: string;
  profileId: string;
}

export function RapoarteClient({
  statieId,
  statieNume,
  statieSlug,
  profileId,
}: RapoarteClientProps) {
  const [fromParam] = useQueryState("from");
  const [toParam] = useQueryState("to");
  const [tab, setTab] = useQueryState<Tab>("tab", {
    defaultValue: "financiar",
    parse: (v) => (TABS.includes(v as Tab) ? (v as Tab) : "financiar"),
    serialize: (v) => v,
  });

  const [loadingPdf, setLoadingPdf] = useState(false);

  const fromDate = fromParam && isValid(parseISO(fromParam)) ? parseISO(fromParam) : undefined;
  const toDate = toParam && isValid(parseISO(toParam)) ? parseISO(toParam) : undefined;

  const from = fromDate ? format(fromDate, "yyyy-MM-dd") : format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");
  const to = toDate ? format(toDate, "yyyy-MM-dd") : format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd");

  const days = differenceInDays(parseISO(to), parseISO(from)) + 1;

  // Prefetch data for export
  const { data: finData } = useRaportFinanciar(statieId, from, to);
  const { data: progData } = useRaportProgramari(statieId, from, to);
  const { data: itpData } = useRaportItp(statieId, from, to);
  const { data: vehData } = useRaportVehicule(statieId, from, to);
  const { data: smsData } = useRaportSms(statieId, profileId, from, to);

  async function handleExportCsv() {
    const range = { from, to };
    const slug = statieSlug;

    if (tab === "financiar" && finData?.zilnic) {
      const { exportCsvFinanciar } = await import("./export/export-csv");
      exportCsvFinanciar(finData.zilnic, slug, range);
    } else if (tab === "programari" && progData?.zilnic) {
      const { exportCsvProgramari } = await import("./export/export-csv");
      exportCsvProgramari(progData.zilnic, slug, range);
    } else if (tab === "itp" && itpData?.lista) {
      const { exportCsvItp } = await import("./export/export-csv");
      exportCsvItp(itpData.lista, slug, range);
    } else if (tab === "vehicule" && vehData?.lista) {
      const { exportCsvVehicule } = await import("./export/export-csv");
      exportCsvVehicule(vehData.lista, slug, range);
    } else if (tab === "sms" && smsData?.lista) {
      const { exportCsvSms } = await import("./export/export-csv");
      exportCsvSms(smsData.lista, slug, range);
    } else if (tab === "angajati") {
      const result = await getRaportAngajatiAction(statieId);
      if (result?.angajati) {
        const { exportCsvAngajati } = await import("./export/export-csv");
        exportCsvAngajati(result.angajati, slug, range);
      }
    }
  }

  async function handleExportPdf() {
    setLoadingPdf(true);
    try {
      const [{ pdf }, { RaportPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./export/export-pdf"),
      ]);

      // Fetch any missing data
      const angData = await getRaportAngajatiAction(statieId, from, to);

      const blob = await pdf(
        RaportPdfDocument({
          statie: statieNume,
          statieSlug,
          from,
          to,
          financiar: finData ?? null,
          programari: progData ?? null,
          itp: itpData ?? null,
          vehicule: vehData ?? null,
          sms: smsData ?? null,
          angajati: angData,
        })
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Raport-${statieSlug}-${from}-${to}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF error:", err);
    } finally {
      setLoadingPdf(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-[#9CA3AF]">
            {format(parseISO(from), "d MMM yyyy", { locale: ro })} —{" "}
            {format(parseISO(to), "d MMM yyyy", { locale: ro })} · {days} zile · {statieNume}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangePicker />
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleExportCsv}>
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
          <Button
            size="sm"
            className="h-9 gap-1.5 bg-[#1877F2] hover:bg-[#1565D8]"
            onClick={handleExportPdf}
            disabled={loadingPdf}
          >
            {loadingPdf ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                PDF...
              </>
            ) : (
              <>
                <FileText className="h-3.5 w-3.5" />
                PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Warning for large ranges */}
      {days > 365 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
          Rapoartele pentru perioade mai mari de 1 an pot fi lente.
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="flex overflow-x-auto border-b border-[#E5E7EB]" style={{ scrollbarWidth: "none" }}>
          {([
            { value: "financiar",  label: "Financiar",  icon: DollarSign  },
            { value: "programari", label: "Programări", icon: CalendarDays },
            { value: "itp",        label: "ITP",         icon: ShieldCheck  },
            { value: "vehicule",   label: "Vehicule",    icon: Car          },
            { value: "sms",        label: "SMS",         icon: MessageSquare },
            { value: "angajati",   label: "Angajați",   icon: Users        },
          ] as const).map(({ value, label, icon: Icon }) => {
            const isActive = (tab ?? "financiar") === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value as Tab)}
                className={[
                  "relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                  "border-b-2 -mb-px focus-visible:outline-none",
                  isActive
                    ? "text-[#1877F2] border-[#1877F2] bg-white"
                    : "text-[#6B7280] border-transparent hover:text-[#111318] hover:bg-[#F9FAFB]",
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        <div className="p-5">
          {(tab ?? "financiar") === "financiar"  && <TabFinanciar statieId={statieId} from={from} to={to} />}
          {(tab ?? "financiar") === "programari" && <TabProgramari statieId={statieId} from={from} to={to} />}
          {(tab ?? "financiar") === "itp"        && <TabItp statieId={statieId} from={from} to={to} />}
          {(tab ?? "financiar") === "vehicule"   && <TabVehicule statieId={statieId} from={from} to={to} />}
          {(tab ?? "financiar") === "sms"        && <TabSms statieId={statieId} profileId={profileId} from={from} to={to} />}
          {(tab ?? "financiar") === "angajati"   && <TabAngajati statieId={statieId} from={from} to={to} />}
        </div>
      </div>
    </div>
  );
}
