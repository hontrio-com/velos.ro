"use client";

import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  parseISO,
  startOfMonth,
  endOfMonth,
  addDays,
  subDays,
} from "date-fns";
import { ro } from "date-fns/locale";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  type CalendarProps,
} from "react-big-calendar";
import type { View, SlotInfo, Event as RBCEvent } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales: { ro },
});

const messages = {
  today: "Azi",
  previous: "←",
  next: "→",
  month: "Lună",
  week: "Săptămână",
  day: "Zi",
  agenda: "Agendă",
  date: "Data",
  time: "Ora",
  event: "Eveniment",
  noEventsInRange: "Nicio programare în această perioadă.",
  showMore: (total: number) => `+${total} mai mult`,
};

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  programat:  { bg: "#EFF6FF", border: "#1877F2", text: "#1877F2" },
  in_lucru:   { bg: "#FFFBEB", border: "#D97706", text: "#B45309" },
  finalizat:  { bg: "#DCFCE7", border: "#16A34A", text: "#15803D" },
  anulat:     { bg: "#F9FAFB", border: "#D1D5DB", text: "#9CA3AF" },
  neprezent:  { bg: "#FEF2F2", border: "#EF4444", text: "#DC2626" },
};

interface ProgramareRow {
  id: string;
  data_programare: string;
  ora_start: string;
  ora_sfarsit: string;
  status: string;
  tip_serviciu: string;
  client: { id: string; nume: string; prenume: string | null } | null;
  vehicul: { id: string; nr_inmatriculare: string } | null;
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
  const [view, setView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Compute query range based on view
  const rangeStart = (() => {
    if (view === Views.MONTH) {
      return format(
        subDays(startOfMonth(currentDate), 7),
        "yyyy-MM-dd"
      );
    }
    if (view === Views.WEEK) {
      return format(
        startOfWeek(currentDate, { weekStartsOn: 1 }),
        "yyyy-MM-dd"
      );
    }
    return format(currentDate, "yyyy-MM-dd");
  })();

  const rangeEnd = (() => {
    if (view === Views.MONTH) {
      return format(
        addDays(endOfMonth(currentDate), 7),
        "yyyy-MM-dd"
      );
    }
    if (view === Views.WEEK) {
      return format(
        addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6),
        "yyyy-MM-dd"
      );
    }
    return format(currentDate, "yyyy-MM-dd");
  })();

  const { data: programari } = useQuery<ProgramareRow[]>({
    queryKey: ["programari-calendar", statieId, rangeStart, rangeEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programari")
        .select(
          "id, data_programare, ora_start, ora_sfarsit, status, tip_serviciu, client:clienti(id, nume, prenume), vehicul:vehicule(id, nr_inmatriculare)"
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
    const c = STATUS_COLORS[event.resource.status] ?? STATUS_COLORS.programat;
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
      const isTimeSpecific =
        view === Views.WEEK || view === Views.DAY;
      const timeStr = isTimeSpecific
        ? format(slotInfo.start, "HH:mm")
        : undefined;
      onAddProgramare(dateStr, timeStr);
    },
    [view, onAddProgramare]
  );

  return (
    <div className="bg-white border border-[#F3F4F6] rounded-xl overflow-hidden rbc-wrapper">
      <style>{`
        .rbc-wrapper .rbc-calendar { font-family: inherit; }
        .rbc-wrapper .rbc-header { padding: 8px 0; font-size: 12px; font-weight: 500; color: #6B7280; border-bottom: 1px solid #F3F4F6; background: #F9FAFB; }
        .rbc-wrapper .rbc-month-view { border: none; }
        .rbc-wrapper .rbc-month-row { border-top: 1px solid #F3F4F6; }
        .rbc-wrapper .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #F3F4F6; }
        .rbc-wrapper .rbc-off-range-bg { background: #FAFAFA; }
        .rbc-wrapper .rbc-today { background: #EFF6FF; }
        .rbc-wrapper .rbc-date-cell { padding: 4px 8px; font-size: 12px; color: #374151; }
        .rbc-wrapper .rbc-date-cell.rbc-now { font-weight: 600; color: #1877F2; }
        .rbc-wrapper .rbc-toolbar { padding: 12px 16px; border-bottom: 1px solid #F3F4F6; background: white; }
        .rbc-wrapper .rbc-toolbar button { font-size: 12px; font-weight: 500; color: #374151; border: 1px solid #E5E7EB; border-radius: 6px; padding: 4px 10px; background: white; cursor: pointer; transition: all 0.1s; }
        .rbc-wrapper .rbc-toolbar button:hover { background: #F9FAFB; }
        .rbc-wrapper .rbc-toolbar button.rbc-active { background: #1877F2; color: white; border-color: #1877F2; }
        .rbc-wrapper .rbc-toolbar-label { font-size: 14px; font-weight: 600; color: #111318; }
        .rbc-wrapper .rbc-time-view { border: none; }
        .rbc-wrapper .rbc-time-header { border-bottom: 1px solid #F3F4F6; }
        .rbc-wrapper .rbc-time-content { border-top: none; }
        .rbc-wrapper .rbc-time-slot { font-size: 11px; color: #9CA3AF; }
        .rbc-wrapper .rbc-current-time-indicator { background: #1877F2; }
        .rbc-wrapper .rbc-event { box-shadow: none; outline: none; }
        .rbc-wrapper .rbc-event:focus { outline: none; }
        .rbc-wrapper .rbc-show-more { font-size: 11px; color: #1877F2; font-weight: 500; background: transparent; }
        .rbc-wrapper .rbc-agenda-view table { font-size: 13px; }
        .rbc-wrapper .rbc-time-gutter .rbc-timeslot-group { border-bottom: 1px solid #F3F4F6; }
        .rbc-wrapper .rbc-timeslot-group { border-bottom: 1px solid #F3F4F6; }
        .rbc-wrapper .rbc-day-slot .rbc-time-slot { border-top: 1px solid #F9FAFB; }
        .rbc-wrapper .rbc-day-slot .rbc-timeslot-group { border-bottom: 1px solid #F3F4F6; }
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
        messages={messages}
        culture="ro"
        style={{ height: 620 }}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        step={30}
        timeslots={2}
        min={new Date(0, 0, 0, 7, 0, 0)}
        max={new Date(0, 0, 0, 20, 0, 0)}
        formats={{
          dayHeaderFormat: (date: Date) =>
            format(date, "EEEE, d MMM", { locale: ro }),
          dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${format(start, "d MMM", { locale: ro })} – ${format(end, "d MMM yyyy", { locale: ro })}`,
          monthHeaderFormat: (date: Date) => {
            const s = format(date, "MMMM yyyy", { locale: ro });
            return s.charAt(0).toUpperCase() + s.slice(1);
          },
          timeGutterFormat: (date: Date) => format(date, "HH:mm"),
          eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${format(start, "HH:mm")}–${format(end, "HH:mm")}`,
        }}
      />
    </div>
  );
}

export type { CalendarEvent };
