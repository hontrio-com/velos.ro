"use client";

import { useState } from "react";
import { useQueryState } from "nuqs";
import { differenceInDays, parseISO, format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  Car, ShieldCheck, AlertTriangle, Clock, ChevronLeft,
  FileText, CalendarClock, History, Image, User, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehiculTabProfil } from "./vehicul-tab-profil";
import { VehiculTabDocumente } from "./vehicul-tab-documente";
import { VehiculTabExpirari } from "./vehicul-tab-expirari";
import { VehiculTabIstoric } from "./vehicul-tab-istoric";

type VTab = "profil" | "documente" | "expirari" | "istoric";

export interface VehiculComplet {
  id: string;
  statie_id: string;
  nr_inmatriculare: string;
  marca: string | null;
  model: string | null;
  an_fabricatie: number | null;
  serie_sasiu: string | null;
  vin: string | null;
  culoare: string | null;
  tip_vehicul: string | null;
  combustibil: string | null;
  capacitate_cilindrica: number | null;
  masa_maxima: number | null;
  kilometraj: number | null;
  expirare_itp: string | null;
  expirare_rca: string | null;
  expirare_rovinieta: string | null;
  expirare_revizie: string | null;
  expirare_tahograf: string | null;
  expirare_iscir: string | null;
  tip_proprietar: string | null;
  denumire_firma: string | null;
  cui_firma: string | null;
  observatii: string | null;
  note_interne: string | null;
  created_at: string;
  client: {
    id: string;
    statie_id: string;
    nume: string;
    prenume: string | null;
    telefon: string;
    email: string | null;
    cnp: string | null;
    adresa: string | null;
  } | null;
}

interface Props { vehicul: VehiculComplet }

function getExpiryStatus(date: string | null): "expirat" | "urgent" | "curand" | "ok" | "lipsa" {
  if (!date) return "lipsa";
  const days = differenceInDays(parseISO(date), new Date());
  if (days < 0) return "expirat";
  if (days <= 7) return "urgent";
  if (days <= 30) return "curand";
  return "ok";
}

function StatusPill({ label, date }: { label: string; date: string | null }) {
  const status = getExpiryStatus(date);
  const colors = {
    ok: "bg-[#DCFCE7] text-[#15803D]",
    curand: "bg-amber-100 text-amber-700",
    urgent: "bg-orange-100 text-orange-700",
    expirat: "bg-red-100 text-red-700",
    lipsa: "bg-[#F3F4F6] text-[#9CA3AF]",
  };
  const icons = {
    ok: ShieldCheck,
    curand: Clock,
    urgent: AlertTriangle,
    expirat: AlertTriangle,
    lipsa: Clock,
  };
  const Icon = icons[status];

  return (
    <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium", colors[status])}>
      <Icon className="h-3 w-3 shrink-0" />
      <span>{label}</span>
      {date && status !== "lipsa" && (
        <span className="opacity-75">
          · {differenceInDays(parseISO(date), new Date()) < 0
            ? `exp ${Math.abs(differenceInDays(parseISO(date), new Date()))}z`
            : `${differenceInDays(parseISO(date), new Date())}z`}
        </span>
      )}
    </div>
  );
}

export function VehiculProfilClient({ vehicul }: Props) {
  const [tab, setTab] = useQueryState<VTab>("tab", {
    defaultValue: "profil",
    parse: (v) => (["profil", "documente", "expirari", "istoric"].includes(v) ? v as VTab : "profil"),
    serialize: (v) => v,
  });

  const numeClient = vehicul.client
    ? `${vehicul.client.nume}${vehicul.client.prenume ? " " + vehicul.client.prenume : ""}`
    : "Proprietar necunoscut";

  const titluVehicul = [vehicul.marca, vehicul.model, vehicul.an_fabricatie].filter(Boolean).join(" ");

  return (
    <div className="px-4 lg:px-6 py-4 space-y-5 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
        <Link href="/vehicule" className="hover:text-[#374151] flex items-center gap-1 transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" />
          Vehicule
        </Link>
        <span>/</span>
        <span className="text-[#111318] font-medium">{vehicul.nr_inmatriculare}</span>
      </div>

      {/* Header */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Avatar icon */}
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#EFF6FF] shrink-0">
            <Car className="h-7 w-7 text-[#1877F2]" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-[#111318] tracking-tight">
                  {vehicul.nr_inmatriculare}
                </h1>
                {titluVehicul && (
                  <p className="text-sm text-[#6B7280] mt-0.5">{titluVehicul}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusPill label="ITP" date={vehicul.expirare_itp} />
                <StatusPill label="RCA" date={vehicul.expirare_rca} />
                <StatusPill label="Rovinieta" date={vehicul.expirare_rovinieta} />
              </div>
            </div>

            {/* Owner */}
            {vehicul.client && (
              <Link
                href={`/clienti/${vehicul.client.id}`}
                className="mt-3 inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#1877F2] transition-colors"
              >
                <User className="h-3.5 w-3.5" />
                {numeClient}
                <span className="text-[#9CA3AF]">·</span>
                <span>{vehicul.client.telefon}</span>
                <ExternalLink className="h-3 w-3 opacity-50" />
              </Link>
            )}

            {/* Meta */}
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-[#9CA3AF]">
              {vehicul.tip_vehicul && <span className="capitalize">{vehicul.tip_vehicul}</span>}
              {vehicul.combustibil && <span>· {vehicul.combustibil}</span>}
              {vehicul.capacitate_cilindrica && <span>· {vehicul.capacitate_cilindrica} cc</span>}
              {vehicul.kilometraj && <span>· {vehicul.kilometraj.toLocaleString("ro-RO")} km</span>}
              {vehicul.culoare && <span>· {vehicul.culoare}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab ?? "profil"} onValueChange={(v) => setTab(v as VTab)}>
        <TabsList className="bg-[#F7F8FA] border border-[#F3F4F6] h-9 p-0.5">
          {[
            { value: "profil", label: "Profil", icon: Car },
            { value: "documente", label: "Documente", icon: FileText },
            { value: "expirari", label: "Expirări", icon: CalendarClock },
            { value: "istoric", label: "Istoric", icon: History },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="gap-1.5 text-xs h-8 px-3 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#1877F2]"
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profil" className="mt-4">
          <VehiculTabProfil vehicul={vehicul} />
        </TabsContent>
        <TabsContent value="documente" className="mt-4">
          <VehiculTabDocumente vehiculId={vehicul.id} statieId={vehicul.statie_id} />
        </TabsContent>
        <TabsContent value="expirari" className="mt-4">
          <VehiculTabExpirari vehicul={vehicul} />
        </TabsContent>
        <TabsContent value="istoric" className="mt-4">
          <VehiculTabIstoric vehiculId={vehicul.id} statieId={vehicul.statie_id} nrInmatriculare={vehicul.nr_inmatriculare} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
