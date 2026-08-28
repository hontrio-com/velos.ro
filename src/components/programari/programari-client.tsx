"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchAll } from "@/lib/fetch-all";
import { format } from "date-fns";
import { CalendarDays, Search, Plus, LayoutList, CalendarPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ProgramareCard } from "./programare-card";
import { ProgramariStats } from "./programari-stats";
import { DayNavigator } from "./day-navigator";
import { ProgramareDrawer } from "./programare-drawer";
import { ProgramareNouaDrawer } from "./programare-noua-drawer";
import { ProgramariCalendar } from "./programari-calendar";
import { ProgramareBookingFlow } from "./programare-booking-flow";
import { cn } from "@/lib/utils";

type StatusFilter = "toate" | "programat" | "admis" | "respins" | "neprezent";
type ViewMode = "lista" | "calendar";
type MainTab = "rezervare" | "programari";

export const statusConfig = {
  programat:  { label: "Programat",  className: "bg-[#EFF6FF] text-[#1877F2] border-[#BFDBFE]" },
  in_lucru:   { label: "În lucru",   className: "bg-amber-50 text-amber-700 border-amber-200" },
  finalizat:  { label: "Finalizat",  className: "bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]" },
  anulat:     { label: "Anulat",     className: "bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB]" },
  neprezent:  { label: "Neprezentat", className: "bg-red-50 text-red-600 border-red-200" },
} as const;

/**
 * Badge unic pentru o programare, în funcție de rezultatul ITP (Admis/Respins)
 * dacă există, altfel de status (Programat / Neprezentat / Anulat).
 */
export function programareBadge(
  status: string,
  rezultat?: string | null
): { label: string; className: string } {
  if (rezultat === "admis" || rezultat === "readmis")
    return { label: "Admis", className: "bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]" };
  if (rezultat === "respins")
    return { label: "Respins", className: "bg-red-50 text-red-600 border-red-200" };
  if (status === "neprezent")
    return { label: "Neprezentat", className: "bg-red-50 text-red-600 border-red-200" };
  if (status === "anulat")
    return { label: "Anulat", className: "bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB]" };
  return { label: "Programat", className: "bg-[#EFF6FF] text-[#1877F2] border-[#BFDBFE]" };
}

const STATUS_FILTERS: StatusFilter[] = ["toate", "programat", "admis", "respins", "neprezent"];
const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  toate: "Toate",
  programat: "Programat",
  admis: "Admis",
  respins: "Respins",
  neprezent: "Neprezentat",
};

interface ProgramariClientProps {
  statieId: string;
}

export function ProgramariClient({ statieId }: ProgramariClientProps) {
  const queryClient = useQueryClient();
  const [mainTab, setMainTab] = useState<MainTab>("rezervare");
  const [viewMode, setViewMode] = useState<ViewMode>("lista");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("toate");

  // Drawers
  const [newDrawerOpen, setNewDrawerOpen] = useState(false);
  const [newDrawerDate, setNewDrawerDate] = useState<string | undefined>();
  const [newDrawerTime, setNewDrawerTime] = useState<string | null>(null);
  const [detailDrawerProgramareId, setDetailDrawerProgramareId] = useState<string | null>(null);

  const supabase = createClient();

  // On mount: jump to next day that has appointments if today is empty
  useEffect(() => {
    const azi = format(new Date(), "yyyy-MM-dd");
    supabase
      .from("programari")
      .select("data_programare")
      .eq("statie_id", statieId)
      .gte("data_programare", azi)
      .order("data_programare")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data?.data_programare && data.data_programare !== azi) {
          setSelectedDate(data.data_programare);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statieId]);

  const { data: programari, isLoading } = useQuery({
    queryKey: ["programari", statieId, selectedDate],
    queryFn: async () => {
      return fetchAll((from, to) =>
        supabase
          .from("programari")
          .select(`
            id, ora_start, ora_sfarsit, status, tip_serviciu, pret, observatii,
            sms_confirmare_trimis, sms_reminder_trimis,
            client:clienti(id, nume, prenume, telefon, email),
            vehicul:vehicule(id, nr_inmatriculare, marca, model, expirare_itp),
            rezultate_itp(rezultat)
          `)
          .eq("statie_id", statieId)
          .eq("data_programare", selectedDate)
          .order("ora_start")
          .order("id", { ascending: true })
          .range(from, to)
      );
    },
    enabled: viewMode === "lista",
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["programari", statieId] });
    queryClient.invalidateQueries({ queryKey: ["programari-stats", statieId] });
    queryClient.invalidateQueries({ queryKey: ["programari-calendar", statieId] });
  }

  function rezultatOf(p: { rezultate_itp?: unknown }): string | null {
    const r = p.rezultate_itp;
    if (Array.isArray(r)) return (r[0] as { rezultat?: string })?.rezultat ?? null;
    return (r as { rezultat?: string } | null)?.rezultat ?? null;
  }

  const filtered = programari?.filter((p) => {
    // Status / rezultat filter
    if (statusFilter !== "toate") {
      const rez = rezultatOf(p);
      if (statusFilter === "admis" && !(rez === "admis" || rez === "readmis")) return false;
      if (statusFilter === "respins" && rez !== "respins") return false;
      if (statusFilter === "neprezent" && p.status !== "neprezent") return false;
      if (statusFilter === "programat" && p.status !== "programat") return false;
    }

    if (!search) return true;
    const q = search.toLowerCase();
    const client = p.client;
    const vehicul = p.vehicul;
    return (
      client?.nume?.toLowerCase().includes(q) ||
      client?.prenume?.toLowerCase().includes(q) ||
      client?.telefon?.includes(q) ||
      vehicul?.nr_inmatriculare?.toLowerCase().includes(q)
    );
  });

  function openNewDrawer(date?: string, time?: string | null) {
    setNewDrawerDate(date ?? selectedDate);
    setNewDrawerTime(time ?? null);
    setNewDrawerOpen(true);
  }

  return (
    <>
      {/* Main tab switch: booking flow vs. management */}
      <div className="flex items-center rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-0.5 mb-4 w-fit">
        <button
          onClick={() => setMainTab("rezervare")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors",
            mainTab === "rezervare"
              ? "bg-white shadow-sm text-[#111318]"
              : "text-[#9CA3AF] hover:text-[#374151]"
          )}
        >
          <CalendarPlus className="h-3.5 w-3.5" />
          Programare nouă
        </button>
        <button
          onClick={() => setMainTab("programari")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors",
            mainTab === "programari"
              ? "bg-white shadow-sm text-[#111318]"
              : "text-[#9CA3AF] hover:text-[#374151]"
          )}
        >
          <LayoutList className="h-3.5 w-3.5" />
          Toate programările
        </button>
      </div>

      {/* ── BOOKING FLOW (default) ──────────────────────── */}
      {mainTab === "rezervare" && (
        <ProgramareBookingFlow
          statieId={statieId}
          onCreated={(savedDate) => {
            setSelectedDate(savedDate);
            invalidateAll();
          }}
        />
      )}

      {/* ── MANAGEMENT VIEW ─────────────────────────────── */}
      {mainTab === "programari" && (
      <>
      {/* Stats */}
      {viewMode === "lista" && (
        <ProgramariStats statieId={statieId} date={selectedDate} />
      )}

      {/* Toolbar */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Day navigator (only in list mode) */}
          {viewMode === "lista" && (
            <DayNavigator date={selectedDate} onChange={setSelectedDate} />
          )}

          {/* Search */}
          {viewMode === "lista" && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input
                placeholder="Caută client, telefon, nr. înmatriculare..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm border-[#E5E7EB] bg-[#F9FAFB] focus-visible:bg-white"
              />
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {/* View toggle */}
            <div className="flex items-center rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-0.5">
              <button
                onClick={() => setViewMode("lista")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  viewMode === "lista"
                    ? "bg-white shadow-sm text-[#111318]"
                    : "text-[#9CA3AF] hover:text-[#374151]"
                )}
              >
                <LayoutList className="h-3.5 w-3.5" />
                Listă
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  viewMode === "calendar"
                    ? "bg-white shadow-sm text-[#111318]"
                    : "text-[#9CA3AF] hover:text-[#374151]"
                )}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Calendar
              </button>
            </div>

            {/* Add button */}
            <button
              onClick={() => openNewDrawer()}
              className="flex items-center gap-1.5 h-8 px-3 bg-[#1877F2] text-white text-xs font-medium rounded-lg hover:bg-[#1565D8] transition-colors shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Adaugă
            </button>
          </div>
        </div>

        {/* Status filter pills (list mode only) */}
        {viewMode === "lista" && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {STATUS_FILTERS.map((s) => {
              const activeClass =
                s === "toate"
                  ? "bg-[#111318] text-white border-[#111318]"
                  : cn(
                      s === "admis"
                        ? programareBadge("finalizat", "admis").className
                        : s === "respins"
                          ? programareBadge("finalizat", "respins").className
                          : s === "neprezent"
                            ? programareBadge("neprezent").className
                            : programareBadge("programat").className,
                      "border"
                    );
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                    statusFilter === s
                      ? activeClass
                      : "bg-transparent text-[#9CA3AF] border-[#E5E7EB] hover:border-[#E5E7EB] hover:text-[#374151]"
                  )}
                >
                  {STATUS_FILTER_LABELS[s]}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── LIST VIEW ───────────────────────────────────── */}
      {viewMode === "lista" && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] text-[#6B7280]">
              {filtered?.length ?? 0}{" "}
              {filtered?.length === 1 ? "programare" : "programări"}
            </p>
            {(filtered?.filter(
              (p) => p.status === "programat" || p.status === "in_lucru"
            ).length ?? 0) > 0 && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1877F2]">
                {filtered!.filter(
                  (p) => p.status === "programat" || p.status === "in_lucru"
                ).length}{" "}
                active
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-2.5">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-[76px] w-full rounded-xl" />
              ))}
            </div>
          ) : filtered && filtered.length > 0 ? (
            <div className="space-y-2.5">
              {filtered.map((p) => (
                <ProgramareCard
                  key={p.id}
                  programare={p}
                  onClick={() => setDetailDrawerProgramareId(p.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="Nicio programare"
              description={
                search
                  ? "Niciun rezultat pentru căutarea ta."
                  : "Nu există programări pentru această dată."
              }
              action={{
                label: "Adaugă programare",
                onClick: () => openNewDrawer(),
              }}
            />
          )}
        </>
      )}

      {/* ── CALENDAR VIEW ───────────────────────────────── */}
      {viewMode === "calendar" && (
        <ProgramariCalendar
          statieId={statieId}
          onSelectProgramare={(id) => setDetailDrawerProgramareId(id)}
          onAddProgramare={(date, time) => openNewDrawer(date, time)}
        />
      )}
      </>
      )}

      {/* New programare drawer */}
      <ProgramareNouaDrawer
        open={newDrawerOpen}
        onClose={() => setNewDrawerOpen(false)}
        statieId={statieId}
        defaultDate={newDrawerDate}
        defaultTime={newDrawerTime}
        onSuccess={(savedDate) => {
          setNewDrawerOpen(false);
          setSelectedDate(savedDate);
          setViewMode("lista");
          invalidateAll();
        }}
      />

      {/* Detail drawer */}
      <ProgramareDrawer
        programareId={detailDrawerProgramareId}
        onClose={() => setDetailDrawerProgramareId(null)}
        onUpdate={invalidateAll}
      />
    </>
  );
}
