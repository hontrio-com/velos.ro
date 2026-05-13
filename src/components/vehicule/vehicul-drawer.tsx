"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  format,
  parseISO,
  differenceInDays,
  formatDistanceToNow,
} from "date-fns";
import { ro } from "date-fns/locale";
import {
  X,
  Car,
  Phone,
  User,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Hash,
  Palette,
  CalendarClock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { VehiculFormDialog } from "./vehicul-form-dialog";

const rezultatConfig = {
  admis: { label: "Admis", className: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  respins: { label: "Respins", className: "bg-red-100 text-red-700", icon: XCircle },
  readmis: { label: "Readmis", className: "bg-blue-100 text-blue-700", icon: RefreshCw },
};

const statusConfig = {
  programat: { label: "Programat", className: "bg-primary/10 text-primary border-primary/20" },
  in_lucru: { label: "In lucru", className: "bg-amber-100 text-amber-700 border-amber-200" },
  finalizat: { label: "Finalizat", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  anulat: { label: "Anulat", className: "bg-red-100 text-red-700 border-red-200" },
  neprezent: { label: "Neprezent", className: "bg-gray-100 text-gray-600 border-gray-200" },
} as const;

function ItpBadge({ expirare }: { expirare: string | null }) {
  if (!expirare) {
    return (
      <Badge className="border-0 bg-muted text-muted-foreground">
        Necunoscut
      </Badge>
    );
  }
  const days = differenceInDays(parseISO(expirare), new Date());
  if (days < 0) {
    return (
      <Badge className="border-0 bg-red-100 text-red-700">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Expirat {Math.abs(days)} zile
      </Badge>
    );
  }
  if (days <= 7) {
    return (
      <Badge className="border-0 bg-red-100 text-red-700">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Expira in {days} zile
      </Badge>
    );
  }
  if (days <= 30) {
    return (
      <Badge className="border-0 bg-amber-100 text-amber-700">
        <Clock className="h-3 w-3 mr-1" />
        Expira in {days} zile
      </Badge>
    );
  }
  return (
    <Badge className="border-0 bg-emerald-100 text-emerald-700">
      <ShieldCheck className="h-3 w-3 mr-1" />
      {format(parseISO(expirare), "d MMM yyyy", { locale: ro })}
    </Badge>
  );
}

interface VehiculDrawerProps {
  vehiculId: string | null;
  statieId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function VehiculDrawer({
  vehiculId,
  statieId,
  onClose,
  onUpdate,
}: VehiculDrawerProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: v, isLoading } = useQuery({
    queryKey: ["vehicul-detail", vehiculId],
    queryFn: async () => {
      const { data } = await supabase
        .from("vehicule")
        .select(
          `
          id, nr_inmatriculare, marca, model, an_fabricatie,
          serie_sasiu, culoare, expirare_itp, observatii, created_at,
          client:clienti(id, nume, prenume, telefon, email, adresa)
        `
        )
        .eq("id", vehiculId!)
        .single();
      return data;
    },
    enabled: !!vehiculId,
  });

  const { data: programari } = useQuery({
    queryKey: ["vehicul-programari", vehiculId],
    queryFn: async () => {
      const { data } = await supabase
        .from("programari")
        .select(
          `
          id, data_programare, status, tip_serviciu,
          rezultate_itp(id, rezultat, data_inspectie, expirare_noua, inspector)
        `
        )
        .eq("vehicul_id", vehiculId!)
        .order("data_programare", { ascending: false })
        .limit(10);
      return data ?? [];
    },
    enabled: !!vehiculId,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["vehicul-detail", vehiculId] });
    queryClient.invalidateQueries({ queryKey: ["vehicul-programari", vehiculId] });
    queryClient.invalidateQueries({ queryKey: ["vehicule-list", statieId] });
    queryClient.invalidateQueries({ queryKey: ["vehicule-stats", statieId] });
    onUpdate();
  }

  async function sterge() {
    if (!vehiculId) return;
    setDeleting(true);
    const { error } = await supabase
      .from("vehicule")
      .delete()
      .eq("id", vehiculId);

    if (error) {
      toast.error("Eroare la stergerea vehiculului");
      setConfirmDelete(false);
    } else {
      toast.success("Vehicul sters");
      onClose();
      queryClient.invalidateQueries({ queryKey: ["vehicule-list", statieId] });
      queryClient.invalidateQueries({ queryKey: ["vehicule-stats", statieId] });
      onUpdate();
    }
    setDeleting(false);
  }

  if (!vehiculId) return null;

  const numeClient = v?.client
    ? `${v.client.nume}${v.client.prenume ? " " + v.client.prenume : ""}`
    : "Proprietar necunoscut";

  // Separate inspections (with result) from plain appointments
  const inspectii = (programari ?? []).filter((p) => {
    const rez = Array.isArray(p.rezultate_itp) ? p.rezultate_itp[0] : null;
    return !!rez;
  });

  const programariViitoare = (programari ?? []).filter(
    (p) =>
      p.status === "programat" || p.status === "in_lucru"
  );

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-[460px] border-l border-border bg-card shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <p className="font-semibold text-base font-mono truncate">
              {isLoading ? "..." : (v?.nr_inmatriculare ?? "-")}
            </p>
            {v && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {[v.marca, v.model, v.an_fabricatie].filter(Boolean).join(" ")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {v && <ItpBadge expirare={v.expirare_itp} />}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : v ? (
            <>
              {/* Vehicle details */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Vehicul
                </p>
                <div className="rounded-xl border border-border bg-background px-4 py-3 space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Car className="h-3.5 w-3.5" />
                      Marca / Model
                    </span>
                    <span className="font-medium">
                      {[v.marca, v.model].filter(Boolean).join(" ") || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      An fabricatie
                    </span>
                    <span className="font-medium">{v.an_fabricatie ?? "-"}</span>
                  </div>
                  {v.culoare && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Palette className="h-3.5 w-3.5" />
                        Culoare
                      </span>
                      <span className="font-medium">{v.culoare}</span>
                    </div>
                  )}
                  {v.serie_sasiu && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Hash className="h-3.5 w-3.5" />
                        Serie sasiu
                      </span>
                      <span className="font-mono text-xs font-medium">
                        {v.serie_sasiu}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Expirare ITP
                    </span>
                    <ItpBadge expirare={v.expirare_itp} />
                  </div>
                  {v.observatii && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground italic">
                        {v.observatii}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Owner */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Proprietar
                </p>
                <div className="rounded-xl border border-border bg-background px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{numeClient}</span>
                  </div>
                  {v.client?.telefon && (
                    <a
                      href={`tel:${v.client.telefon}`}
                      className="flex items-center gap-2 text-sm text-primary hover:underline underline-offset-2"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {v.client.telefon}
                    </a>
                  )}
                  {v.client?.email && (
                    <p className="text-xs text-muted-foreground">
                      {v.client.email}
                    </p>
                  )}
                  {v.client?.adresa && (
                    <p className="text-xs text-muted-foreground">
                      {v.client.adresa}
                    </p>
                  )}
                </div>
              </div>

              {/* Upcoming appointments */}
              {programariViitoare.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Programari active
                  </p>
                  <div className="space-y-2">
                    {programariViitoare.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-xl border border-border bg-background px-4 py-3 flex items-center justify-between text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            {format(parseISO(p.data_programare + "T12:00:00"), "d MMM yyyy", { locale: ro })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.tip_serviciu}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "text-xs border",
                            statusConfig[p.status as keyof typeof statusConfig]?.className
                          )}
                        >
                          {statusConfig[p.status as keyof typeof statusConfig]?.label}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ITP History */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Istoric ITP
                </p>
                {inspectii.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border px-4 py-5 text-center">
                    <p className="text-sm text-muted-foreground">
                      Nicio inspectie inregistrata
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inspectii.map((p) => {
                      const rez = Array.isArray(p.rezultate_itp)
                        ? p.rezultate_itp[0]
                        : null;
                      if (!rez) return null;
                      const RezIcon = rezultatConfig[rez.rezultat as keyof typeof rezultatConfig]?.icon ?? CheckCircle2;
                      return (
                        <div
                          key={p.id}
                          className="rounded-xl border border-border bg-background px-4 py-3 text-sm"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">
                              {format(
                                parseISO(rez.data_inspectie + "T12:00:00"),
                                "d MMM yyyy",
                                { locale: ro }
                              )}
                            </span>
                            <Badge
                              className={cn(
                                "border-0 text-xs gap-1",
                                rezultatConfig[rez.rezultat as keyof typeof rezultatConfig]?.className
                              )}
                            >
                              <RezIcon className="h-3 w-3" />
                              {rezultatConfig[rez.rezultat as keyof typeof rezultatConfig]?.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {rez.expirare_noua && (
                              <span>
                                Expira:{" "}
                                {format(
                                  parseISO(rez.expirare_noua + "T12:00:00"),
                                  "d MMM yyyy",
                                  { locale: ro }
                                )}
                              </span>
                            )}
                            {rez.inspector && (
                              <span>Inspector: {rez.inspector}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Added info */}
              <p className="text-xs text-muted-foreground text-center">
                Adaugat{" "}
                {formatDistanceToNow(parseISO(v.created_at), {
                  addSuffix: true,
                  locale: ro,
                })}
              </p>
            </>
          ) : null}
        </div>

        {/* Footer */}
        {v && (
          <div className="border-t border-border p-4 shrink-0 space-y-2">
            {confirmDelete ? (
              <div className="space-y-2">
                <p className="text-sm text-center text-muted-foreground">
                  Esti sigur? Aceasta actiune nu poate fi anulata.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Renunta
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={deleting}
                    onClick={sterge}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Sterge
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEdit(true)}
                  className="gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editeaza
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmDelete(true)}
                  className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Sterge
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit dialog rendered on top */}
      {showEdit && v && (
        <VehiculFormDialog
          statieId={statieId}
          initial={{
            id: v.id,
            nr_inmatriculare: v.nr_inmatriculare,
            marca: v.marca,
            model: v.model,
            an_fabricatie: v.an_fabricatie,
            serie_sasiu: v.serie_sasiu,
            culoare: v.culoare,
            expirare_itp: v.expirare_itp,
            observatii: v.observatii,
            client: v.client
              ? {
                  id: v.client.id,
                  nume: v.client.nume,
                  prenume: v.client.prenume,
                  telefon: v.client.telefon,
                  email: v.client.email,
                }
              : null,
          }}
          onClose={() => setShowEdit(false)}
          onSave={() => {
            setShowEdit(false);
            invalidate();
          }}
        />
      )}
    </>
  );
}
