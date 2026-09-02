"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import {
  CalendarDays,
  Clock,
  Car,
  Loader2,
  Search,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WeekSlotGrid } from "./week-slot-grid";
import { createProgramareStaffAction } from "@/lib/actions/programari";
import { capitalizeName } from "@/lib/format-name";

type ProgramLucru = Record<string, { start: string; end: string } | null>;

interface VehiculFound {
  id: string;
  nr_inmatriculare: string;
  marca: string | null;
  model: string | null;
  an_fabricatie: number | null;
  tip_vehicul: string | null;
  expirare_itp: string | null;
  client: {
    id: string;
    nume: string;
    prenume: string | null;
    telefon: string;
  } | null;
}

type TarifVehicul = { pret: number; durata_extra: number };
type TarifeMap = Record<string, TarifVehicul>;

function suggestedPret(
  vehicul: VehiculFound | null,
  tarife: TarifeMap | null
): string {
  if (!vehicul?.tip_vehicul || !tarife) return "";
  const t = tarife[vehicul.tip_vehicul];
  return t && t.pret > 0 ? String(t.pret) : "";
}

interface ProgramareBookingFlowProps {
  statieId: string;
  onCreated?: (savedDate: string) => void;
}

export function ProgramareBookingFlow({
  statieId,
  onCreated,
}: ProgramareBookingFlowProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [isSaving, setIsSaving] = useState(false);

  // Slotul ales din grilă — dacă e setat, popup-ul e deschis
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Vehicul
  const [plateSearch, setPlateSearch] = useState("");
  const [selectedVehicul, setSelectedVehicul] = useState<VehiculFound | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newNr, setNewNr] = useState("");
  const [newMarca, setNewMarca] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newAn, setNewAn] = useState("");
  const [newNume, setNewNume] = useState("");
  const [newTelefon, setNewTelefon] = useState("");

  // Detalii
  const [tipServiciu, setTipServiciu] = useState("ITP");
  const [pret, setPret] = useState("");
  const [observatii, setObservatii] = useState("");
  const [angajatId, setAngajatId] = useState<string | null>(null);

  const dialogOpen = !!selectedDate && !!selectedSlot;

  // ── Data: tarife (preț automat) ────────────────────────────────────────────
  const { data: statieCfg } = useQuery<{ programLucru: ProgramLucru | null; tarife: TarifeMap | null }>({
    queryKey: ["statie-config", statieId],
    queryFn: async () => {
      const [{ data: statie }, { data: setari }] = await Promise.all([
        supabase.from("statii").select("program_lucru").eq("id", statieId).single(),
        supabase.from("setari_statie").select("tarife").eq("statie_id", statieId).maybeSingle(),
      ]);
      return {
        programLucru: (statie?.program_lucru as ProgramLucru) ?? null,
        tarife: (setari?.tarife as TarifeMap) ?? null,
      };
    },
  });
  const tarife = statieCfg?.tarife ?? null;

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
  });

  const { data: vehiculeGasite, isLoading: searchLoading } = useQuery<VehiculFound[]>({
    queryKey: ["vehicule-search", statieId, plateSearch],
    queryFn: async () => {
      if (plateSearch.length < 2) return [];
      const { data } = await supabase
        .from("vehicule")
        .select(
          "id, nr_inmatriculare, marca, model, an_fabricatie, tip_vehicul, expirare_itp, client:clienti(id, nume, prenume, telefon)"
        )
        .eq("statie_id", statieId)
        .ilike("nr_inmatriculare", `%${plateSearch}%`)
        .limit(6);
      return (data ?? []) as VehiculFound[];
    },
    enabled: plateSearch.length >= 2 && !selectedVehicul,
  });

  // Selectează un vehicul și precompletează prețul din tarifele stației
  function chooseVehicul(v: VehiculFound) {
    setSelectedVehicul(v);
    setPlateSearch("");
    setPret((prev) => (prev ? prev : suggestedPret(v, tarife)));
  }

  // ── Creare vehicul + client ────────────────────────────────────────────────
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
        .insert({ statie_id: statieId, nume: capitalizeName(newNume), telefon: newTelefon })
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
      .select("id, nr_inmatriculare, marca, model, an_fabricatie, tip_vehicul, expirare_itp")
      .single();

    if (error || !vehicul) return null;
    return { ...vehicul, client } as VehiculFound;
  }

  // ── Reset / închidere popup ────────────────────────────────────────────────
  function closeDialog() {
    setSelectedDate("");
    setSelectedSlot(null);
    setPlateSearch("");
    setSelectedVehicul(null);
    setShowCreate(false);
    setNewNr(""); setNewMarca(""); setNewModel(""); setNewAn("");
    setNewNume(""); setNewTelefon("");
    setTipServiciu("ITP"); setPret(""); setObservatii(""); setAngajatId(null);
  }

  // ── Salvare ────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!selectedDate || !selectedSlot) return;

    let vehicul = selectedVehicul;

    // Vehicul nou completat direct în popup
    if (!vehicul && showCreate) {
      if (!newNr || !newNume || !newTelefon) {
        toast.error("Completează nr. înmatriculare, proprietarul și telefonul");
        return;
      }
      setIsSaving(true);
      vehicul = await createVehiculAndClient();
      if (!vehicul) {
        setIsSaving(false);
        toast.error("Eroare la adăugarea vehiculului");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["vehicule-search"] });
    }

    if (!vehicul) {
      toast.error("Selectează sau adaugă un vehicul");
      return;
    }
    if (!vehicul.client?.id) {
      setIsSaving(false);
      toast.error("Vehiculul nu are un proprietar asociat");
      return;
    }

    setIsSaving(true);
    const result = await createProgramareStaffAction({
      statieId,
      clientId: vehicul.client.id,
      vehiculId: vehicul.id,
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
      return;
    }

    const savedDate = selectedDate;
    toast.success(
      `Programare adăugată — ${format(parseISO(savedDate), "d MMMM", { locale: ro })}, ora ${selectedSlot}`
    );
    queryClient.invalidateQueries({ queryKey: ["programari"] });
    queryClient.invalidateQueries({ queryKey: ["programari-stats"] });
    queryClient.invalidateQueries({ queryKey: ["programari-calendar"] });
    queryClient.invalidateQueries({ queryKey: ["slots"] });
    queryClient.invalidateQueries({ queryKey: ["week-slots"] });
    onCreated?.(savedDate);
    closeDialog();
  }

  const selectedDateFormatted = selectedDate
    ? format(parseISO(selectedDate), "EEEE, d MMMM yyyy", { locale: ro })
    : "";

  return (
    <>
      {/* Grilă săptămânală — click pe slot deschide direct popup-ul */}
      <WeekSlotGrid
        statieId={statieId}
        selectedDate={selectedDate}
        selectedSlot={selectedSlot}
        onSelect={(date, slot) => {
          setSelectedDate(date);
          setSelectedSlot(slot);
        }}
      />

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="sm:max-w-[560px] max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Programare nouă</DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#1877F2]">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {selectedDateFormatted}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {selectedSlot}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* ── Vehicul ── */}
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
                  aria-label="Schimbă vehiculul"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : !showCreate ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[#374151]">Vehicul</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                    <Input
                      className="pl-9 border-[#E5E7EB] focus-visible:ring-[#1877F2]/20"
                      placeholder="Caută după nr. înmatriculare — B 123 ABC..."
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
                        onClick={() => chooseVehicul(v)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] transition-colors text-left border-b border-[#E5E7EB] last:border-0"
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
                  <div className="rounded-xl border border-dashed border-[#E5E7EB] px-4 py-4 text-center space-y-2">
                    <p className="text-sm text-[#6B7280]">
                      Niciun vehicul găsit pentru{" "}
                      <strong className="text-[#111318]">{plateSearch}</strong>
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

                {plateSearch.length < 2 && (
                  <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="w-full rounded-xl border border-dashed border-[#E5E7EB] px-4 py-2.5 text-sm text-[#6B7280] hover:border-[#1877F2]/50 hover:text-[#1877F2] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adaugă vehicul nou
                  </button>
                )}
              </div>
            ) : (
              /* Vehicul nou — se creează odată cu salvarea programării */
              <div className="space-y-3 rounded-xl border border-[#E5E7EB] p-3.5">
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[#374151]">
                      Proprietar <span className="text-red-500">*</span>
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
                      placeholder="0722 123 456 sau +39 333 1234567"
                      className="border-[#E5E7EB]"
                    />
                  </div>
                </div>

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
            )}

            {/* ── Detalii ── */}
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
                  placeholder="0"
                  value={pret}
                  onChange={(e) => setPret(e.target.value)}
                  className="border-[#E5E7EB]"
                />
                {suggestedPret(selectedVehicul, tarife) && (
                  <p className="text-[11px] text-[#9CA3AF]">
                    Tarif configurat: {suggestedPret(selectedVehicul, tarife)} RON
                  </p>
                )}
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
                rows={2}
                placeholder="..."
                value={observatii}
                onChange={(e) => setObservatii(e.target.value)}
                className="border-[#E5E7EB] resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1 h-10 border-[#E5E7EB]"
                onClick={closeDialog}
                disabled={isSaving}
              >
                Anulează
              </Button>
              <Button
                className="flex-1 bg-[#1877F2] hover:bg-[#1565D8] h-10"
                onClick={handleSave}
                disabled={isSaving || (!selectedVehicul && !showCreate)}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Se salvează...
                  </>
                ) : (
                  "Salvează programarea"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
