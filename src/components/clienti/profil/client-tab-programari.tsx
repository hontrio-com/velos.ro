import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import { Calendar, Car } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface ClientTabProgramariProps {
  programari: Programare[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
  programat: {
    label: "Programat",
    className: "bg-[#EFF6FF] text-[#1877F2]",
  },
  in_lucru: {
    label: "În lucru",
    className: "bg-amber-50 text-amber-700",
  },
  finalizat: {
    label: "Finalizat",
    className: "bg-[#DCFCE7] text-[#15803D]",
  },
  anulat: {
    label: "Anulat",
    className: "bg-[#F3F4F6] text-[#9CA3AF]",
  },
  neprezent: {
    label: "Neprezent",
    className: "bg-red-50 text-red-500",
  },
};

export function ClientTabProgramari({ programari }: ClientTabProgramariProps) {
  if (programari.length === 0) {
    return (
      <div className="bg-white border border-[#F3F4F6] rounded-xl py-16 flex flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6] mb-3">
          <Calendar className="h-5 w-5 text-[#9CA3AF]" />
        </div>
        <p className="text-sm font-medium text-[#374151]">
          Nicio programare înregistrată
        </p>
        <p className="text-xs text-[#9CA3AF] mt-1">
          Programările acestui client vor apărea aici
        </p>
      </div>
    );
  }

  // Group by year
  const byYear = programari.reduce<Record<string, Programare[]>>((acc, p) => {
    const year = p.data_programare.slice(0, 4);
    if (!acc[year]) acc[year] = [];
    acc[year].push(p);
    return acc;
  }, {});

  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="space-y-6">
      {years.map((year) => (
        <div key={year}>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">
            {year}
          </p>
          <div className="bg-white border border-[#F3F4F6] rounded-xl overflow-hidden divide-y divide-[#F9FAFB]">
            {byYear[year].map((p) => {
              const status = statusConfig[p.status] ?? {
                label: p.status,
                className: "bg-[#F3F4F6] text-[#9CA3AF]",
              };
              return (
                <Link
                  key={p.id}
                  href={`/programari?id=${p.id}`}
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-[#F9FAFB] transition-colors"
                >
                  {/* Date */}
                  <div className="shrink-0 w-12 text-center">
                    <p className="text-lg font-semibold text-[#111318] leading-none">
                      {format(parseISO(p.data_programare + "T12:00:00"), "dd")}
                    </p>
                    <p className="text-[10px] text-[#9CA3AF] uppercase">
                      {format(parseISO(p.data_programare + "T12:00:00"), "MMM", {
                        locale: ro,
                      })}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-8 bg-[#F3F4F6] shrink-0" />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#111318] truncate">
                        {p.tip_serviciu ?? "Serviciu ITP"}
                      </p>
                      {p.ora_start && (
                        <span className="text-xs text-[#9CA3AF] shrink-0">
                          {p.ora_start.slice(0, 5)}
                        </span>
                      )}
                    </div>
                    {p.vehicul && (
                      <p className="flex items-center gap-1 text-xs text-[#9CA3AF] mt-0.5">
                        <Car className="h-3 w-3" />
                        <span className="font-mono">
                          {p.vehicul.nr_inmatriculare}
                        </span>
                        {(p.vehicul.marca || p.vehicul.model) && (
                          <span>
                            ·{" "}
                            {[p.vehicul.marca, p.vehicul.model]
                              .filter(Boolean)
                              .join(" ")}
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Right side */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium",
                        status.className
                      )}
                    >
                      {status.label}
                    </span>
                    {p.pret != null && p.pret > 0 && (
                      <span className="text-xs text-[#374151] font-medium">
                        {p.pret.toLocaleString("ro-RO")} RON
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
