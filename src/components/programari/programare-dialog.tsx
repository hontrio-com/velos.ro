"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  X,
  Car,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SlotPicker } from "./slot-picker";
import { DayNavigator } from "./day-navigator";
import { cn } from "@/lib/utils";
import { createProgramareStaffAction } from "@/lib/actions/programari";

interface VehiculFound {
  id: string;
  nr_inmatriculare: string;
  marca: string | null;
  model: string | null;
  an_fabricatie: number | null;
  expirare_itp: string | null;
  client: {
    id: string;
    nume: string;
    prenume: string | null;
    telefon: string;
  } | null;
}

interface ProgramareDialogProps {
  open: boolean;
  onClose: () => void;
  statieId: string;
  defaultDate?: string;
  onSuccess: (savedDate: string) => void;
}

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: "Vehicul",
  2: "Data si ora",
  3: "Detalii",
};

export function ProgramareDialog({
  open,
  onClose,
  statieId,
  defaultDate,
  onSuccess,
}: ProgramareDialogProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1
  const [plateSearch, setPlateSearch] = useState("");
  const [selectedVehicul, setSelectedVehicul] = useState<VehiculFound | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newNr, setNewNr] = useState("");
  const [newMarca, setNewMarca] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newAn, setNewAn] = useState("");
  const [newNume, setNewNume] = useState("");
  const [newTelefon, setNewTelefon] = useState("");

  // Step 2
  const [selectedDate, setSelectedDate] = useState(
    defaultDate ?? format(new Date(), "yyyy-MM-dd")
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Step 3
  const [tipServiciu, setTipServiciu] = useState("ITP");
  const [pret, setPret] = useState("");
  const [observatii, setObservatii] = useState("");

  // Search query
  const { data: vehiculeGasite, isLoading: searchLoading } = useQuery<
    VehiculFound[]
  >({
    queryKey: ["vehicule-search", statieId, plateSearch],
    queryFn: async () => {
      if (plateSearch.length < 2) return [];
      const { data } = await supabase
        .from("vehicule")
        .select(
          "id, nr_inmatriculare, marca, model, an_fabricatie, expirare_itp, client:clienti(id, nume, prenume, telefon)"
        )
        .eq("statie_id", statieId)
        .ilike("nr_inmatriculare", `%${plateSearch}%`)
        .limit(6);
      return (data ?? []) as VehiculFound[];
    },
    enabled: open && plateSearch.length >= 2 && !selectedVehicul,
  });

  function resetAll() {
    setStep(1);
    setPlateSearch("");
    setSelectedVehicul(null);
    setShowCreate(false);
    setNewNr("");
    setNewMarca("");
    setNewModel("");
    setNewAn("");
    setNewNume("");
    setNewTelefon("");
    setSelectedDate(defaultDate ?? format(new Date(), "yyyy-MM-dd"));
    setSelectedSlot(null);
    setTipServiciu("ITP");
    setPret("");
    setObservatii("");
  }

  function handleClose() {
    resetAll();
    onClose();
  }

  async function createVehiculAndClient(): Promise<VehiculFound | null> {
    if (!newNr || !newNume || !newTelefon) return null;

    // Upsert client by phone
    const { data: existing } = await supabase
      .from("clienti")
      .select("id, nume, prenume, telefon")
      .eq("statie_id", statieId)
      .eq("telefon", newTelefon)
      .maybeSingle();

    let client = existing;
    if (!client) {
      const { data: created } = await supabase
        .from("clienti")
        .insert({
          statie_id: statieId,
          nume: newNume,
          telefon: newTelefon,
        })
        .select("id, nume, prenume, telefon")
        .single();
      client = created;
    }

    if (!client) return null;

    const { data: vehicul, error } = await supabase
      .from("vehicule")
      .insert({
        statie_id: statieId,
        client_id: client.id,
        nr_inmatriculare: newNr.toUpperCase().replace(/\s+/g, " ").trim(),
        marca: newMarca || null,
        model: newModel || null,
        an_fabricatie: newAn ? parseInt(newAn) : null,
      })
      .select("id, nr_inmatriculare, marca, model, an_fabricatie, expirare_itp")
      .single();

    if (error || !vehicul) return null;

    return { ...vehicul, client } as VehiculFound;
  }

  async function handleStep1Next() {
    if (!selectedVehicul && !showCreate) {
      toast.error("Selecteaza sau adauga un vehicul");
      return;
    }

    if (showCreate) {
      if (!newNr || !newNume || !newTelefon) {
        toast.error(
          "Completeaza numarul de inmatriculare, proprietarul si telefonul"
        );
        return;
      }
      setIsLoading(true);
      const v = await createVehiculAndClient();
      setIsLoading(false);
      if (!v) {
        toast.error("Eroare la adaugarea vehiculului");
        return;
      }
      setSelectedVehicul(v);
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ["vehicule-search"] });
    }

    setStep(2);
  }

  async function handleSave() {
    if (!selectedVehicul || !selectedSlot) return;

    if (!selectedVehicul.client?.id) {
      toast.error("Vehiculul nu are un proprietar asociat");
      return;
    }

    setIsLoading(true);
    const result = await createProgramareStaffAction({
      statieId,
      clientId: selectedVehicul.client.id,
      vehiculId: selectedVehicul.id,
      date: selectedDate,
      slot: selectedSlot,
      tipServiciu: tipServiciu || "ITP",
      pret: pret ? parseFloat(pret) : null,
      observatii: observatii || null,
      angajatId: null,
    });
    setIsLoading(false);

    if ("error" in result) {
      toast.error(`Eroare la salvare: ${result.error}`);
    } else {
      toast.success("Programare adaugata!");
      queryClient.invalidateQueries({ queryKey: ["programari"] });
      queryClient.invalidateQueries({ queryKey: ["programari-stats"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      const dataSalvata = selectedDate;
      resetAll();
      onSuccess(dataSalvata);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Programare noua</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center mb-2">
          {([1, 2, 3] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all",
                    step > s
                      ? "border-primary bg-primary text-primary-foreground"
                      : step === s
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground"
                  )}
                >
                  {step > s ? <Check className="h-3.5 w-3.5" /> : s}
                </div>
                <p
                  className={cn(
                    "text-[11px] font-medium",
                    step === s ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {STEP_LABELS[s]}
                </p>
              </div>
              {i < 2 && (
                <div
                  className={cn(
                    "flex-1 h-px mb-5 mx-1 transition-colors",
                    step > s ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1: VEHICUL ─────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            {selectedVehicul ? (
              <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Car className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">
                    {selectedVehicul.nr_inmatriculare}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[
                      selectedVehicul.marca,
                      selectedVehicul.model,
                      selectedVehicul.an_fabricatie,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    {selectedVehicul.client
                      ? ` · ${selectedVehicul.client.nume} · ${selectedVehicul.client.telefon}`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVehicul(null);
                    setPlateSearch("");
                  }}
                  className="shrink-0"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            ) : !showCreate ? (
              <>
                <div className="space-y-1.5">
                  <Label>Cauta dupa nr. inmatriculare</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="B 123 ABC..."
                      value={plateSearch}
                      onChange={(e) =>
                        setPlateSearch(e.target.value.toUpperCase())
                      }
                      autoFocus
                    />
                    {searchLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>

                {vehiculeGasite && vehiculeGasite.length > 0 && (
                  <div className="rounded-xl border border-border overflow-hidden">
                    {vehiculeGasite.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedVehicul(v);
                          setPlateSearch("");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left border-b border-border last:border-0"
                      >
                        <Car className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">
                            {v.nr_inmatriculare}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {[v.marca, v.model].filter(Boolean).join(" ")}
                            {v.client ? ` · ${v.client.nume}` : ""}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {plateSearch.length >= 2 &&
                  !searchLoading &&
                  vehiculeGasite?.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border px-4 py-5 text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Niciun vehicul gasit pentru{" "}
                        <strong>{plateSearch}</strong>
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setNewNr(plateSearch);
                          setShowCreate(true);
                        }}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Adauga vehicul nou
                      </Button>
                    </div>
                  )}
              </>
            ) : (
              /* CREATE form */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Vehicul nou</p>
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Anuleaza
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Proprietar
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>
                        Nume{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={newNume}
                        onChange={(e) => setNewNume(e.target.value)}
                        placeholder="Ion Popescu"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>
                        Telefon{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={newTelefon}
                        onChange={(e) => setNewTelefon(e.target.value)}
                        placeholder="0712 345 678"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Vehicul
                  </p>
                  <div className="space-y-1.5">
                    <Label>
                      Nr. inmatriculare{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={newNr}
                      onChange={(e) =>
                        setNewNr(e.target.value.toUpperCase())
                      }
                      placeholder="B 123 ABC"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>Marca</Label>
                      <Input
                        value={newMarca}
                        onChange={(e) => setNewMarca(e.target.value)}
                        placeholder="Dacia"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Model</Label>
                      <Input
                        value={newModel}
                        onChange={(e) => setNewModel(e.target.value)}
                        placeholder="Logan"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>An</Label>
                      <Input
                        type="number"
                        value={newAn}
                        onChange={(e) => setNewAn(e.target.value)}
                        placeholder="2020"
                        min={1980}
                        max={new Date().getFullYear() + 1}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button
                onClick={handleStep1Next}
                disabled={isLoading}
                className="gap-1.5"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Urmatorul
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: DATA & SLOT ─────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data programarii</Label>
              <DayNavigator
                date={selectedDate}
                onChange={(d) => {
                  setSelectedDate(d);
                  setSelectedSlot(null);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Selecteaza ora</Label>
              <SlotPicker
                statieId={statieId}
                date={selectedDate}
                selected={selectedSlot}
                onSelect={setSelectedSlot}
              />
            </div>

            <div className="flex justify-between pt-1">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Inapoi
              </Button>
              <Button
                onClick={() => {
                  if (!selectedSlot) {
                    toast.error("Selecteaza un slot orar");
                    return;
                  }
                  setStep(3);
                }}
                disabled={!selectedSlot}
                className="gap-1"
              >
                Urmatorul
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: DETALII ─────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicul</span>
                <span className="font-medium">
                  {selectedVehicul?.nr_inmatriculare}
                  {selectedVehicul?.client
                    ? ` · ${selectedVehicul.client.nume}`
                    : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data si ora</span>
                <span className="font-medium">
                  {selectedDate} · {selectedSlot}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tip serviciu</Label>
                <Input
                  value={tipServiciu}
                  onChange={(e) => setTipServiciu(e.target.value)}
                  placeholder="ITP"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Pret (RON)</Label>
                <Input
                  type="number"
                  placeholder="150"
                  value={pret}
                  onChange={(e) => setPret(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Observatii (optional)</Label>
              <Textarea
                rows={2}
                placeholder="..."
                value={observatii}
                onChange={(e) => setObservatii(e.target.value)}
              />
            </div>

            <div className="flex justify-between pt-1">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Inapoi
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="gap-1.5"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Salveaza programarea
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
