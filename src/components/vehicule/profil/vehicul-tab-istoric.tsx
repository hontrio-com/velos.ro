"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import {
  CalendarDays, FileText, ShieldCheck, CheckCircle2,
  XCircle, RefreshCw, Loader2, History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  vehiculId: string;
  statieId: string;
  nrInmatriculare: string;
}

interface TimelineEvent {
  id: string;
  type: "programare" | "itp" | "document";
  date: string;
  title: string;
  subtitle?: string;
  status?: string;
  badge?: string;
  badgeColor?: string;
}

const STATUS_CONFIG = {
  programat:  { label: "Programat",  color: "#1877F2" },
  in_lucru:   { label: "În lucru",   color: "#F59E0B" },
  finalizat:  { label: "Finalizat",  color: "#16A34A" },
  anulat:     { label: "Anulat",     color: "#DC2626" },
  neprezent:  { label: "Neprezent",  color: "#9CA3AF" },
};

const ITP_CONFIG = {
  admis:   { label: "Admis",   color: "#16A34A", icon: CheckCircle2 },
  respins: { label: "Respins", color: "#DC2626", icon: XCircle },
  readmis: { label: "Readmis", color: "#2563EB", icon: RefreshCw },
};

function EventIcon({ type, status }: { type: TimelineEvent["type"]; status?: string }) {
  if (type === "itp") {
    const cfg = ITP_CONFIG[status as keyof typeof ITP_CONFIG] ?? ITP_CONFIG.admis;
    const Icon = cfg.icon;
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white shadow-sm ring-1 ring-[#E5E7EB]">
        <Icon className="h-4 w-4" style={{ color: cfg.color }} />
      </div>
    );
  }
  if (type === "document") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#EFF6FF] shadow-sm ring-1 ring-[#BFDBFE]">
        <FileText className="h-4 w-4 text-[#1877F2]" />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white shadow-sm ring-1 ring-[#E5E7EB]">
      <CalendarDays className="h-4 w-4 text-[#6B7280]" />
    </div>
  );
}

export function VehiculTabIstoric({ vehiculId, statieId, nrInmatriculare }: Props) {
  const supabase = createClient();

  const { data: events = [], isLoading } = useQuery<TimelineEvent[]>({
    queryKey: ["vehicul-istoric", vehiculId],
    queryFn: async () => {
      const [{ data: programari }, { data: documente }] = await Promise.all([
        supabase
          .from("programari")
          .select(`
            id, data_programare, ora_start, status, tip_serviciu, pret, observatii,
            angajat:angajati(nume),
            rezultate_itp(rezultat, data_inspectie, expirare_noua, inspector, observatii_tehnice)
          `)
          .eq("vehicul_id", vehiculId)
          .order("data_programare", { ascending: false })
          .limit(100),
        supabase
          .from("documente_vehicule")
          .select("id, titlu, tip_document, categorie, data_document, created_at")
          .eq("vehicul_id", vehiculId)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      const timeline: TimelineEvent[] = [];

      for (const p of programari ?? []) {
        const angajat = Array.isArray(p.angajat) ? p.angajat[0] : p.angajat;
        const statusCfg = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG];
        const rezultate = Array.isArray(p.rezultate_itp) ? p.rezultate_itp : [];

        timeline.push({
          id: p.id,
          type: "programare",
          date: p.data_programare,
          title: `${p.tip_serviciu} — ${p.ora_start.slice(0, 5)}`,
          subtitle: [
            angajat?.nume ? `Inspector: ${angajat.nume}` : null,
            p.pret ? `${Number(p.pret).toLocaleString("ro-RO")} RON` : null,
            p.observatii ?? null,
          ].filter(Boolean).join(" · ") || undefined,
          status: p.status,
          badge: statusCfg?.label,
          badgeColor: statusCfg?.color,
        });

        for (const rez of rezultate) {
          const itpCfg = ITP_CONFIG[rez.rezultat as keyof typeof ITP_CONFIG];
          timeline.push({
            id: `${p.id}-itp`,
            type: "itp",
            date: rez.data_inspectie,
            title: `ITP ${itpCfg?.label ?? rez.rezultat}`,
            subtitle: [
              rez.expirare_noua ? `Expiră: ${format(parseISO(rez.expirare_noua), "d MMM yyyy", { locale: ro })}` : null,
              rez.inspector ? `Inspector: ${rez.inspector}` : null,
              rez.observatii_tehnice ?? null,
            ].filter(Boolean).join(" · ") || undefined,
            status: rez.rezultat,
            badge: itpCfg?.label,
            badgeColor: itpCfg?.color,
          });
        }
      }

      for (const d of documente ?? []) {
        timeline.push({
          id: `doc-${d.id}`,
          type: "document",
          date: d.data_document ?? d.created_at.split("T")[0],
          title: d.titlu,
          subtitle: d.tip_document,
          badge: d.tip_document,
          badgeColor: "#6B7280",
        });
      }

      // Sort by date desc
      return timeline.sort((a, b) => b.date.localeCompare(a.date));
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-xl py-16 flex flex-col items-center text-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F8FA]">
          <History className="h-6 w-6 text-[#9CA3AF]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#111318]">Niciun eveniment înregistrat</p>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Programările, rezultatele ITP și documentele vor apărea aici cronologic.
          </p>
        </div>
      </div>
    );
  }

  // Group by year-month
  const byMonth: Record<string, TimelineEvent[]> = {};
  for (const e of events) {
    const key = e.date.slice(0, 7);
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(e);
  }

  return (
    <div className="space-y-6">
      {Object.entries(byMonth).map(([monthKey, evs]) => (
        <div key={monthKey}>
          {/* Month header */}
          <div className="flex items-center gap-3 mb-3">
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
              {format(parseISO(monthKey + "-01"), "MMMM yyyy", { locale: ro })}
            </p>
            <div className="flex-1 h-px bg-[#F7F8FA]" />
            <span className="text-xs text-[#9CA3AF]">{evs.length}</span>
          </div>

          {/* Events */}
          <div className="relative pl-10">
            {/* Vertical line */}
            <div className="absolute left-3.5 top-0 bottom-0 w-px bg-[#F7F8FA]" />

            <div className="space-y-3">
              {evs.map((ev) => (
                <div key={ev.id} className="relative">
                  {/* Icon */}
                  <div className="absolute -left-[26px] top-0">
                    <EventIcon type={ev.type} status={ev.status} />
                  </div>

                  {/* Card */}
                  <div className="bg-white border border-[#E5E7EB] rounded-xl px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#111318]">{ev.title}</p>
                        {ev.subtitle && (
                          <p className="text-xs text-[#6B7280] mt-0.5 truncate">{ev.subtitle}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {ev.badge && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                            style={{ backgroundColor: ev.badgeColor ?? "#9CA3AF" }}
                          >
                            {ev.badge}
                          </span>
                        )}
                        <span className="text-[11px] text-[#9CA3AF]">
                          {format(parseISO(ev.date + "T12:00:00"), "d MMM", { locale: ro })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
