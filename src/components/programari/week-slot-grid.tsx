"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  format,
  addDays,
  startOfWeek,
  startOfDay,
  isBefore,
  isSameDay,
  getDay,
} from "date-fns";
import { ro } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ZILE_MAP: Record<number, string> = {
  1: "luni",
  2: "marti",
  3: "miercuri",
  4: "joi",
  5: "vineri",
  6: "sambata",
  0: "duminica",
};

type ProgramLucru = Record<string, { start: string; end: string } | null>;

interface WeekSlotGridProps {
  statieId: string;
  /** Data selectată, format yyyy-MM-dd (sau "" dacă nimic). */
  selectedDate: string;
  /** Ora selectată, format HH:mm (sau null). */
  selectedSlot: string | null;
  /** Apelat la click pe un slot liber. */
  onSelect: (date: string, slot: string) => void;
  /** Nu permite programări mai departe de atâtea zile. */
  maxDaysAhead?: number;
  /** Programarea curentă (la editare) nu ocupă slot. */
  excludeProgramareId?: string;
}

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fromMin(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function WeekSlotGrid({
  statieId,
  selectedDate,
  selectedSlot,
  onSelect,
  maxDaysAhead = 90,
  excludeProgramareId,
}: WeekSlotGridProps) {
  const supabase = createClient();
  const today = startOfDay(new Date());
  const maxDate = addDays(today, maxDaysAhead);

  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const rangeStart = format(days[0], "yyyy-MM-dd");
  const rangeEnd = format(days[6], "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["week-slots", statieId, rangeStart, rangeEnd, excludeProgramareId],
    queryFn: async () => {
      const [{ data: statie }, { data: rawProgramari }] = await Promise.all([
        supabase
          .from("statii")
          .select("program_lucru, durata_slot_minute, nr_linii")
          .eq("id", statieId)
          .single(),
        supabase
          .from("programari")
          .select("id, data_programare, ora_start, status")
          .eq("statie_id", statieId)
          .gte("data_programare", rangeStart)
          .lte("data_programare", rangeEnd)
          .neq("status", "anulat"),
      ]);

      const programari = (rawProgramari ?? []).filter(
        (p) => p.id !== excludeProgramareId
      );
      return { statie, programari };
    },
    enabled: !!statieId,
  });

  const statie = data?.statie;
  const programLucru = (statie?.program_lucru as ProgramLucru) ?? null;
  const durata = statie?.durata_slot_minute ?? 30;
  const nrLinii = statie?.nr_linii ?? 1;

  // Câte programări există deja pe fiecare (zi, oră)
  const counts: Record<string, number> = {};
  for (const p of data?.programari ?? []) {
    const key = `${p.data_programare}|${p.ora_start.slice(0, 5)}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }

  // Intervalul orar afișat = reuniunea programului de lucru din săptămână
  let gridStart = Infinity;
  let gridEnd = -Infinity;
  for (const d of days) {
    const prog = programLucru?.[ZILE_MAP[getDay(d)]];
    if (!prog) continue;
    gridStart = Math.min(gridStart, toMin(prog.start));
    gridEnd = Math.max(gridEnd, toMin(prog.end));
  }
  if (!isFinite(gridStart) || !isFinite(gridEnd)) {
    gridStart = 8 * 60;
    gridEnd = 17 * 60;
  }

  const rows: number[] = [];
  for (let t = gridStart; t + durata <= gridEnd; t += durata) rows.push(t);

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const label = `${format(days[0], "d")} – ${format(days[6], "d MMM yyyy", { locale: ro })}`;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
      {/* ── Toolbar ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-[#E5E7EB]">
        <div className="flex items-center rounded-lg overflow-hidden bg-[#1F2A44]">
          <button
            type="button"
            aria-label="Săptămâna anterioară"
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            className="px-2.5 py-1.5 text-white hover:bg-[#33415C] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="w-px self-stretch bg-white/15" />
          <button
            type="button"
            aria-label="Săptămâna următoare"
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="px-2.5 py-1.5 text-white hover:bg-[#33415C] transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          className="rounded-lg bg-[#F3F4F6] px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#E5E7EB] transition-colors"
        >
          Astăzi
        </button>

        <div className="flex-1 text-center text-[13px] font-semibold text-[#111318] truncate">
          {label}
        </div>

        {/* spacer simetric cu grupul de navigare */}
        <div className="w-[68px] shrink-0 hidden sm:block" />
      </div>

      {/* ── Grilă ───────────────────────────────────────── */}
      {isLoading ? (
        <div className="p-4 space-y-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            {/* Header zile */}
            <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] bg-[#FAFBFC] border-b border-[#E5E7EB]">
              <div />
              {days.map((d) => {
                const isToday = isSameDay(d, today);
                return (
                  <div
                    key={d.toISOString()}
                    className={cn(
                      "py-2.5 text-center text-xs font-medium border-l border-[#F3F4F6]",
                      isToday ? "text-[#1877F2] font-semibold" : "text-[#6B7280]"
                    )}
                  >
                    {capitalize(format(d, "EEE", { locale: ro }))} {format(d, "d")}
                  </div>
                );
              })}
            </div>

            {/* Rânduri de sloturi */}
            {rows.map((t) => {
              const slot = fromMin(t);
              const isHourMark = t % 60 === 0;
              return (
                <div
                  key={slot}
                  className={cn(
                    "grid grid-cols-[64px_repeat(7,minmax(0,1fr))]",
                    isHourMark ? "border-t border-[#E5E7EB]" : "border-t border-dashed border-[#F3F4F6]"
                  )}
                >
                  <div className="py-2 pr-2.5 text-right text-[11px] font-medium text-[#1877F2]">
                    {isHourMark ? slot : ""}
                  </div>

                  {days.map((d) => {
                    const dateStr = format(d, "yyyy-MM-dd");
                    const prog = programLucru?.[ZILE_MAP[getDay(d)]];
                    const isToday = isSameDay(d, today);

                    const inProgram =
                      !!prog && t >= toMin(prog.start) && t + durata <= toMin(prog.end);
                    const isPastDay = isBefore(d, today);
                    const isTooFar = isBefore(maxDate, d);
                    const isPastSlot = isToday && t <= nowMin;
                    const taken = counts[`${dateStr}|${slot}`] ?? 0;
                    const full = taken >= nrLinii;

                    const disabled =
                      !inProgram || isPastDay || isTooFar || isPastSlot || full;
                    const isSelected = selectedDate === dateStr && selectedSlot === slot;
                    const libere = nrLinii - taken;

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelect(dateStr, slot)}
                        title={
                          !inProgram
                            ? "Închis"
                            : full
                              ? "Ocupat"
                              : `${slot} — ${libere}/${nrLinii} liber`
                        }
                        className={cn(
                          "h-11 border-l border-[#F3F4F6] text-xs font-medium transition-colors",
                          isSelected
                            ? "bg-[#1877F2] text-white"
                            : !inProgram
                              ? "bg-[#F9FAFB] cursor-not-allowed"
                              : full
                                ? "bg-[#FEF2F2] text-[#DC2626] cursor-not-allowed"
                                : isPastDay || isTooFar || isPastSlot
                                  ? "bg-[#FAFAFA] cursor-not-allowed"
                                  : cn(
                                      "cursor-pointer hover:bg-[#EFF6FF] text-transparent hover:text-[#1877F2]",
                                      isToday && "bg-[#FEFCE8]"
                                    )
                        )}
                      >
                        {isSelected
                          ? slot
                          : full
                            ? "•"
                            : disabled
                              ? ""
                              : slot}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Legendă ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 px-3 py-2 border-t border-[#E5E7EB] bg-[#FAFBFC] text-[11px] text-[#6B7280]">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-[#E5E7EB] bg-white" /> Liber
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-[#FEF2F2] border border-[#FECACA]" /> Ocupat
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-[#F9FAFB] border border-[#E5E7EB]" /> Închis
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-[#1877F2]" /> Selectat
        </span>
        {nrLinii > 1 && (
          <span className="ml-auto">{nrLinii} linii · slot {durata} min</span>
        )}
      </div>
    </div>
  );
}
