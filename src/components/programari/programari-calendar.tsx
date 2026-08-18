"use client";

import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  format,
  parse,
  startOfWeek,
  endOfWeek,
  getDay,
  parseISO,
  startOfMonth,
  endOfMonth,
  addDays,
  subDays,
} from "date-fns";
import { ro } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  type CalendarProps,
  type ToolbarProps,
} from "react-big-calendar";
import type { View, SlotInfo, Event as RBCEvent } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { cn } from "@/lib/utils";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales: { ro },
});

const messages = {
  today: "Astăzi",
  previous: "‹",
  next: "›",
  month: "Luna",
  week: "Saptamana",
  day: "Zi",
  agenda: "Lista",
  date: "Data",
  time: "Ora",
  event: "Programare",
  noEventsInRange: "Nicio programare în această perioadă.",
  showMore: (total: number) => `+${total}`,
};

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  programat:  { bg: "#EFF6FF", border: "#1877F2", text: "#1877F2" },
  in_lucru:   { bg: "#FFFBEB", border: "#D97706", text: "#B45309" },
  finalizat:  { bg: "#DCFCE7", border: "#16A34A", text: "#15803D" },
  admis:      { bg: "#DCFCE7", border: "#16A34A", text: "#15803D" },
  respins:    { bg: "#FEF2F2", border: "#EF4444", text: "#DC2626" },
  anulat:     { bg: "#F9FAFB", border: "#D1D5DB", text: "#9CA3AF" },
  neprezent:  { bg: "#FEF2F2", border: "#EF4444", text: "#DC2626" },
};

/** Cheia de culoare a unei programări: rezultat ITP dacă există, altfel status. */
function badgeKey(status: string, rezultat?: string | null): string {
  if (rezultat === "admis" || rezultat === "readmis") return "admis";
  if (rezultat === "respins") return "respins";
  return status;
}

interface ProgramareRow {
  id: string;
  data_programare: string;
  ora_start: string;
  ora_sfarsit: string;
  status: string;
  tip_serviciu: string;
  client: { id: string; nume: string; prenume: string | null } | null;
  vehicul: { id: string; nr_inmatriculare: string } | null;
  rezultate_itp?: { rezultat: string }[] | { rezultat: string } | null;
}

interface CalendarEvent extends RBCEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: ProgramareRow;
}

// Typed Calendar to avoid generic JSX syntax issues
const TypedCalendar = Calendar as unknown as React.ComponentType<CalendarProps<CalendarEvent>>;

const VIEW_ORDER: View[] = [Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA];

/** Toolbar minimalist: navigare stânga, titlu centrat, comutator view dreapta. */
function CalendarToolbar({ label, onNavigate, onView, view }: ToolbarProps<CalendarEvent>) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 border-b border-[#E5E7EB] bg-white">
      {/* Navigare */}
      <div className="flex items-center rounded-lg overflow-hidden bg-[#1F2A44]">
        <button
          type="button"
          aria-label="Perioada anterioară"
          onClick={() => onNavigate("PREV")}
          className="px-2.5 py-1.5 text-white hover:bg-[#33415C] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="w-px self-stretch bg-white/15" />
        <button
          type="button"
          aria-label="Perioada următoare"
          onClick={() => onNavigate("NEXT")}
          className="px-2.5 py-1.5 text-white hover:bg-[#33415C] transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => onNavigate("TODAY")}
        className="rounded-lg bg-[#F3F4F6] px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#E5E7EB] transition-colors"
      >
        Astăzi
      </button>

      {/* Titlu */}
      <div className="flex-1 text-center text-[13px] sm:text-sm font-semibold text-[#111318] truncate">
        {label}
      </div>

      {/* Comutator view */}
      <div className="flex items-center rounded-lg overflow-hidden bg-[#1F2A44] shrink-0">
        {VIEW_ORDER.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onView(v)}
            className={cn(
              "px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium transition-colors",
              view === v
                ? "bg-[#4A5A7A] text-white"
                : "text-white/85 hover:bg-[#33415C]"
            )}
          >
            {messages[v as keyof typeof messages] as string}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ProgramariCalendarProps {
  statieId: string;
  onSelectProgramare: (id: string) => void;
  onAddProgramare: (date: string, time?: string) => void;
}

export function ProgramariCalendar({
  statieId,
  onSelectProgramare,
  onAddProgramare,
}: ProgramariCalendarProps) {
  const supabase = createClient();
  const [view, setView] = useState<View>(Views.WEEK);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Compute query range based on view
  const rangeStart = (() => {
    if (view === Views.MONTH) {
      return format(subDays(startOfMonth(currentDate), 7), "yyyy-MM-dd");
    }
    if (view === Views.WEEK) {
      return format(startOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
    }
    if (view === Views.AGENDA) {
      return format(currentDate, "yyyy-MM-dd");
    }
    return format(currentDate, "yyyy-MM-dd");
  })();

  const rangeEnd = (() => {
    if (view === Views.MONTH) {
      return format(addDays(endOfMonth(currentDate), 7), "yyyy-MM-dd");
    }
    if (view === Views.WEEK) {
      return format(endOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
    }
    if (view === Views.AGENDA) {
      // agenda implicit RBC = 30 de zile
      return format(addDays(currentDate, 30), "yyyy-MM-dd");
    }
    return format(currentDate, "yyyy-MM-dd");
  })();

  const { data: programari } = useQuery<ProgramareRow[]>({
    queryKey: ["programari-calendar", statieId, rangeStart, rangeEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programari")
        .select(
          "id, data_programare, ora_start, ora_sfarsit, status, tip_serviciu, client:clienti(id, nume, prenume), vehicul:vehicule(id, nr_inmatriculare), rezultate_itp(rezultat)"
        )
        .eq("statie_id", statieId)
        .gte("data_programare", rangeStart)
        .lte("data_programare", rangeEnd);
      if (error) throw error;
      return (data ?? []) as ProgramareRow[];
    },
  });

  const events: CalendarEvent[] = (programari ?? []).map((p) => {
    const client = Array.isArray(p.client) ? p.client[0] : p.client;
    const vehicul = Array.isArray(p.vehicul) ? p.vehicul[0] : p.vehicul;
    const numeClient = client
      ? `${client.nume}${client.prenume ? " " + client.prenume : ""}`
      : "—";
    return {
      id: p.id,
      title: `${vehicul?.nr_inmatriculare ?? "?"} · ${numeClient}`,
      start: parseISO(`${p.data_programare}T${p.ora_start}`),
      end: parseISO(`${p.data_programare}T${p.ora_sfarsit}`),
      resource: { ...p, client, vehicul },
    };
  });

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const r = event.resource.rezultate_itp;
    const rez = Array.isArray(r) ? r[0]?.rezultat ?? null : r?.rezultat ?? null;
    const c = STATUS_COLORS[badgeKey(event.resource.status, rez)] ?? STATUS_COLORS.programat;
    return {
      style: {
        backgroundColor: c.bg,
        borderLeft: `3px solid ${c.border}`,
        borderTop: "none",
        borderRight: "none",
        borderBottom: "none",
        color: c.text,
        fontSize: "11px",
        fontWeight: "500",
        borderRadius: "4px",
        padding: "2px 6px",
      },
    };
  }, []);

  const handleSelectSlot = useCallback(
    (slotInfo: SlotInfo) => {
      const dateStr = format(slotInfo.start, "yyyy-MM-dd");
      const isTimeSpecific = view === Views.WEEK || view === Views.DAY;
      const timeStr = isTimeSpecific ? format(slotInfo.start, "HH:mm") : undefined;
      onAddProgramare(dateStr, timeStr);
    },
    [view, onAddProgramare]
  );

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden rbc-wrapper">
      <style>{`
        .rbc-wrapper .rbc-calendar { font-family: inherit; }

        /* ── Header zile ───────────────────────────── */
        .rbc-wrapper .rbc-header {
          padding: 8px 0;
          font-size: 12px;
          font-weight: 500;
          color: #6B7280;
          border-bottom: 1px solid #E5E7EB;
          border-left: 1px solid #F3F4F6;
          background: #FAFBFC;
        }
        .rbc-wrapper .rbc-header:first-child { border-left: none; }
        .rbc-wrapper .rbc-header a { color: inherit; text-decoration: none; cursor: pointer; }
        .rbc-wrapper .rbc-header.rbc-today { color: #1877F2; font-weight: 600; }

        /* ── Lună ──────────────────────────────────── */
        .rbc-wrapper .rbc-month-view { border: none; }
        .rbc-wrapper .rbc-month-row { border-top: 1px solid #F3F4F6; min-height: 90px; }
        .rbc-wrapper .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #F3F4F6; }
        .rbc-wrapper .rbc-off-range-bg { background: #FCFCFD; }
        .rbc-wrapper .rbc-off-range { color: #D1D5DB; }
        .rbc-wrapper .rbc-date-cell { padding: 6px 8px; font-size: 12px; color: #374151; text-align: left; }
        .rbc-wrapper .rbc-date-cell a { text-decoration: none; color: inherit; }
        .rbc-wrapper .rbc-date-cell.rbc-now { font-weight: 600; color: #1877F2; }

        /* ── Ziua curentă evidențiată (ca în model) ── */
        .rbc-wrapper .rbc-today { background: #FEFCE8; }

        /* ── Vizualizare timp (Zi / Săptămână) ─────── */
        .rbc-wrapper .rbc-time-view { border: none; }
        .rbc-wrapper .rbc-time-view .rbc-allday-cell { display: none; }
        .rbc-wrapper .rbc-time-header { border-bottom: none; }
        .rbc-wrapper .rbc-time-header-content { border-left: none; }
        .rbc-wrapper .rbc-time-content { border-top: 1px solid #E5E7EB; }
        .rbc-wrapper .rbc-time-content > * + * > * { border-left: 1px solid #F3F4F6; }
        .rbc-wrapper .rbc-timeslot-group { border-bottom: 1px solid #E5E7EB; min-height: 52px; }
        .rbc-wrapper .rbc-day-slot .rbc-time-slot { border-top: 1px dotted #F3F4F6; }
        .rbc-wrapper .rbc-time-gutter .rbc-timeslot-group { border-bottom: 1px solid #E5E7EB; }
        .rbc-wrapper .rbc-time-gutter .rbc-time-slot { border-top: none; }
        .rbc-wrapper .rbc-label {
          font-size: 11px;
          color: #1877F2;
          font-weight: 500;
          padding: 0 8px;
        }
        .rbc-wrapper .rbc-time-gutter .rbc-timeslot-group .rbc-time-slot:last-child .rbc-label { display: none; }
        .rbc-wrapper .rbc-current-time-indicator { background: #EF4444; height: 2px; }

        /* ── Evenimente ────────────────────────────── */
        .rbc-wrapper .rbc-event { box-shadow: none; outline: none; }
        .rbc-wrapper .rbc-event:focus { outline: none; }
        .rbc-wrapper .rbc-event-label { display: none; }
        .rbc-wrapper .rbc-show-more { font-size: 11px; color: #1877F2; font-weight: 500; background: transparent; }

        /* ── Listă (agenda) ────────────────────────── */
        .rbc-wrapper .rbc-agenda-view { border: none; padding: 0; }
        .rbc-wrapper .rbc-agenda-view table.rbc-agenda-table { font-size: 13px; border: none; }
        .rbc-wrapper .rbc-agenda-view table.rbc-agenda-table thead > tr > th {
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 500;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          background: #FAFBFC;
          border-bottom: 1px solid #E5E7EB;
        }
        .rbc-wrapper .rbc-agenda-view table.rbc-agenda-table tbody > tr > td {
          padding: 10px 12px;
          border-top: 1px solid #F3F4F6;
          color: #374151;
        }
        .rbc-wrapper .rbc-agenda-view table.rbc-agenda-table tbody > tr:hover { background: #F9FAFB; cursor: pointer; }
        .rbc-wrapper .rbc-agenda-date-cell, .rbc-wrapper .rbc-agenda-time-cell { white-space: nowrap; color: #6B7280; }
        .rbc-wrapper .rbc-agenda-empty { padding: 32px; text-align: center; color: #9CA3AF; font-size: 13px; }
      `}</style>
      <TypedCalendar
        localizer={localizer}
        events={events}
        view={view}
        date={currentDate}
        onView={setView}
        onNavigate={setCurrentDate}
        onSelectEvent={(event: CalendarEvent) => onSelectProgramare(event.id)}
        onSelectSlot={handleSelectSlot}
        selectable
        eventPropGetter={eventStyleGetter}
        components={{ toolbar: CalendarToolbar as unknown as React.ComponentType<ToolbarProps<CalendarEvent>> }}
        messages={messages}
        culture="ro"
        style={{ height: 680 }}
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        step={30}
        timeslots={2}
        scrollToTime={new Date(0, 0, 0, 8, 0, 0)}
        min={new Date(0, 0, 0, 8, 0, 0)}
        max={new Date(0, 0, 0, 19, 0, 0)}
        dayLayoutAlgorithm="no-overlap"
        formats={{
          dayHeaderFormat: (date: Date) =>
            format(date, "EEEE, d MMMM yyyy", { locale: ro }),
          dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${format(start, "d")} – ${format(end, "d MMM yyyy", { locale: ro })}`,
          monthHeaderFormat: (date: Date) => {
            const s = format(date, "MMMM yyyy", { locale: ro });
            return s.charAt(0).toUpperCase() + s.slice(1);
          },
          weekdayFormat: (date: Date) => {
            const s = format(date, "EEE", { locale: ro });
            return s.charAt(0).toUpperCase() + s.slice(1);
          },
          dayFormat: (date: Date) => {
            const s = format(date, "EEE d", { locale: ro });
            return s.charAt(0).toUpperCase() + s.slice(1);
          },
          timeGutterFormat: (date: Date) => format(date, "HH:mm"),
          agendaDateFormat: (date: Date) => format(date, "EEE, d MMM", { locale: ro }),
          agendaTimeFormat: (date: Date) => format(date, "HH:mm"),
          agendaHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${format(start, "d MMM", { locale: ro })} – ${format(end, "d MMM yyyy", { locale: ro })}`,
          eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${format(start, "HH:mm")}–${format(end, "HH:mm")}`,
        }}
      />
    </div>
  );
}

export type { CalendarEvent };
