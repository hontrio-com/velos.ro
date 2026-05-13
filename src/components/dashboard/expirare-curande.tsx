"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight, Phone, ShieldCheck } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Vehicul {
  id: string;
  nr_inmatriculare: string;
  marca: string | null;
  model: string | null;
  expirare_itp: string | null;
  client: { id: string; nume: string; prenume: string | null; telefon: string } | null;
}

interface ExpirareCurandeProps {
  vehiculeExpira: Vehicul[];
  vehiculeExpirate: Vehicul[];
}

function VehiculRow({ v, expired }: { v: Vehicul; expired: boolean }) {
  const expirare = v.expirare_itp ? parseISO(v.expirare_itp + "T12:00:00") : null;
  const zile = expirare ? differenceInDays(expirare, new Date()) : null;

  const badgeClass = expired
    ? "bg-red-100 text-red-700"
    : zile !== null && zile <= 7
    ? "bg-red-100 text-red-700"
    : zile !== null && zile <= 15
    ? "bg-amber-100 text-amber-700"
    : "bg-yellow-50 text-yellow-700";

  const badgeLabel = expired
    ? `Expirat ${zile !== null ? `${Math.abs(zile)}z` : ""}`
    : zile === 0
    ? "Azi"
    : zile === 1
    ? "Maine"
    : `${zile}z`;

  return (
    <li className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground font-mono">
            {v.nr_inmatriculare}
          </p>
          {v.client && (
            <span className="text-xs text-muted-foreground truncate">
              {v.client.nume}
              {v.client.prenume ? ` ${v.client.prenume}` : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span>{[v.marca, v.model].filter(Boolean).join(" ") || "-"}</span>
          {v.client?.telefon && (
            <a
              href={`tel:${v.client.telefon}`}
              className="flex items-center gap-0.5 hover:text-primary transition-colors"
            >
              <Phone className="h-3 w-3" />
              {v.client.telefon}
            </a>
          )}
        </div>
      </div>
      <div className="text-right shrink-0 space-y-0.5">
        {expirare && (
          <p className="text-xs text-muted-foreground">
            {format(expirare, "d MMM yyyy", { locale: ro })}
          </p>
        )}
        <Badge className={cn("text-xs border-0", badgeClass)}>
          {badgeLabel}
        </Badge>
      </div>
    </li>
  );
}

export function ExpirareCurande({
  vehiculeExpira,
  vehiculeExpirate,
}: ExpirareCurandeProps) {
  const totalUrgent = vehiculeExpirate.length + vehiculeExpira.length;

  return (
    <Card className="border-border shadow-none h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            ITP Atentie
            {totalUrgent > 0 && (
              <Badge className="border-0 bg-red-100 text-red-700 text-xs font-medium">
                {totalUrgent}
              </Badge>
            )}
          </CardTitle>
          <Link
            href="/vehicule"
            className="flex items-center gap-1 h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            Toate
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-hidden">
        {totalUrgent === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <ShieldCheck className="h-8 w-8 text-emerald-500/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              Niciun ITP urgent in urmatoarele 30 zile
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {/* Already expired */}
            {vehiculeExpirate.length > 0 && (
              <>
                <li className="px-5 py-1.5 bg-red-50">
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">
                    ITP expirat ({vehiculeExpirate.length})
                  </p>
                </li>
                {vehiculeExpirate.map((v) => (
                  <VehiculRow key={v.id} v={v} expired={true} />
                ))}
              </>
            )}

            {/* Expiring soon */}
            {vehiculeExpira.length > 0 && (
              <>
                {vehiculeExpirate.length > 0 && (
                  <li className="px-5 py-1.5 bg-amber-50">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                      Expira curand ({vehiculeExpira.length})
                    </p>
                  </li>
                )}
                {vehiculeExpira.map((v) => (
                  <VehiculRow key={v.id} v={v} expired={false} />
                ))}
              </>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
