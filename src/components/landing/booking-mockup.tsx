"use client";

import { useState } from "react";
import {
  format, addDays, isBefore, startOfDay, getDay,
} from "date-fns";
import { ro } from "date-fns/locale";
import {
  CalendarDays, Clock, User, Car, CheckCircle2,
  ChevronLeft, ChevronRight, Loader2, AlertCircle,
  MapPin, Phone, Mail, Zap, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ── Fake station data ────────────────────────────────────────────────────────
const FAKE_STATIE = {
  nume: "Auto Test Cluj",
  adresa: "Str. Fabricii nr. 12",
  oras: "Cluj-Napoca",
  judet: "Cluj",
  telefon: "0740 123 456",
  email: "contact@autotest-cluj.ro",
};

const FAKE_PROGRAM: Record<string, { start: string; end: string } | null> = {
  luni:     { start: "08:00", end: "18:00" },
  marti:    { start: "08:00", end: "18:00" },
  miercuri: { start: "08:00", end: "18:00" },
  joi:      { start: "08:00", end: "18:00" },
  vineri:   { start: "08:00", end: "18:00" },
  sambata:  { start: "08:00", end: "13:00" },
  duminica: null,
};

const FAKE_SLOTS = [
  { slot: "08:00", libere: 1, total: 1 },
  { slot: "08:30", libere: 0, total: 1 },
  { slot: "09:00", libere: 1, total: 1 },
  { slot: "09:30", libere: 1, total: 1 },
  { slot: "10:00", libere: 1, total: 1 },
  { slot: "10:30", libere: 0, total: 1 },
  { slot: "11:00", libere: 1, total: 1 },
  { slot: "11:30", libere: 1, total: 1 },
  { slot: "14:00", libere: 1, total: 1 },
  { slot: "14:30", libere: 0, total: 1 },
  { slot: "15:00", libere: 1, total: 1 },
  { slot: "15:30", libere: 1, total: 1 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const ZILE_MAP: Record<number, string> = {
  1: "luni", 2: "marti", 3: "miercuri", 4: "joi",
  5: "vineri", 6: "sambata", 0: "duminica",
};
const LUNI_RO = [
  "Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie",
  "Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie",
];
const ZILE_LABELS: Record<string, string> = {
  luni:"Lu", marti:"Ma", miercuri:"Mi", joi:"Jo",
  vineri:"Vi", sambata:"Sâ", duminica:"Du",
};

function isOpen(date: Date): boolean {
  const key = ZILE_MAP[getDay(date)];
  return !!FAKE_PROGRAM[key];
}

// ── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  date: string; slot: string;
  prenume: string; nume: string;
  telefon: string; email: string;
  nrInmatriculare: string; marcaModel: string; observatii: string;
}
type Step = 1 | 2 | 3 | 4;

// ── Main component ────────────────────────────────────────────────────────────
export function BookingMockup() {
  const [step, setStep] = useState<Step>(1);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [slots, setSlots] = useState<typeof FAKE_SLOTS>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState<FormData>({
    date: "", slot: "", prenume: "", nume: "",
    telefon: "", email: "", nrInmatriculare: "", marcaModel: "", observatii: "",
  });

  function setField<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm(p => ({ ...p, [k]: v }));
  }

  function reset() {
    setStep(1); setSlots([]); setSlotsLoading(false); setPending(false);
    setCalYear(new Date().getFullYear()); setCalMonth(new Date().getMonth());
    setForm({ date:"",slot:"",prenume:"",nume:"",telefon:"",email:"",nrInmatriculare:"",marcaModel:"",observatii:"" });
  }

  // Calendar
  const today = startOfDay(new Date());
  const maxDate = addDays(today, 60);

  function calDays(): (Date | null)[] {
    const first = new Date(calYear, calMonth, 1);
    const last  = new Date(calYear, calMonth + 1, 0);
    const startDow = (getDay(first) + 6) % 7;
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
    const s = format(date, "yyyy-MM-dd");
    setField("date", s); setField("slot", "");
    setSlotsLoading(true); setSlots([]);
    await new Promise(r => setTimeout(r, 500));
    setSlotsLoading(false); setSlots(FAKE_SLOTS);
  }

  async function handleSubmit() {
    setPending(true);
    await new Promise(r => setTimeout(r, 900));
    setPending(false); setStep(4);
  }

  const step1Valid = !!form.date && !!form.slot;
  const step2Valid =
    form.prenume.trim().length >= 2 &&
    form.nume.trim().length >= 2 &&
    /^07[0-9]{8}$/.test(form.telefon.replace(/\s/g, "")) &&
    form.nrInmatriculare.trim().length >= 2;

  const selectedDateFormatted = form.date
    ? format(new Date(form.date), "EEEE, d MMMM yyyy", { locale: ro })
    : "";

  const openDays = Object.entries(FAKE_PROGRAM)
    .filter(([, v]) => !!v)
    .map(([k]) => ZILE_LABELS[k]);

  const STEPS = [
    { n: 1, label: "Dată & Oră",      icon: CalendarDays },
    { n: 2, label: "Date personale",   icon: User },
    { n: 3, label: "Confirmare",       icon: Car },
  ];

  return (
    <div className="rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-xl bg-white">
      {/* Browser chrome */}
      <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-4 py-3 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-[#FCA5A5]" />
        <span className="h-3 w-3 rounded-full bg-[#FCD34D]" />
        <span className="h-3 w-3 rounded-full bg-[#86EFAC]" />
        <div className="flex-1 mx-3 bg-white border border-[#E5E7EB] rounded-md px-3 py-1.5 text-center">
          <span className="text-[11px] text-[#9CA3AF] font-mono">
            velos.ro/itp/auto-test-cluj
          </span>
        </div>
        {step === 4 && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-[10px] text-[#6B7280] hover:text-[#111318] transition-colors"
            title="Reincearca demo"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* Page content — exact match with real booking page */}
      <div className="bg-white max-h-[640px] overflow-y-auto">
        {/* Station header */}
        <header className="bg-white border-b border-[#E5E7EB] py-4 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1877F2] shrink-0">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-[#111318]">{FAKE_STATIE.nume}</h1>
              <p className="text-xs text-[#9CA3AF]">Programare ITP online</p>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 space-y-5">
          {/* Station info */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-[#374151]">
              <MapPin className="h-4 w-4 text-[#6B7280] shrink-0" />
              <span>{FAKE_STATIE.adresa}, {FAKE_STATIE.oras}, {FAKE_STATIE.judet}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-[#6B7280] shrink-0" />
              <a href={`tel:${FAKE_STATIE.telefon}`} className="text-[#1877F2] hover:underline">
                {FAKE_STATIE.telefon}
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-[#6B7280] shrink-0" />
              <a href={`mailto:${FAKE_STATIE.email}`} className="text-[#1877F2] hover:underline">
                {FAKE_STATIE.email}
              </a>
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[11px] text-[#9CA3AF]">Program:</span>
              {openDays.map((z) => (
                <span key={z} className="px-1.5 py-0.5 bg-[#EFF6FF] text-[#1877F2] text-[10px] font-semibold rounded">
                  {z}
                </span>
              ))}
            </div>
          </div>

          {/* Booking form */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-[#111318] mb-4">
              {step < 4 ? "Fă o programare" : ""}
            </h2>

            <div className="space-y-6">
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
                          done   ? "bg-[#1877F2] text-white" :
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

              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-5">
                  {/* Calendar */}
                  <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={prevMonth}
                        className="h-7 w-7 flex items-center justify-center rounded-md border border-[#E5E7EB] hover:bg-[#F7F8FA] transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4 text-[#374151]" />
                      </button>
                      <span className="text-sm font-semibold text-[#111318]">
                        {LUNI_RO[calMonth]} {calYear}
                      </span>
                      <button
                        onClick={nextMonth}
                        className="h-7 w-7 flex items-center justify-center rounded-md border border-[#E5E7EB] hover:bg-[#F7F8FA] transition-colors"
                      >
                        <ChevronRight className="h-4 w-4 text-[#374151]" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 mb-2">
                      {["Lu","Ma","Mi","Jo","Vi","Sâ","Du"].map((z) => (
                        <div key={z} className="text-center text-[11px] font-medium text-[#9CA3AF] py-1">{z}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {calDays().map((date, i) => {
                        if (!date) return <div key={`e-${i}`} />;
                        const ds = format(date, "yyyy-MM-dd");
                        const isPast   = isBefore(date, today);
                        const isTooFar = isBefore(maxDate, date);
                        const isClosed = !isOpen(date);
                        const isDisabled = isPast || isTooFar || isClosed;
                        const isSelected = form.date === ds;
                        const isToday = format(today, "yyyy-MM-dd") === ds;
                        return (
                          <button
                            key={ds}
                            disabled={isDisabled}
                            onClick={() => selectDate(date)}
                            className={cn(
                              "h-8 w-full rounded-md text-xs font-medium transition-all",
                              isSelected  ? "bg-[#1877F2] text-white font-bold" :
                              isDisabled  ? "text-[#D1D5DB] cursor-not-allowed" :
                              isToday     ? "border border-[#1877F2] text-[#1877F2]" :
                                            "hover:bg-[#EFF6FF] text-[#374151]"
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
                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-[#6B7280]" />
                        <span className="text-sm font-semibold text-[#111318]">
                          Ore disponibile — {selectedDateFormatted}
                        </span>
                      </div>
                      {slotsLoading && (
                        <div className="flex items-center gap-2 text-sm text-[#6B7280] py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Se incarca...
                        </div>
                      )}
                      {!slotsLoading && slots.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                          {slots.map(({ slot, libere }) => {
                            const available = libere > 0;
                            const isSelected = form.slot === slot;
                            return (
                              <button
                                key={slot}
                                disabled={!available}
                                onClick={() => available && setField("slot", slot)}
                                className={cn(
                                  "flex flex-col items-center justify-center rounded-lg border py-2.5 text-xs font-medium transition-all",
                                  isSelected  ? "border-[#1877F2] bg-[#1877F2] text-white shadow-sm" :
                                  available   ? "border-[#E5E7EB] hover:border-[#1877F2]/50 hover:bg-[#EFF6FF] text-[#374151] cursor-pointer" :
                                               "border-[#E5E7EB] bg-[#F9FAFB] text-[#D1D5DB] cursor-not-allowed"
                                )}
                              >
                                <span>{slot}</span>
                                {!available && <span className="text-[9px] mt-0.5 opacity-70">Ocupat</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    className="w-full bg-[#1877F2] hover:bg-[#1565D8] h-10"
                    disabled={!step1Valid}
                    onClick={() => setStep(2)}
                  >
                    Continua
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-[#111318]">Date personale</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Prenume *" value={form.prenume} onChange={v => setField("prenume", v)} placeholder="Ion" />
                      <Field label="Nume *"    value={form.nume}    onChange={v => setField("nume", v)}    placeholder="Popescu" />
                    </div>
                    <Field label="Telefon *" value={form.telefon} onChange={v => setField("telefon", v)} placeholder="07xx xxx xxx" type="tel" hint="Format: 07xx xxx xxx" />
                    <Field label="Email (optional)" value={form.email} onChange={v => setField("email", v)} placeholder="exemplu@email.ro" type="email" />
                  </div>

                  <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-[#111318]">Date vehicul</h3>
                    <Field label="Nr. inmatriculare *" value={form.nrInmatriculare} onChange={v => setField("nrInmatriculare", v.toUpperCase())} placeholder="B 123 ABC" />
                    <Field label="Marca si model (optional)" value={form.marcaModel} onChange={v => setField("marcaModel", v)} placeholder="ex: Dacia Logan" />
                    <div>
                      <label className="block text-xs font-medium text-[#374151] mb-1.5">Observatii (optional)</label>
                      <textarea
                        value={form.observatii}
                        onChange={e => setField("observatii", e.target.value)}
                        placeholder="Orice informatii suplimentare..."
                        rows={3}
                        className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 resize-none text-[#111318] placeholder:text-[#9CA3AF]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 h-10" onClick={() => setStep(1)}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Inapoi
                    </Button>
                    <Button
                      className="flex-1 bg-[#1877F2] hover:bg-[#1565D8] h-10"
                      disabled={!step2Valid}
                      onClick={() => setStep(3)}
                    >
                      Continua
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-[#1877F2]">Confirmare programare</h3>
                    <Row icon={CalendarDays} label="Data"    value={selectedDateFormatted} />
                    <Row icon={Clock}        label="Ora"     value={form.slot} />
                    <Row icon={User}         label="Persoana" value={`${form.prenume} ${form.nume} · ${form.telefon}`} />
                    <Row icon={Car}          label="Vehicul"  value={`${form.nrInmatriculare}${form.marcaModel ? ` · ${form.marcaModel}` : ""}`} />
                    {form.observatii && <Row icon={AlertCircle} label="Observatii" value={form.observatii} />}
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 h-10" onClick={() => setStep(2)} disabled={pending}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Inapoi
                    </Button>
                    <Button
                      className="flex-1 bg-[#1877F2] hover:bg-[#1565D8] h-10"
                      onClick={handleSubmit}
                      disabled={pending}
                    >
                      {pending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Se trimite...</>
                      ) : "Confirma programarea"}
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 4 */}
              {step === 4 && (
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 flex flex-col items-center text-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#DCFCE7]">
                    <CheckCircle2 className="h-8 w-8 text-[#16A34A]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#111318]">Programare confirmata!</h2>
                    <p className="text-sm text-[#6B7280] mt-1">Programarea ta a fost inregistrata cu succes.</p>
                  </div>
                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-4 py-3 w-full text-left space-y-1.5">
                    <p className="text-xs text-[#6B7280]"><span className="font-medium text-[#374151]">Data:</span> {selectedDateFormatted}</p>
                    <p className="text-xs text-[#6B7280]"><span className="font-medium text-[#374151]">Ora:</span> {form.slot}</p>
                    <p className="text-xs text-[#6B7280]"><span className="font-medium text-[#374151]">Vehicul:</span> {form.nrInmatriculare}</p>
                  </div>
                  <p className="text-xs text-[#9CA3AF]">Vei fi contactat daca intervin modificari. Te asteptam!</p>
                  <button onClick={reset} className="text-xs text-[#1877F2] hover:underline flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" /> Reincepe demo
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-[11px] text-[#9CA3AF] pb-4">
            Powered by <span className="font-semibold">VELOS.RO</span>
          </p>
        </main>
      </div>
    </div>
  );
}

// ── Field ────────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = "text", hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#374151] mb-1.5">{label}</label>
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 text-[#111318] placeholder:text-[#9CA3AF]"
      />
      {hint && <p className="text-[11px] text-[#9CA3AF] mt-1">{hint}</p>}
    </div>
  );
}

// ── Row ──────────────────────────────────────────────────────────────────────
function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
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
