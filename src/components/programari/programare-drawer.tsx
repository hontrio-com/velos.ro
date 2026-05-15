"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { format, parseISO, differenceInDays } from "date-fns";
import { ro } from "date-fns/locale";
import {
  X,
  Phone,
  Car,
  Clock,
  User,
  DollarSign,
  CheckCircle2,
  XCircle,
  PlayCircle,
  AlertTriangle,
  FileText,
  ClipboardList,
  UserCog,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { statusConfig } from "./programari-client";
import { RezultatItpForm } from "./rezultat-itp-form";
import { trimiteRecenzieAction } from "@/lib/actions/recenzii";
import { deleteProgramareAction, updateProgramareStatusAction } from "@/lib/actions/programari";

type Status = "programat" | "in_lucru" | "finalizat" | "anulat" | "neprezent";

type RezultatRow = {
  id: string;
  rezultat: "admis" | "respins" | "readmis";
  data_inspectie: string;
  expirare_noua: string | null;
  inspector: string | null;
  observatii_tehnice: string | null;
} | null;

const rezultatConfig = {
  admis: { label: "Admis", className: "bg-emerald-100 text-emerald-700" },
  respins: { label: "Respins", className: "bg-red-100 text-red-700" },
  readmis: { label: "Readmis", className: "bg-blue-100 text-blue-700" },
};

interface ProgramareDrawerProps {
  programareId: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function ProgramareDrawer({
  programareId,
  onClose,
  onUpdate,
}: ProgramareDrawerProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showRezultatForm, setShowRezultatForm] = useState(false);
  const [updatingAngajat, setUpdatingAngajat] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: p, isLoading } = useQuery({
    queryKey: ["programare-detail", programareId],
    queryFn: async () => {
      const { data } = await supabase
        .from("programari")
        .select(
          `
          id, data_programare, ora_start, ora_sfarsit, status,
          tip_serviciu, pret, observatii, angajat_id, statie_id,
          sms_confirmare_trimis, created_at,
          client:clienti(id, nume, prenume, telefon, email),
          vehicul:vehicule(id, nr_inmatriculare, marca, model, an_fabricatie, expirare_itp),
          angajat:angajati(id, nume, functie),
          rezultate_itp(id, rezultat, data_inspectie, expirare_noua, inspector, observatii_tehnice)
        `
        )
        .eq("id", programareId!)
        .single();
      return data;
    },
    enabled: !!programareId,
  });

  const rezultat: RezultatRow = Array.isArray(p?.rezultate_itp)
    ? (p.rezultate_itp[0] as RezultatRow) ?? null
    : null;

  const angajatAsigned = p?.angajat
    ? (Array.isArray(p.angajat) ? p.angajat[0] : p.angajat) as { id: string; nume: string; functie: string | null } | null
    : null;

  const { data: angajatiList = [] } = useQuery<{ id: string; nume: string; functie: string | null }[]>({
    queryKey: ["angajati-activi", p?.statie_id],
    queryFn: async () => {
      if (!p?.statie_id) return [];
      const { data } = await supabase
        .from("angajati")
        .select("id, nume, functie")
        .eq("statie_id", p.statie_id)
        .eq("activ", true)
        .order("nume");
      return data ?? [];
    },
    enabled: !!p?.statie_id,
  });

  async function handleAngajatChange(angajatId: string | null) {
    if (!programareId) return;
    setUpdatingAngajat(true);
    const { error } = await supabase
      .from("programari")
      .update({ angajat_id: angajatId })
      .eq("id", programareId);
    setUpdatingAngajat(false);
    if (error) {
      toast.error("Eroare la actualizarea angajatului");
    } else {
      invalidate();
    }
  }

  useEffect(() => {
    if (p?.status === "finalizat" && !rezultat) {
      setShowRezultatForm(true);
    }
  }, [p?.status, rezultat]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["programare-detail", programareId] });
    queryClient.invalidateQueries({ queryKey: ["programari"] });
    queryClient.invalidateQueries({ queryKey: ["programari-stats"] });
    queryClient.invalidateQueries({ queryKey: ["vehicule-list"] });
    queryClient.invalidateQueries({ queryKey: ["vehicule-stats"] });
    queryClient.invalidateQueries({ queryKey: ["vehicul-detail"] });
    queryClient.invalidateQueries({ queryKey: ["vehicul-programari"] });
    onUpdate();
  }

  async function updateStatus(newStatus: Status) {
    if (!programareId) return;
    setUpdatingStatus(true);
    const result = await updateProgramareStatusAction(programareId, newStatus);

    if ("error" in result) {
      toast.error("Eroare la actualizarea statusului");
    } else {
      toast.success(`Status: ${statusConfig[newStatus].label}`);
      invalidate();
      if (newStatus === "finalizat") {
        setShowRezultatForm(true);
        trimiteRecenzieAction(programareId).catch(() => null);
      }
    }
    setUpdatingStatus(false);
  }

  if (!programareId) return null;

  const numeClient = p?.client
    ? `${p.client.nume}${p.client.prenume ? " " + p.client.prenume : ""}`
    : "Client necunoscut";

  const itpExpira =
    p?.vehicul?.expirare_itp
      ? differenceInDays(parseISO(p.vehicul.expirare_itp), new Date())
      : null;

  const isFinished =
    p?.status === "finalizat" || p?.status === "anulat";

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-[440px] border-l border-border bg-card shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <p className="font-semibold text-base truncate">
              {isLoading ? "..." : numeClient}
            </p>
            {p && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {format(
                  parseISO(p.data_programare + "T12:00:00"),
                  "d MMM yyyy",
                  { locale: ro }
                )}{" "}
                la {p.ora_start.slice(0, 5)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {p && (
              <Badge
                className={cn(
                  "text-xs border",
                  statusConfig[p.status as Status].className
                )}
              >
                {statusConfig[p.status as Status].label}
              </Badge>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 bg-muted rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : p ? (
            <>
              {/* Vehicle */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Vehicul
                </p>
                <div className="rounded-xl border border-border bg-background px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-sm">
                        {p.vehicul?.nr_inmatriculare ?? "N/A"}
                      </span>
                    </div>
                    {itpExpira !== null && (
                      <Badge
                        className={cn(
                          "text-xs border-0",
                          itpExpira < 0
                            ? "bg-red-100 text-red-700"
                            : itpExpira < 30
                              ? "bg-amber-100 text-amber-700"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {itpExpira < 0
                          ? `Expirat ${Math.abs(itpExpira)}z`
                          : `Expira in ${itpExpira}z`}
                      </Badge>
                    )}
                  </div>
                  {p.vehicul && (
                    <p className="text-xs text-muted-foreground">
                      {[
                        p.vehicul.marca,
                        p.vehicul.model,
                        p.vehicul.an_fabricatie,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
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
                  {p.client?.telefon && (
                    <a
                      href={`tel:${p.client.telefon}`}
                      className="flex items-center gap-2 text-sm text-primary hover:underline underline-offset-2"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {p.client.telefon}
                    </a>
                  )}
                  {p.client?.email && (
                    <p className="text-xs text-muted-foreground">
                      {p.client.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Appointment details */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Detalii programare
                </p>
                <div className="rounded-xl border border-border bg-background px-4 py-3 space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Interval
                    </span>
                    <span className="font-medium">
                      {p.ora_start.slice(0, 5)} - {p.ora_sfarsit.slice(0, 5)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      Serviciu
                    </span>
                    <span className="font-medium">{p.tip_serviciu}</span>
                  </div>
                  {p.pret && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-3.5 w-3.5" />
                        Pret
                      </span>
                      <span className="font-medium">
                        {Number(p.pret).toLocaleString("ro-RO")} RON
                      </span>
                    </div>
                  )}
                  {/* Angajat selector */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <UserCog className="h-3.5 w-3.5" />
                      Inspector
                    </span>
                    {angajatiList.length > 0 ? (
                      <select
                        value={angajatAsigned?.id ?? ""}
                        onChange={(e) => handleAngajatChange(e.target.value || null)}
                        disabled={updatingAngajat}
                        className="text-sm font-medium text-right bg-transparent border-none outline-none cursor-pointer text-foreground disabled:opacity-50 max-w-[160px] truncate"
                      >
                        <option value="">— Neatribuit —</option>
                        {angajatiList.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nume}{a.functie ? ` · ${a.functie}` : ""}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-medium text-muted-foreground text-sm">
                        {angajatAsigned?.nume ?? "—"}
                      </span>
                    )}
                  </div>

                  {p.observatii && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground italic">
                        {p.observatii}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ITP Result */}
              {(p.status === "finalizat" || rezultat) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Rezultat ITP
                    </p>
                    {rezultat && (
                      <button
                        type="button"
                        onClick={() => setShowRezultatForm(!showRezultatForm)}
                        className="text-xs text-primary underline-offset-2 hover:underline"
                      >
                        {showRezultatForm ? "Ascunde" : "Editeaza"}
                      </button>
                    )}
                  </div>

                  {rezultat && !showRezultatForm ? (
                    <div className="rounded-xl border border-border bg-background px-4 py-3 space-y-2.5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Rezultat</span>
                        <Badge
                          className={cn(
                            "border-0",
                            rezultatConfig[rezultat.rezultat].className
                          )}
                        >
                          {rezultatConfig[rezultat.rezultat].label}
                        </Badge>
                      </div>
                      {rezultat.expirare_noua && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Expira la
                          </span>
                          <span className="font-medium">
                            {format(
                              parseISO(rezultat.expirare_noua),
                              "d MMM yyyy",
                              { locale: ro }
                            )}
                          </span>
                        </div>
                      )}
                      {rezultat.inspector && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Inspector
                          </span>
                          <span className="font-medium">
                            {rezultat.inspector}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : showRezultatForm ? (
                    <RezultatItpForm
                      programareId={p.id}
                      vehiculId={p.vehicul?.id ?? ""}
                      initialRezultat={rezultat}
                      onSave={() => {
                        setShowRezultatForm(false);
                        invalidate();
                      }}
                    />
                  ) : (
                    <div className="rounded-xl border border-dashed border-border px-4 py-4 text-center space-y-2">
                      <ClipboardList className="h-5 w-5 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Completeaza rezultatul ITP
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowRezultatForm(true)}
                      >
                        Adauga rezultat
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Actions footer */}
        {p && !isFinished && (
          <div className="border-t border-border p-4 shrink-0 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Schimba status
            </p>
            <div className="grid grid-cols-2 gap-2">
              {p.status === "programat" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={updatingStatus}
                  onClick={() => updateStatus("in_lucru")}
                  className="gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  Incepe lucrul
                </Button>
              )}
              {(p.status === "programat" || p.status === "in_lucru") && (
                <Button
                  size="sm"
                  disabled={updatingStatus}
                  onClick={() => updateStatus("finalizat")}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Finalizeaza
                </Button>
              )}
              {p.status === "programat" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updatingStatus}
                    onClick={() => updateStatus("neprezent")}
                    className="gap-1.5"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Neprezent
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updatingStatus}
                    onClick={() => updateStatus("anulat")}
                    className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Anuleaza
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Delete footer */}
        {p && (
          <div className="border-t border-border px-4 py-3 shrink-0">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Șterge programarea
              </button>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-destructive font-medium">Ești sigur? Acțiunea e ireversibilă.</p>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                    className="h-7 text-xs px-3"
                  >
                    Anulează
                  </Button>
                  <Button
                    size="sm"
                    disabled={deleting}
                    onClick={async () => {
                      if (!programareId) return;
                      setDeleting(true);
                      const r = await deleteProgramareAction(programareId);
                      if ("error" in r) {
                        toast.error(r.error);
                        setDeleting(false);
                        setConfirmDelete(false);
                      } else {
                        toast.success("Programare ștearsă");
                        onUpdate();
                        onClose();
                      }
                    }}
                    className="h-7 text-xs px-3 bg-destructive hover:bg-destructive/90 text-white"
                  >
                    {deleting ? "Se șterge..." : "Confirmă"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
