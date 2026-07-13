"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  format,
  addDays,
  parseISO,
  isBefore,
  startOfDay,
  getDay,
} from "date-fns";
import { ro } from "date-fns/locale";
import {
  CalendarDays,
  Clock,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Plus,
  X,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SlotPicker } from "./slot-picker";
import { createProgramareStaffAction } from "@/lib/actions/programari";

type ProgramLucru = Record<string, { start: string; end: string } | null>;

const ZILE_MAP: Record<number, string> = {
  1: "luni",
  2: "marti",
  3: "miercuri",
  4: "joi",
  5: "vineri",
  6: "sambata",
  0: "duminica",
};

const LUNI_RO = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];

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

interface ProgramareBookingFlowProps {
  statieId: string;
  onCreated?: (savedDate: string) => void;
}

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { n: 1, label: "Dată & Oră", icon: CalendarDays },
  { n: 2, label: "Vehicul", icon: Car },
  { n: 3, label: "Confirmare", icon: CheckCircle2 },
] as const;

function isStationOpenOnDate(date: Date, programLucru: ProgramLucru | null): boolean {
  if (!programLucru) return true; // fallback: allow, SlotPicker will show closed
  const dayKey = ZILE_MAP[getDay(date)];
  return !!programLucru[dayKey];
}

export function ProgramareBookingFlow({
  statieId,
  onCreated,
}: ProgramareBookingFlowProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>(1);
  const [isSaving, setIsSaving] = useState(false);

  // Calendar
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  // Selections
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Vehicle
  const [plateSearch, setPlateSearch] = useState("");
  const [selectedVehicul, setSelectedVehicul] = useState<VehiculFound | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newNr, setNewNr] = useState("");
  const [newMarca, setNewMarca] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newAn, setNewAn] = useState("");
  const [newNume, setNewNume] = useState("");
  const [newTelefon, setNewTelefon] = useState("");

  // Details
  const [tipServiciu, setTipServiciu] = useState("ITP");
  const [pret, setPret] = useState("");
  const [observatii, setObservatii] = useState("");
  const [angajatId, setAngajatId] = useState<string | null>(null);

  // ── Data: station work schedule (for disabling closed days) ────────────────
  const { data: programLucru = null } = useQuery<ProgramLucru | null>({
    queryKey: ["statie-program", statieId],
    queryFn: async () => {
      const { data } = await supabase
        .from("statii")
        .select("program_lucru")
        .eq("id", statieId)
        .single();
      return (data?.program_lucru as ProgramLucru) ?? null;
    },
  });

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
          "id, nr_inmatriculare, marca, model, an_fabricatie, expirare_itp, client:clienti(id, nume, prenume, telefon)"
        )
        .eq("statie_id", statieId)
        .ilike("nr_inmatriculare", `%${plateSearch}%`)
        .limit(6);
      return (data ?? []) as VehiculFound[];
    },
    enabled: plateSearch.length >= 2 && !selectedVehicul,
  });

  // ── Calendar helpers ───────────────────────────────────────────────────────
  const today = startOfDay(new Date());
  const maxDate = addDays(today, 90);

  function calDays(): (Date | null)[] {
    const first = new Date(calYear, calMonth, 1);
    const last = new Date(calYear, calMonth + 1, 0);
    const startDow = (getDay(first) + 6) % 7; // Mon=0
    const days: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(calYear, calMonth, d));
    return days;
  }

  function prevMonth() {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  }

  function nextMonth() {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  }

  function selectDate(date: Date) {
    setSelectedDate(format(date, "yyyy-MM-dd"));
    setSelectedSlot(null);
  }

  // ── Vehicle create ─────────────────────────────────────────────────────────
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

  async function handleVehiculNext() {
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
    setStep(3);
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!selectedVehicul || !selectedSlot || !selectedDate) return;
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
      queryClient.invalidateQueries({ queryKey: ["programari-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      onCreated?.(selectedDate);
      setStep(4);
    }
  }

  function resetFlow() {
    setStep(1);
    setSelectedDate("");
    setSelectedSlot(null);
    setPlateSearch("");
    setSelectedVehicul(null);
    setShowCreate(false);
    setNewNr(""); setNewMarca(""); setNewModel(""); setNewAn("");
    setNewNume(""); setNewTelefon("");
    setTipServiciu("ITP"); setPret(""); setObservatii(""); setAngajatId(null);
  }

  const selectedDateFormatted = selectedDate
    ? format(parseISO(selectedDate), "EEEE, d MMMM yyyy", { locale: ro })
    : "";

  const step1Valid = !!selectedDate && !!selectedSlot;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Step indicator */}
      {step < 4 && (
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.n;
            const active = step === s.n;
            return (
              <div key={s.n} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 transition-colors",
                  done ? "bg-[#1877F2] text-white" :
                  active ? "bg-[#EFF6FF] text-[#1877F2] border-2 border-[#1877F2]" :
                  "bg-[#F7F8FA] text-[#9CA3AF]"
                )}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <span className={cn(
                  "text-xs font-medium hidden sm:block",
                  active ? "text-[#1877F2]" : done ? "text-[#374151]" : "text-[#9CA3AF]"
                )}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={cn("flex-1 h-px", done ? "bg-[#1877F2]" : "bg-[#E5E7EB]")} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── STEP 1: Date & Slot ── */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Calendar */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={prevMonth}
                className="h-8 w-8 flex items-center justify-center rounded-md border border-[#E5E7EB] hover:bg-[#F7F8FA] transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-[#374151]" />
              </button>
              <span className="text-sm font-semibold text-[#111318]">
                {LUNI_RO[calMonth]} {calYear}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="h-8 w-8 flex items-center justify-center rounded-md border border-[#E5E7EB] hover:bg-[#F7F8FA] transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-[#374151]" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"].map((z) => (
                <div key={z} className="text-center text-[11px] font-medium text-[#9CA3AF] py-1">
                  {z}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {calDays().map((date, i) => {
                if (!date) return <div key={`empty-${i}`} />;

                const dateStr = format(date, "yyyy-MM-dd");
                const isPast = isBefore(date, today);
                const isTooFar = isBefore(maxDate, date);
                const isClosed = !isStationOpenOnDate(date, programLucru);
                const isDisabled = isPast || isTooFar || isClosed;
                const isSelected = selectedDate === dateStr;
                const isToday = format(today, "yyyy-MM-dd") === dateStr;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => selectDate(date)}
                    className={cn(
                      "h-10 w-full rounded-md text-sm font-medium transition-all",
                      isSelected
                        ? "bg-[#1877F2] text-white font-bold"
                        : isDisabled
                        ? "text-[#D1D5DB] cursor-not-allowed"
                        : isToday
                        ? "border border-[#1877F2] text-[#1877F2]"
                        : "hover:bg-[#EFF6FF] text-[#374151]"
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slots */}
          {selectedDate && (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-[#6B7280]" />
                <span className="text-sm font-semibold text-[#111318]">
                  Ore disponibile — {selectedDateFormatted}
                </span>
              </div>
              <SlotPicker
                statieId={statieId}
                date={selectedDate}
                selected={selectedSlot}
                onSelect={setSelectedSlot}
              />
            </div>
          )}

          <Button
            className="w-full bg-[#1877F2] hover:bg-[#1565D8] h-10"
            disabled={!step1Valid}
            onClick={() => setStep(2)}
          >
            Continuă
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* ── STEP 2: Vehicle ── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[#111318]">Selectează vehiculul</h3>

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

                {plateSearch.length < 2 && (
                  <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="w-full rounded-xl border border-dashed border-[#E5E7EB] px-4 py-3 text-sm text-[#6B7280] hover:border-[#1877F2]/50 hover:text-[#1877F2] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adaugă vehicul nou
                  </button>
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

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-10 border-[#E5E7EB]" onClick={() => setStep(1)} disabled={isSaving}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Înapoi
            </Button>
            <Button
              className="flex-1 bg-[#1877F2] hover:bg-[#1565D8] h-10"
              onClick={handleVehiculNext}
              disabled={isSaving || (!selectedVehicul && !showCreate)}
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Continuă
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Details & confirmation ── */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#1877F2]">Rezumat programare</h3>
            <Row icon={CalendarDays} label="Data" value={selectedDateFormatted} />
            <Row icon={Clock} label="Ora" value={selectedSlot ?? "—"} />
            <Row
              icon={Car}
              label="Vehicul"
              value={`${selectedVehicul?.nr_inmatriculare ?? "—"}${selectedVehicul?.marca ? ` · ${[selectedVehicul.marca, selectedVehicul.model].filter(Boolean).join(" ")}` : ""}`}
            />
            {selectedVehicul?.client && (
              <Row
                icon={User}
                label="Proprietar"
                value={`${selectedVehicul.client.nume} · ${selectedVehicul.client.telefon}`}
              />
            )}
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 space-y-4">
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

            {angajati.length > 0 ? (
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
            ) : null}

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

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-10 border-[#E5E7EB]" onClick={() => setStep(2)} disabled={isSaving}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Înapoi
            </Button>
            <Button
              className="flex-1 bg-[#1877F2] hover:bg-[#1565D8] h-10"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Se salvează...
                </>
              ) : (
                "Confirmă programarea"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Success ── */}
      {step === 4 && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 flex flex-col items-center text-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#DCFCE7]">
            <CheckCircle2 className="h-8 w-8 text-[#16A34A]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#111318]">Programare confirmată!</h2>
            <p className="text-sm text-[#6B7280] mt-1">
              Programarea a fost înregistrată cu succes.
            </p>
          </div>
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-4 py-3 w-full max-w-sm text-left space-y-1.5">
            <p className="text-xs text-[#6B7280]">
              <span className="font-medium text-[#374151]">Data:</span> {selectedDateFormatted}
            </p>
            <p className="text-xs text-[#6B7280]">
              <span className="font-medium text-[#374151]">Ora:</span> {selectedSlot}
            </p>
            <p className="text-xs text-[#6B7280]">
              <span className="font-medium text-[#374151]">Vehicul:</span> {selectedVehicul?.nr_inmatriculare}
            </p>
          </div>
          <Button
            className="bg-[#1877F2] hover:bg-[#1565D8] h-10 mt-1"
            onClick={resetFlow}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Programare nouă
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-[#1877F2] mt-0.5 shrink-0" />
      <div className="min-w-0">
        <span className="text-xs font-medium text-[#374151]">{label}: </span>
        <span className="text-xs text-[#111318]">{value}</span>
      </div>
    </div>
  );
}
