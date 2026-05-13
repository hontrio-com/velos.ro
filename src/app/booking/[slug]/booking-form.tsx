"use client";

import { useState, useTransition } from "react";
import { format, addDays, parseISO, isBefore, startOfDay, getDay } from "date-fns";
import { ro } from "date-fns/locale";
import {
  CalendarDays,
  Clock,
  User,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getBookingAvailabilityAction, createBookingAction } from "@/lib/actions/booking";
import type { SlotInfo } from "@/lib/actions/booking";

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

const ZILE_SCURT = ["Du", "Lu", "Ma", "Mi", "Jo", "Vi", "Sâ"];
const LUNI_RO = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];

interface BookingFormProps {
  statieId: string;
  programLucru: ProgramLucru | null;
}

interface FormData {
  date: string;
  slot: string;
  nume: string;
  prenume: string;
  telefon: string;
  email: string;
  nrInmatriculare: string;
  marcaModel: string;
  observatii: string;
}

type Step = 1 | 2 | 3 | 4;

function isStationOpenOnDate(date: Date, programLucru: ProgramLucru | null): boolean {
  if (!programLucru) return false;
  const dayKey = ZILE_MAP[getDay(date)];
  return !!programLucru[dayKey];
}

export function BookingForm({ statieId, programLucru }: BookingFormProps) {
  const [step, setStep] = useState<Step>(1);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState<FormData>({
    date: "",
    slot: "",
    nume: "",
    prenume: "",
    telefon: "",
    email: "",
    nrInmatriculare: "",
    marcaModel: "",
    observatii: "",
  });

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const today = startOfDay(new Date());
  const maxDate = addDays(today, 60);

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
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  }

  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  }

  async function selectDate(date: Date) {
    const dateStr = format(date, "yyyy-MM-dd");
    setField("date", dateStr);
    setField("slot", "");
    setSlotsLoading(true);
    setSlotsError(null);
    setSlots([]);

    const result = await getBookingAvailabilityAction(statieId, dateStr);
    setSlotsLoading(false);
    if (result.error) {
      setSlotsError(result.error);
    } else if (result.inchis) {
      setSlotsError("Stația este închisă în această zi.");
    } else {
      setSlots(result.slots);
    }
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function step1Valid() { return !!form.date && !!form.slot; }
  function step2Valid() {
    return (
      form.nume.trim().length >= 2 &&
      form.prenume.trim().length >= 2 &&
      /^07[0-9]{8}$/.test(form.telefon.replace(/\s/g, "")) &&
      form.nrInmatriculare.trim().length >= 2
    );
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  function handleSubmit() {
    setSubmitError(null);
    startTransition(async () => {
      const result = await createBookingAction({
        statieId,
        date: form.date,
        slot: form.slot,
        nume: form.nume.trim(),
        prenume: form.prenume.trim(),
        telefon: form.telefon.replace(/\s/g, ""),
        email: form.email.trim() || undefined,
        nrInmatriculare: form.nrInmatriculare.trim(),
        marcaModel: form.marcaModel.trim() || undefined,
        observatii: form.observatii.trim() || undefined,
      });

      if (result.success) {
        setStep(4);
      } else {
        setSubmitError(result.error ?? "Eroare la trimitere");
      }
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const steps = [
    { n: 1, label: "Dată & Oră", icon: CalendarDays },
    { n: 2, label: "Date personale", icon: User },
    { n: 3, label: "Confirmare", icon: Car },
  ];

  const selectedDateFormatted = form.date
    ? format(parseISO(form.date), "EEEE, d MMMM yyyy", { locale: ro })
    : "";

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      {step < 4 && (
        <div className="flex items-center gap-2">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.n;
            const active = step === s.n;
            return (
              <div key={s.n} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 transition-colors",
                  done ? "bg-[#1877F2] text-white" :
                  active ? "bg-[#EFF6FF] text-[#1877F2] border-2 border-[#1877F2]" :
                  "bg-[#F3F4F6] text-[#9CA3AF]"
                )}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <span className={cn(
                  "text-xs font-medium hidden sm:block",
                  active ? "text-[#1877F2]" : done ? "text-[#374151]" : "text-[#9CA3AF]"
                )}>
                  {s.label}
                </span>
                {i < steps.length - 1 && (
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
          <div className="bg-white border border-[#F3F4F6] rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={prevMonth}
                className="h-7 w-7 flex items-center justify-center rounded-md border border-[#E5E7EB] hover:bg-[#F3F4F6] transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-[#374151]" />
              </button>
              <span className="text-sm font-semibold text-[#111318]">
                {LUNI_RO[calMonth]} {calYear}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="h-7 w-7 flex items-center justify-center rounded-md border border-[#E5E7EB] hover:bg-[#F3F4F6] transition-colors"
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
            <div className="grid grid-cols-7 gap-0.5">
              {calDays().map((date, i) => {
                if (!date) return <div key={`empty-${i}`} />;

                const dateStr = format(date, "yyyy-MM-dd");
                const isPast = isBefore(date, today);
                const isTooFar = isBefore(maxDate, date);
                const isClosed = !isStationOpenOnDate(date, programLucru);
                const isDisabled = isPast || isTooFar || isClosed;
                const isSelected = form.date === dateStr;
                const isToday = format(today, "yyyy-MM-dd") === dateStr;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => selectDate(date)}
                    className={cn(
                      "h-8 w-full rounded-md text-xs font-medium transition-all",
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
          {form.date && (
            <div className="bg-white border border-[#F3F4F6] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-[#6B7280]" />
                <span className="text-sm font-semibold text-[#111318]">
                  Ore disponibile — {selectedDateFormatted}
                </span>
              </div>

              {slotsLoading && (
                <div className="flex items-center gap-2 text-sm text-[#6B7280] py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Se încarcă...
                </div>
              )}

              {slotsError && (
                <div className="flex items-center gap-2 text-sm text-[#DC2626] py-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {slotsError}
                </div>
              )}

              {!slotsLoading && !slotsError && slots.length === 0 && (
                <p className="text-sm text-[#6B7280] py-4 text-center">Niciun slot disponibil.</p>
              )}

              {!slotsLoading && slots.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map(({ slot, libere, total }) => {
                    const available = libere > 0;
                    const isSelected = form.slot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={!available}
                        onClick={() => available && setField("slot", slot)}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-lg border py-2.5 text-xs font-medium transition-all",
                          isSelected
                            ? "border-[#1877F2] bg-[#1877F2] text-white shadow-sm"
                            : available
                            ? "border-[#E5E7EB] hover:border-[#1877F2]/50 hover:bg-[#EFF6FF] text-[#374151] cursor-pointer"
                            : "border-[#F3F4F6] bg-[#F9FAFB] text-[#D1D5DB] cursor-not-allowed"
                        )}
                      >
                        <span>{slot}</span>
                        {total > 1 && (
                          <span className="text-[9px] mt-0.5 opacity-70">
                            {available ? `${libere}/${total}` : "Ocupat"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <Button
            className="w-full bg-[#1877F2] hover:bg-[#1565D8] h-10"
            disabled={!step1Valid()}
            onClick={() => setStep(2)}
          >
            Continuă
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* ── STEP 2: Personal details ── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-white border border-[#F3F4F6] rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-[#111318]">Date personale</h3>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Prenume *" value={form.prenume} onChange={(v) => setField("prenume", v)} placeholder="Ion" />
              <Field label="Nume *" value={form.nume} onChange={(v) => setField("nume", v)} placeholder="Popescu" />
            </div>

            <Field
              label="Telefon *"
              value={form.telefon}
              onChange={(v) => setField("telefon", v)}
              placeholder="07xx xxx xxx"
              type="tel"
              hint="Format: 07xx xxx xxx"
            />

            <Field
              label="Email (opțional)"
              value={form.email}
              onChange={(v) => setField("email", v)}
              placeholder="exemplu@email.ro"
              type="email"
            />
          </div>

          <div className="bg-white border border-[#F3F4F6] rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-[#111318]">Date vehicul</h3>

            <Field
              label="Nr. înmatriculare *"
              value={form.nrInmatriculare}
              onChange={(v) => setField("nrInmatriculare", v.toUpperCase())}
              placeholder="B 123 ABC"
            />

            <Field
              label="Marcă și model (opțional)"
              value={form.marcaModel}
              onChange={(v) => setField("marcaModel", v)}
              placeholder="ex: Dacia Logan"
            />

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">
                Observații (opțional)
              </label>
              <textarea
                value={form.observatii}
                onChange={(e) => setField("observatii", e.target.value)}
                placeholder="Orice informații suplimentare..."
                rows={3}
                className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 resize-none text-[#111318] placeholder:text-[#9CA3AF]"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-10" onClick={() => setStep(1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Înapoi
            </Button>
            <Button
              className="flex-1 bg-[#1877F2] hover:bg-[#1565D8] h-10"
              disabled={!step2Valid()}
              onClick={() => setStep(3)}
            >
              Continuă
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Confirmation ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#1877F2]">Confirmare programare</h3>

            <Row icon={CalendarDays} label="Data" value={selectedDateFormatted} />
            <Row icon={Clock} label="Ora" value={form.slot} />
            <Row
              icon={User}
              label="Persoană"
              value={`${form.prenume} ${form.nume} · ${form.telefon}`}
            />
            <Row icon={Car} label="Vehicul" value={`${form.nrInmatriculare}${form.marcaModel ? ` · ${form.marcaModel}` : ""}`} />
            {form.observatii && (
              <Row icon={AlertCircle} label="Observații" value={form.observatii} />
            )}
          </div>

          {submitError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {submitError}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-10" onClick={() => setStep(2)} disabled={isPending}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Înapoi
            </Button>
            <Button
              className="flex-1 bg-[#1877F2] hover:bg-[#1565D8] h-10"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Se trimite...
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
        <div className="bg-white border border-[#F3F4F6] rounded-xl p-8 flex flex-col items-center text-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#DCFCE7]">
            <CheckCircle2 className="h-8 w-8 text-[#16A34A]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#111318]">Programare confirmată!</h2>
            <p className="text-sm text-[#6B7280] mt-1">
              Programarea ta a fost înregistrată cu succes.
            </p>
          </div>
          <div className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-lg px-4 py-3 w-full text-left space-y-1.5">
            <p className="text-xs text-[#6B7280]">
              <span className="font-medium text-[#374151]">Data:</span>{" "}
              {selectedDateFormatted}
            </p>
            <p className="text-xs text-[#6B7280]">
              <span className="font-medium text-[#374151]">Ora:</span> {form.slot}
            </p>
            <p className="text-xs text-[#6B7280]">
              <span className="font-medium text-[#374151]">Vehicul:</span> {form.nrInmatriculare}
            </p>
          </div>
          <p className="text-xs text-[#9CA3AF]">
            Vei fi contactat dacă intervin modificări. Te așteptăm!
          </p>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#374151] mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 text-[#111318] placeholder:text-[#9CA3AF]"
      />
      {hint && <p className="text-[11px] text-[#9CA3AF] mt-1">{hint}</p>}
    </div>
  );
}

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
