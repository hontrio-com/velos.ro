"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Search,
  Loader2,
  Plus,
  X,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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

interface ProgramareNouaDrawerProps {
  open: boolean;
  onClose: () => void;
  statieId: string;
  defaultDate?: string;
  defaultTime?: string | null;
  onSuccess: (savedDate: string) => void;
}

type Step = 1 | 2 | 3;
const STEP_LABELS: Record<Step, string> = {
  1: "Vehicul",
  2: "Data și ora",
  3: "Detalii",
};

export function ProgramareNouaDrawer({
  open,
  onClose,
  statieId,
  defaultDate,
  defaultTime,
  onSuccess,
}: ProgramareNouaDrawerProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>(1);
  const [isSaving, setIsSaving] = useState(false);

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
  const [selectedSlot, setSelectedSlot] = useState<string | null>(
    defaultTime ?? null
  );

  // Step 3
  const [tipServiciu, setTipServiciu] = useState("ITP");
  const [pret, setPret] = useState("");
  const [observatii, setObservatii] = useState("");
  const [angajatId, setAngajatId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setPlateSearch("");
      setSelectedVehicul(null);
      setShowCreate(false);
      setNewNr(""); setNewMarca(""); setNewModel(""); setNewAn("");
      setNewNume(""); setNewTelefon("");
      setSelectedDate(defaultDate ?? format(new Date(), "yyyy-MM-dd"));
      setSelectedSlot(defaultTime ?? null);
      setTipServiciu("ITP"); setPret(""); setObservatii(""); setAngajatId(null);
    }
  }, [open, defaultDate, defaultTime]);

  const { data: angajati = [] } = useQuery<{ id: string; nume: string; functie: string | null }[]>({
    queryKey: ["angajati-activi", statieId],
    queryFn: async () => {
      const { data } = await supabase
        .from("angajati")
        .select("id, nume, functie")
        .eq("statie_id", statieId)
        .eq("activ", true)
        .order("nume");
      return data ?? [];
    },
    enabled: open,
  });

  const { data: vehiculeGasite, isLoading: searchLoading } = useQuery<VehiculFound[]>({
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

  async function createVehiculAndClient(): Promise<VehiculFound | null> {
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
        .insert({ statie_id: statieId, nume: newNume, telefon: newTelefon })
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
      toast.error("Selectează sau adaugă un vehicul");
      return;
    }
    if (showCreate) {
      if (!newNr || !newNume || !newTelefon) {
        toast.error("Completează nr. înmatriculare, proprietarul și telefonul");
        return;
      }
      setIsSaving(true);
      const v = await createVehiculAndClient();
      setIsSaving(false);
      if (!v) { toast.error("Eroare la adăugarea vehiculului"); return; }
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
    setIsSaving(true);
    const result = await createProgramareStaffAction({
      statieId,
      clientId: selectedVehicul.client.id,
      vehiculId: selectedVehicul.id,
      date: selectedDate,
      slot: selectedSlot,
      tipServiciu: tipServiciu || "ITP",
      pret: pret ? parseFloat(pret) : null,
      observatii: observatii || null,
      angajatId: angajatId || null,
    });
    setIsSaving(false);
    if ("error" in result) {
      toast.error(`Eroare la salvare: ${result.error}`);
    } else {
      toast.success("Programare adăugată!");
      queryClient.invalidateQueries({ queryKey: ["programari"] });
      queryClient.invalidateQueries({ queryKey: ["programari-stats"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      onSuccess(selectedDate);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-[480px] bg-white border-l border-[#E5E7EB] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] shrink-0">
          <div>
            <p className="font-semibold text-[#111318]">Programare nouă</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              {STEP_LABELS[step]} — pasul {step} din 3
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-[#F9FAFB] transition-colors"
          >
            <X className="h-4 w-4 text-[#6B7280]" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-5 py-3 border-b border-[#E5E7EB] shrink-0">
          <div className="flex items-center">
            {([1, 2, 3] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0 transition-all",
                      step > s
                        ? "bg-[#1877F2] text-white"
                        : step === s
                          ? "border-2 border-[#1877F2] text-[#1877F2]"
                          : "border-2 border-[#E5E7EB] text-[#9CA3AF]"
                    )}
                  >
                    {step > s ? <Check className="h-2.5 w-2.5" /> : s}
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      step === s ? "text-[#111318]" : "text-[#9CA3AF]"
                    )}
                  >
                    {STEP_LABELS[s]}
                  </span>
                </div>
                {i < 2 && (
                  <div
                    className={cn(
                      "flex-1 h-px mx-2",
                      step > s ? "bg-[#1877F2]" : "bg-[#E5E7EB]"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ─── STEP 1: VEHICUL ──────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              {selectedVehicul ? (
                <div className="flex items-center gap-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#DBEAFE] shrink-0">
                    <Car className="h-4 w-4 text-[#1877F2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#111318]">
                      {selectedVehicul.nr_inmatriculare}
                    </p>
                    <p className="text-xs text-[#6B7280] truncate">
                      {[selectedVehicul.marca, selectedVehicul.model, selectedVehicul.an_fabricatie]
                        .filter(Boolean)
                        .join(" ")}
                      {selectedVehicul.client
                        ? ` · ${selectedVehicul.client.nume} · ${selectedVehicul.client.telefon}`
                        : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedVehicul(null); setPlateSearch(""); }}
                    className="shrink-0 text-[#9CA3AF] hover:text-[#374151]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : !showCreate ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[#374151]">Caută după nr. înmatriculare</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                      <Input
                        className="pl-9 border-[#E5E7EB] focus-visible:ring-[#1877F2]/20"
                        placeholder="B 123 ABC..."
                        value={plateSearch}
                        onChange={(e) => setPlateSearch(e.target.value.toUpperCase())}
                        autoFocus
                      />
                      {searchLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#9CA3AF]" />
                      )}
                    </div>
                  </div>

                  {vehiculeGasite && vehiculeGasite.length > 0 && (
                    <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
                      {vehiculeGasite.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => { setSelectedVehicul(v); setPlateSearch(""); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F9FAFB] transition-colors text-left border-b border-[#E5E7EB] last:border-0"
                        >
                          <Car className="h-4 w-4 text-[#9CA3AF] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#111318]">
                              {v.nr_inmatriculare}
                            </p>
                            <p className="text-xs text-[#6B7280] truncate">
                              {[v.marca, v.model].filter(Boolean).join(" ")}
                              {v.client ? ` · ${v.client.nume}` : ""}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {plateSearch.length >= 2 && !searchLoading && vehiculeGasite?.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[#E5E7EB] px-4 py-5 text-center space-y-2">
                      <p className="text-sm text-[#6B7280]">
                        Niciun vehicul găsit pentru <strong className="text-[#111318]">{plateSearch}</strong>
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => { setNewNr(plateSearch); setShowCreate(true); }}
                        className="border-[#E5E7EB]"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Adaugă vehicul nou
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                /* Create form */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#111318]">Vehicul nou</p>
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="text-xs text-[#9CA3AF] hover:text-[#374151]"
                    >
                      Anulează
                    </button>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                      Proprietar
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[#374151]">
                          Nume <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={newNume}
                          onChange={(e) => setNewNume(e.target.value)}
                          placeholder="Ion Popescu"
                          className="border-[#E5E7EB]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#374151]">
                          Telefon <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={newTelefon}
                          onChange={(e) => setNewTelefon(e.target.value)}
                          placeholder="0712 345 678"
                          className="border-[#E5E7EB]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                      Vehicul
                    </p>
                    <div className="space-y-1.5">
                      <Label className="text-[#374151]">
                        Nr. înmatriculare <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={newNr}
                        onChange={(e) => setNewNr(e.target.value.toUpperCase())}
                        placeholder="B 123 ABC"
                        className="border-[#E5E7EB]"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[#374151]">Marcă</Label>
                        <Input
                          value={newMarca}
                          onChange={(e) => setNewMarca(e.target.value)}
                          placeholder="Dacia"
                          className="border-[#E5E7EB]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#374151]">Model</Label>
                        <Input
                          value={newModel}
                          onChange={(e) => setNewModel(e.target.value)}
                          placeholder="Logan"
                          className="border-[#E5E7EB]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#374151]">An</Label>
                        <Input
                          type="number"
                          value={newAn}
                          onChange={(e) => setNewAn(e.target.value)}
                          placeholder="2020"
                          min={1980}
                          max={new Date().getFullYear() + 1}
                          className="border-[#E5E7EB]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 2: DATA & ORA ───────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[#374151]">Data programării</Label>
                <DayNavigator
                  date={selectedDate}
                  onChange={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#374151]">Selectează ora</Label>
                <SlotPicker
                  statieId={statieId}
                  date={selectedDate}
                  selected={selectedSlot}
                  onSelect={setSelectedSlot}
                />
              </div>
            </div>
          )}

          {/* ─── STEP 3: DETALII ──────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Vehicul</span>
                  <span className="font-medium text-[#111318]">
                    {selectedVehicul?.nr_inmatriculare}
                    {selectedVehicul?.client ? ` · ${selectedVehicul.client.nume}` : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Data și ora</span>
                  <span className="font-medium text-[#111318]">
                    {selectedDate} · {selectedSlot}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[#374151]">Tip serviciu</Label>
                  <Input
                    value={tipServiciu}
                    onChange={(e) => setTipServiciu(e.target.value)}
                    placeholder="ITP"
                    className="border-[#E5E7EB]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#374151]">Preț (RON)</Label>
                  <Input
                    type="number"
                    placeholder="150"
                    value={pret}
                    onChange={(e) => setPret(e.target.value)}
                    className="border-[#E5E7EB]"
                  />
                </div>
              </div>

              {angajati.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-[#374151]">Inspector / Angajat (opțional)</Label>
                  <select
                    value={angajatId ?? ""}
                    onChange={(e) => setAngajatId(e.target.value || null)}
                    className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 text-[#111318] bg-white"
                  >
                    <option value="">— Neatribuit —</option>
                    {angajati.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nume}{a.functie ? ` · ${a.functie}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-[#374151]">Observații (opțional)</Label>
                <Textarea
                  rows={3}
                  placeholder="..."
                  value={observatii}
                  onChange={(e) => setObservatii(e.target.value)}
                  className="border-[#E5E7EB] resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#E5E7EB] px-5 py-4 shrink-0">
          <div className="flex justify-between gap-3">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={() => setStep((s) => (s - 1) as Step)}
                disabled={isSaving}
                className="border-[#E5E7EB] text-[#374151]"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Înapoi
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={onClose}
                className="border-[#E5E7EB] text-[#374151]"
              >
                Anulează
              </Button>
            )}

            {step < 3 ? (
              <Button
                onClick={step === 1 ? handleStep1Next : () => {
                  if (!selectedSlot) { toast.error("Selectează un slot orar"); return; }
                  setStep(3);
                }}
                disabled={isSaving || (step === 2 && !selectedSlot)}
                className="bg-[#1877F2] hover:bg-[#1565D8] text-white"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                Următor
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#1877F2] hover:bg-[#1565D8] text-white"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                Salvează programarea
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
