"use client";

import { useState } from "react";
import { useQueryState } from "nuqs";
import { format, parseISO, differenceInDays, isValid } from "date-fns";
import { ro } from "date-fns/locale";
import { Download, FileText, Loader2, DollarSign, CalendarDays, ShieldCheck, MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "./date-range-picker";
import { TabFinanciar } from "./tab-financiar";
import { TabProgramari } from "./tab-programari";
import { TabItp } from "./tab-itp";
import { TabSms } from "./tab-sms";
import { TabAngajati } from "./tab-angajati";
import {
  useRaportFinanciar,
  useRaportProgramari,
  useRaportItp,
  useRaportSms,
} from "@/hooks/use-rapoarte";
import { getRaportAngajatiAction } from "@/lib/actions/rapoarte";

type Tab = "financiar" | "programari" | "itp" | "sms" | "angajati";

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
    parse: (v) => (["financiar", "programari", "itp", "sms", "angajati"].includes(v) ? (v as Tab) : "financiar"),
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
      <Tabs value={tab ?? "financiar"} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="bg-white border border-[#E5E7EB] h-9 p-0.5">
          {[
            { value: "financiar", label: "Financiar", icon: DollarSign },
            { value: "programari", label: "Programări", icon: CalendarDays },
            { value: "itp", label: "ITP", icon: ShieldCheck },
            { value: "sms", label: "SMS", icon: MessageSquare },
            { value: "angajati", label: "Angajați", icon: Users },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className={cn(
                "gap-1.5 text-xs h-8 px-3 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#1877F2]"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="financiar" className="mt-4">
          <TabFinanciar statieId={statieId} from={from} to={to} />
        </TabsContent>
        <TabsContent value="programari" className="mt-4">
          <TabProgramari statieId={statieId} from={from} to={to} />
        </TabsContent>
        <TabsContent value="itp" className="mt-4">
          <TabItp statieId={statieId} from={from} to={to} />
        </TabsContent>
        <TabsContent value="sms" className="mt-4">
          <TabSms statieId={statieId} profileId={profileId} from={from} to={to} />
        </TabsContent>
        <TabsContent value="angajati" className="mt-4">
          <TabAngajati statieId={statieId} from={from} to={to} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
