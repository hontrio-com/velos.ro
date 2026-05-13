"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ArrowRight, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig = {
  programat: { label: "Programat", className: "bg-primary/10 text-primary" },
  in_lucru: { label: "In lucru", className: "bg-amber-100 text-amber-700" },
  finalizat: { label: "Finalizat", className: "bg-emerald-100 text-emerald-700" },
  anulat: { label: "Anulat", className: "bg-red-100 text-red-700" },
  neprezent: { label: "Neprezent", className: "bg-gray-100 text-gray-600" },
} as const;

interface Programare {
  id: string;
  ora_start: string;
  ora_sfarsit: string;
  status: keyof typeof statusConfig;
  tip_serviciu: string;
  client: { id: string; nume: string; prenume: string | null; telefon: string } | null;
  vehicul: { id: string; nr_inmatriculare: string; marca: string | null; model: string | null } | null;
}

export function ProgramariAzi({ programari }: { programari: Programare[] }) {
  const finalizate = programari.filter((p) => p.status === "finalizat").length;
  const active = programari.filter(
    (p) => p.status === "programat" || p.status === "in_lucru"
  ).length;
  const progressPct =
    programari.length > 0 ? (finalizate / programari.length) * 100 : 0;

  return (
    <Card className="border-border shadow-none h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Programari azi
            <Badge variant="secondary" className="text-xs font-medium">
              {programari.length}
            </Badge>
          </CardTitle>
          <Link
            href="/programari"
            className="flex items-center gap-1 h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            Toate
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Progress bar */}
        {programari.length > 0 && (
          <div className="space-y-1 mt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{finalizate} finalizate</span>
              <span>{active} ramase</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-hidden">
        {programari.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <CalendarDays className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              Nicio programare pentru azi
            </p>
            <Link
              href="/programari"
              className="mt-3 flex items-center gap-1 h-7 px-3 text-xs font-medium border border-border rounded-md hover:bg-muted transition-colors"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Adauga programare
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {programari.map((p) => {
              const status = statusConfig[p.status];
              const isActive =
                p.status === "programat" || p.status === "in_lucru";
              return (
                <li
                  key={p.id}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3 transition-colors",
                    isActive ? "hover:bg-muted/50" : "opacity-60"
                  )}
                >
                  <div className="shrink-0 text-center">
                    <p className="text-xs font-mono font-semibold text-foreground">
                      {p.ora_start.slice(0, 5)}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {p.ora_sfarsit.slice(0, 5)}
                    </p>
                  </div>

                  <div className="w-px self-stretch bg-border shrink-0" />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {p.client
                        ? `${p.client.nume}${p.client.prenume ? " " + p.client.prenume : ""}`
                        : "Client necunoscut"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">
                        {p.vehicul?.nr_inmatriculare ?? "-"}
                      </span>
                      {p.client?.telefon && (
                        <a
                          href={`tel:${p.client.telefon}`}
                          className="flex items-center gap-0.5 hover:text-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="h-3 w-3" />
                          {p.client.telefon}
                        </a>
                      )}
                    </div>
                  </div>

                  <Badge className={cn("text-xs shrink-0 border-0", status.className)}>
                    {status.label}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
