"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Phone, Car, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { programareBadge } from "./programari-client";

type Status = "programat" | "in_lucru" | "finalizat" | "anulat" | "neprezent";

interface ProgramareCardProps {
  programare: {
    id: string;
    ora_start: string;
    ora_sfarsit: string;
    status: Status;
    tip_serviciu: string;
    pret: number | null;
    observatii: string | null;
    sms_confirmare_trimis: boolean;
    client: {
      id: string;
      nume: string;
      prenume: string | null;
      telefon: string;
      email: string | null;
    } | null;
    vehicul: {
      id: string;
      nr_inmatriculare: string;
      marca: string | null;
      model: string | null;
      expirare_itp: string | null;
    } | null;
    rezultate_itp?: { rezultat: string }[] | { rezultat: string } | null;
  };
  onClick: () => void;
}

export function ProgramareCard({ programare: p, onClick }: ProgramareCardProps) {
  const rezultat = Array.isArray(p.rezultate_itp)
    ? p.rezultate_itp[0]?.rezultat ?? null
    : p.rezultate_itp?.rezultat ?? null;
  const status = programareBadge(p.status, rezultat);

  const numeClient = p.client
    ? `${p.client.nume}${p.client.prenume ? " " + p.client.prenume : ""}`
    : "Client necunoscut";

  const vehiculInfo = p.vehicul
    ? `${p.vehicul.nr_inmatriculare}${
        p.vehicul.marca ? ` ${p.vehicul.marca} ${p.vehicul.model ?? ""}`.trim() : ""
      }`
    : "Vehicul necunoscut";

  return (
    <Card
      onClick={onClick}
      className={cn(
        "border-border shadow-none transition-all hover:border-primary/40 hover:shadow-sm cursor-pointer",
        p.status === "finalizat" && "opacity-70",
        p.status === "anulat" && "opacity-50"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Ora */}
          <div className="shrink-0 text-center min-w-[52px]">
            <p className="text-sm font-semibold text-foreground font-mono">
              {p.ora_start.slice(0, 5)}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {p.ora_sfarsit.slice(0, 5)}
            </p>
          </div>

          {/* Separator vertical */}
          <div className="w-px self-stretch bg-border" />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {numeClient}
              </p>
              <Badge className={cn("text-xs border shrink-0", status.className)}>
                {status.label}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {p.client?.telefon && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {p.client.telefon}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Car className="h-3 w-3" />
                {vehiculInfo}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {p.tip_serviciu}
              </span>
              {p.pret && (
                <span className="font-medium text-foreground">
                  {p.pret.toLocaleString("ro-RO")} RON
                </span>
              )}
            </div>

            {p.observatii && (
              <p className="text-xs text-muted-foreground mt-1.5 italic truncate">
                {p.observatii}
              </p>
            )}
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
