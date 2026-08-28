"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchAll } from "@/lib/fetch-all";
import {
  Car,
  Search,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Plus,
  ChevronRight,
  User,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { format, differenceInDays, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { VehiculeStats } from "./vehicule-stats";
import { VehiculDrawer } from "./vehicul-drawer";
import { VehiculFormDialog } from "./vehicul-form-dialog";

type ItpFilter = "toate" | "expirati" | "expira_curand" | "valabile" | "fara_itp";

interface VehiculeClientProps {
  statieId: string;
}

function getItpStatus(expirare: string | null) {
  if (!expirare) return "fara_itp";
  const days = differenceInDays(parseISO(expirare), new Date());
  if (days < 0) return "expirati";
  if (days <= 30) return "expira_curand";
  return "valabile";
}

function ItpBadge({ expirare }: { expirare: string | null }) {
  if (!expirare) {
    return (
      <Badge className="text-xs border-0 bg-muted text-muted-foreground">
        Fara ITP
      </Badge>
    );
  }
  const days = differenceInDays(parseISO(expirare), new Date());
  if (days < 0) {
    return (
      <Badge className="text-xs border-0 bg-red-100 text-red-700 gap-1">
        <AlertTriangle className="h-3 w-3" />
        Expirat {Math.abs(days)}z
      </Badge>
    );
  }
  if (days <= 7) {
    return (
      <Badge className="text-xs border-0 bg-red-100 text-red-700 gap-1">
        <AlertTriangle className="h-3 w-3" />
        {days}z
      </Badge>
    );
  }
  if (days <= 30) {
    return (
      <Badge className="text-xs border-0 bg-amber-100 text-amber-700 gap-1">
        <Clock className="h-3 w-3" />
        {days}z
      </Badge>
    );
  }
  return (
    <Badge className="text-xs border-0 bg-emerald-100 text-emerald-700 gap-1">
      <ShieldCheck className="h-3 w-3" />
      {format(parseISO(expirare), "d MMM yyyy", { locale: ro })}
    </Badge>
  );
}

const filterConfig: { key: ItpFilter; label: string }[] = [
  { key: "toate", label: "Toate" },
  { key: "expirati", label: "Expirate" },
  { key: "expira_curand", label: "Expira curand" },
  { key: "valabile", label: "Valabile" },
  { key: "fara_itp", label: "Fara ITP" },
];

export function VehiculeClient({ statieId }: VehiculeClientProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [itpFilter, setItpFilter] = useState<ItpFilter>("toate");
  const [drawerVehiculId, setDrawerVehiculId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const supabase = createClient();

  const { data: vehicule, isLoading } = useQuery({
    queryKey: ["vehicule-list", statieId],
    queryFn: async () => {
      return fetchAll((from, to) =>
        supabase
          .from("vehicule")
          .select(
            `
            id, nr_inmatriculare, marca, model, an_fabricatie,
            culoare, expirare_itp, created_at,
            client:clienti(id, nume, prenume, telefon)
          `
          )
          .eq("statie_id", statieId)
          .order("created_at", { ascending: false })
          .order("id", { ascending: true })
          .range(from, to)
      );
    },
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["vehicule-list", statieId] });
    queryClient.invalidateQueries({ queryKey: ["vehicule-stats", statieId] });
  }

  const filtered = vehicule?.filter((v) => {
    // ITP filter
    if (itpFilter !== "toate") {
      const status = getItpStatus(v.expirare_itp);
      if (status !== itpFilter) return false;
    }
    // Search filter
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.nr_inmatriculare.toLowerCase().includes(q) ||
      v.marca?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      v.client?.nume?.toLowerCase().includes(q) ||
      v.client?.prenume?.toLowerCase().includes(q) ||
      v.client?.telefon?.includes(q)
    );
  });

  return (
    <>
      {/* Stats */}
      <VehiculeStats statieId={statieId} />

      {/* Toolbar */}
      <Card className="border-border shadow-none mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nr. inmatriculare, marca, proprietar, telefon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <Button
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Vehicul nou
            </Button>
          </div>

          {/* ITP filter pills */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {filterConfig.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setItpFilter(key)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                  itpFilter === key
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {label}
                {key !== "toate" && vehicule && (
                  <span className="ml-1 opacity-60">
                    {vehicule.filter((v) => getItpStatus(v.expirare_itp) === key).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">
          {filtered?.length ?? 0}{" "}
          {filtered?.length === 1 ? "vehicul" : "vehicule"}
        </p>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((v) => {
            const numeClient = v.client
              ? `${v.client.nume}${v.client.prenume ? " " + v.client.prenume : ""}`
              : "Proprietar necunoscut";

            return (
              <Card
                key={v.id}
                className="border-border shadow-none hover:border-primary/40 hover:shadow-sm transition-all group"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <button
                      type="button"
                      onClick={() => setDrawerVehiculId(v.id)}
                      className="min-w-0 text-left flex-1"
                    >
                      <p className="font-bold text-foreground text-base font-mono leading-tight">
                        {v.nr_inmatriculare}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[v.marca, v.model, v.an_fabricatie]
                          .filter(Boolean)
                          .join(" ") || "Date necunoscute"}
                      </p>
                    </button>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Link
                        href={`/vehicule/${v.id}`}
                        onClick={(e) => e.stopPropagation()}
                        title="Deschide profil complet"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-[#EFF6FF] hover:text-[#1877F2] transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDrawerVehiculId(v.id)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                      <User className="h-3 w-3 shrink-0" />
                      <span className="truncate">{numeClient}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <ItpBadge expirare={v.expirare_itp} />
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Car}
          title={search || itpFilter !== "toate" ? "Niciun rezultat" : "Niciun vehicul"}
          description={
            search || itpFilter !== "toate"
              ? "Incearca alta cautare sau schimba filtrul."
              : "Adauga primul vehicul pentru a incepe."
          }
          action={
            !search && itpFilter === "toate"
              ? { label: "Adauga vehicul", onClick: () => setShowAddDialog(true) }
              : undefined
          }
        />
      )}

      {/* Drawer */}
      <VehiculDrawer
        vehiculId={drawerVehiculId}
        statieId={statieId}
        onClose={() => setDrawerVehiculId(null)}
        onUpdate={invalidateAll}
      />

      {/* Add dialog */}
      {showAddDialog && (
        <VehiculFormDialog
          statieId={statieId}
          onClose={() => setShowAddDialog(false)}
          onSave={() => {
            setShowAddDialog(false);
            invalidateAll();
          }}
        />
      )}
    </>
  );
}
