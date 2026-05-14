"use client";

import { useState } from "react";
import {
  format, addDays, isBefore, startOfDay, getDay,
} from "date-fns";
import { ro } from "date-fns/locale";
import {
  CalendarDays, Clock, User, Car, CheckCircle2,
  ChevronLeft, ChevronRight, Loader2, AlertCircle,
  MapPin, Phone, Mail, Zap, RotateCcw, Star, Wrench,
  ImageIcon, Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ── Fake station data ─────────────────────────────────────────────────────────
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
  { slot: "08:00", libere: 1 },
  { slot: "08:30", libere: 0 },
  { slot: "09:00", libere: 1 },
  { slot: "09:30", libere: 1 },
  { slot: "10:00", libere: 1 },
  { slot: "10:30", libere: 0 },
  { slot: "11:00", libere: 1 },
  { slot: "11:30", libere: 1 },
  { slot: "14:00", libere: 1 },
  { slot: "14:30", libere: 0 },
  { slot: "15:00", libere: 1 },
  { slot: "15:30", libere: 1 },
];

const FAKE_SERVICII = [
  { nume: "ITP Autoturism",    pret: "150 lei", durata: "~30 min" },
  { nume: "ITP Motocicleta",   pret: "100 lei", durata: "~20 min" },
  { nume: "ITP Microbuz",      pret: "200 lei", durata: "~45 min" },
  { nume: "ITP Remorca",       pret: "80 lei",  durata: "~15 min" },
  { nume: "Verificare frana",  pret: "50 lei",  durata: "~15 min" },
  { nume: "Verificare lumini", pret: "30 lei",  durata: "~10 min" },
];

const GALERIE_COLORS = [
  "bg-[#DBEAFE]", "bg-[#DCF5E4]", "bg-[#FEF3C7]",
  "bg-[#FCE7F3]", "bg-[#EDE9FE]", "bg-[#F3F4F6]",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const ZILE_MAP: Record<number, string> = {
  1: "luni", 2: "marti", 3: "miercuri", 4: "joi",
  5: "vineri", 6: "sambata", 0: "duminica",
};
const LUNI_RO = [
  "Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie",
  "Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie",
];

function isOpen(date: Date): boolean {
  const key = ZILE_MAP[getDay(date)];
  return !!FAKE_PROGRAM[key];
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormData {
  date: string; slot: string;
  prenume: string; nume: string;
  telefon: string; email: string;
  nrInmatriculare: string; marcaModel: string; observatii: string;
}
type BookingStep = 1 | 2 | 3 | 4;
type Tab = "programare" | "servicii" | "galerie" | "locatie";

// ── Main component ─────────────────────────────────────────────────────────────
export function BookingMockup() {
  const [activeTab, setActiveTab] = useState<Tab>("programare");
  const [step, setStep] = useState<BookingStep>(1);
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
    setActiveTab("programare");
    setCalYear(new Date().getFullYear()); setCalMonth(new Date().getMonth());
    setForm({ date:"",slot:"",prenume:"",nume:"",telefon:"",email:"",nrInmatriculare:"",marcaModel:"",observatii:"" });
  }

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

  const STEPS = [
    { n: 1, label: "Data & Ora",       icon: CalendarDays },
    { n: 2, label: "Date personale",   icon: User },
    { n: 3, label: "Confirmare",       icon: Car },
  ];

  const TABS: { key: Tab; label: string }[] = [
    { key: "programare", label: "Programare" },
    { key: "servicii",   label: "Servicii" },
    { key: "galerie",    label: "Galerie" },
    { key: "locatie",    label: "Locatie" },
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
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* Page content */}
      <div className="bg-white max-h-[680px] overflow-y-auto">

        {/* Station header */}
        <div className="bg-[#1877F2] px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-sm font-bold">{FAKE_STATIE.nume}</h1>
              </div>
              <p className="text-[11px] text-blue-200">Statie ITP autorizata RAR</p>
              <div className="flex items-center gap-1 mt-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                ))}
                <span className="text-[10px] text-blue-200 ml-1">4.9 (127 recenzii)</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-blue-200">Luni - Vineri</p>
              <p className="text-xs font-semibold">08:00 - 18:00</p>
              <span className="inline-block mt-1.5 text-[9px] font-bold bg-green-400 text-green-900 px-2 py-0.5 rounded-full">
                DESCHIS ACUM
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-white/20">
            <span className="flex items-center gap-1 text-[10px] text-blue-100">
              <MapPin className="h-3 w-3" />{FAKE_STATIE.adresa}, {FAKE_STATIE.oras}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-blue-100">
              <Phone className="h-3 w-3" />{FAKE_STATIE.telefon}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-blue-100">
              <Mail className="h-3 w-3" />{FAKE_STATIE.email}
            </span>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="border-b border-[#E5E7EB] flex text-[11px] font-medium bg-white sticky top-0 z-10">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-4 py-2.5 transition-colors border-b-2",
                activeTab === tab.key
                  ? "text-[#1877F2] border-[#1877F2]"
                  : "text-[#9CA3AF] border-transparent hover:text-[#6B7280]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Programare */}
        {activeTab === "programare" && (
          <div className="p-4 space-y-4">
            {step < 4 && (
              <h2 className="text-sm font-semibold text-[#111318]">Fa o programare</h2>
            )}

            {step < 4 && (
              <div className="flex items-center gap-2">
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const done = step > s.n;
                  const active = step === s.n;
                  return (
                    <div key={s.n} className="flex items-center gap-1.5 flex-1">
                      <div className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold shrink-0 transition-colors",
                        done   ? "bg-[#1877F2] text-white" :
                        active ? "bg-[#EFF6FF] text-[#1877F2] border-2 border-[#1877F2]" :
                                 "bg-[#F7F8FA] text-[#9CA3AF]"
                      )}>
                        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3 w-3" />}
                      </div>
                      <span className={cn(
                        "text-[10px] font-medium hidden sm:block truncate",
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
              <div className="space-y-4">
                <div className="border border-[#E5E7EB] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={prevMonth} className="h-7 w-7 flex items-center justify-center rounded-md border border-[#E5E7EB] hover:bg-[#F7F8FA]">
                      <ChevronLeft className="h-4 w-4 text-[#374151]" />
                    </button>
                    <span className="text-sm font-semibold text-[#111318]">
                      {LUNI_RO[calMonth]} {calYear}
                    </span>
                    <button onClick={nextMonth} className="h-7 w-7 flex items-center justify-center rounded-md border border-[#E5E7EB] hover:bg-[#F7F8FA]">
                      <ChevronRight className="h-4 w-4 text-[#374151]" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 mb-1">
                    {["Lu","Ma","Mi","Jo","Vi","Sa","Du"].map((z) => (
                      <div key={z} className="text-center text-[10px] font-medium text-[#9CA3AF] py-1">{z}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {calDays().map((date, i) => {
                      if (!date) return <div key={`e-${i}`} />;
                      const ds = format(date, "yyyy-MM-dd");
                      const isDisabled = isBefore(date, today) || isBefore(maxDate, date) || !isOpen(date);
                      const isSelected = form.date === ds;
                      const isToday = format(today, "yyyy-MM-dd") === ds;
                      return (
                        <button
                          key={ds}
                          disabled={isDisabled}
                          onClick={() => selectDate(date)}
                          className={cn(
                            "h-7 w-full rounded-md text-[11px] font-medium transition-all",
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

                {form.date && (
                  <div className="border border-[#E5E7EB] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-[#6B7280]" />
                      <span className="text-xs font-semibold text-[#111318]">Ore disponibile</span>
                    </div>
                    {slotsLoading && (
                      <div className="flex items-center gap-2 text-xs text-[#6B7280] py-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Se incarca...
                      </div>
                    )}
                    {!slotsLoading && slots.length > 0 && (
                      <div className="grid grid-cols-4 gap-1.5">
                        {slots.map(({ slot, libere }) => {
                          const available = libere > 0;
                          const isSelected = form.slot === slot;
                          return (
                            <button
                              key={slot}
                              disabled={!available}
                              onClick={() => available && setField("slot", slot)}
                              className={cn(
                                "flex flex-col items-center justify-center rounded-lg border py-2 text-[10px] font-medium transition-all",
                                isSelected  ? "border-[#1877F2] bg-[#1877F2] text-white" :
                                available   ? "border-[#E5E7EB] hover:border-[#1877F2]/50 hover:bg-[#EFF6FF] text-[#374151] cursor-pointer" :
                                             "border-[#E5E7EB] bg-[#F9FAFB] text-[#D1D5DB] cursor-not-allowed"
                              )}
                            >
                              <span>{slot}</span>
                              {!available && <span className="text-[8px] mt-0.5 opacity-70">Ocupat</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <Button className="w-full bg-[#1877F2] hover:bg-[#1565D8] h-9 text-sm" disabled={!step1Valid} onClick={() => setStep(2)}>
                  Continua <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="border border-[#E5E7EB] rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-[#111318]">Date personale</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Prenume *" value={form.prenume} onChange={v => setField("prenume", v)} placeholder="Ion" />
                    <Field label="Nume *"    value={form.nume}    onChange={v => setField("nume", v)}    placeholder="Popescu" />
                  </div>
                  <Field label="Telefon *" value={form.telefon} onChange={v => setField("telefon", v)} placeholder="07xx xxx xxx" type="tel" hint="Format: 07xx xxx xxx" />
                  <Field label="Email (optional)" value={form.email} onChange={v => setField("email", v)} placeholder="exemplu@email.ro" type="email" />
                </div>
                <div className="border border-[#E5E7EB] rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-[#111318]">Date vehicul</h3>
                  <Field label="Nr. inmatriculare *" value={form.nrInmatriculare} onChange={v => setField("nrInmatriculare", v.toUpperCase())} placeholder="B 123 ABC" />
                  <Field label="Marca si model (optional)" value={form.marcaModel} onChange={v => setField("marcaModel", v)} placeholder="ex: Dacia Logan" />
                  <div>
                    <label className="block text-[11px] font-medium text-[#374151] mb-1.5">Observatii (optional)</label>
                    <textarea
                      value={form.observatii}
                      onChange={e => setField("observatii", e.target.value)}
                      placeholder="Orice informatii suplimentare..."
                      rows={2}
                      className="w-full text-xs rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 resize-none text-[#111318] placeholder:text-[#9CA3AF]"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 h-9" onClick={() => setStep(1)}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Inapoi
                  </Button>
                  <Button className="flex-1 bg-[#1877F2] hover:bg-[#1565D8] h-9" disabled={!step2Valid} onClick={() => setStep(3)}>
                    Continua <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-[#1877F2]">Confirmare programare</h3>
                  <Row icon={CalendarDays} label="Data"     value={selectedDateFormatted} />
                  <Row icon={Clock}        label="Ora"      value={form.slot} />
                  <Row icon={User}         label="Persoana" value={`${form.prenume} ${form.nume} · ${form.telefon}`} />
                  <Row icon={Car}          label="Vehicul"  value={`${form.nrInmatriculare}${form.marcaModel ? ` · ${form.marcaModel}` : ""}`} />
                  {form.observatii && <Row icon={AlertCircle} label="Observatii" value={form.observatii} />}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 h-9" onClick={() => setStep(2)} disabled={pending}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Inapoi
                  </Button>
                  <Button className="flex-1 bg-[#1877F2] hover:bg-[#1565D8] h-9" onClick={handleSubmit} disabled={pending}>
                    {pending
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Se trimite...</>
                      : "Confirma programarea"}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <div className="border border-[#E5E7EB] rounded-xl p-6 flex flex-col items-center text-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#DCFCE7]">
                  <CheckCircle2 className="h-7 w-7 text-[#16A34A]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#111318]">Programare confirmata!</h2>
                  <p className="text-xs text-[#6B7280] mt-1">Programarea ta a fost inregistrata cu succes.</p>
                </div>
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-4 py-3 w-full text-left space-y-1.5">
                  <p className="text-xs text-[#6B7280]"><span className="font-medium text-[#374151]">Data:</span> {selectedDateFormatted}</p>
                  <p className="text-xs text-[#6B7280]"><span className="font-medium text-[#374151]">Ora:</span> {form.slot}</p>
                  <p className="text-xs text-[#6B7280]"><span className="font-medium text-[#374151]">Vehicul:</span> {form.nrInmatriculare}</p>
                </div>
                <p className="text-[11px] text-[#9CA3AF]">Vei fi contactat daca intervin modificari. Te asteptam!</p>
                <button onClick={reset} className="text-xs text-[#1877F2] hover:underline flex items-center gap-1">
                  <RotateCcw className="h-3 w-3" /> Reincepe demo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Servicii */}
        {activeTab === "servicii" && (
          <div className="p-4">
            <h2 className="text-sm font-semibold text-[#111318] mb-3">Servicii si preturi</h2>
            <div className="space-y-2">
              {FAKE_SERVICII.map((s) => (
                <div key={s.nume} className="flex items-center justify-between border border-[#E5E7EB] rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                      <Wrench className="h-4 w-4 text-[#1877F2]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#111318]">{s.nume}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{s.durata}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#1877F2]">{s.pret}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setActiveTab("programare")}
              className="mt-4 w-full bg-[#1877F2] text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-[#1565D8] transition-colors"
            >
              Programeaza-te acum
            </button>
          </div>
        )}

        {/* Tab: Galerie */}
        {activeTab === "galerie" && (
          <div className="p-4">
            <h2 className="text-sm font-semibold text-[#111318] mb-3">Galerie foto</h2>
            <div className="grid grid-cols-3 gap-2">
              {GALERIE_COLORS.map((color, i) => (
                <div key={i} className={cn("rounded-lg aspect-square flex items-center justify-center", color)}>
                  <ImageIcon className="h-6 w-6 text-[#9CA3AF]" />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#9CA3AF] text-center mt-3">6 fotografii disponibile</p>
          </div>
        )}

        {/* Tab: Locatie */}
        {activeTab === "locatie" && (
          <div className="p-4 space-y-4">
            <h2 className="text-sm font-semibold text-[#111318]">Locatie</h2>
            <div className="rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F3F4F6] h-36 flex items-center justify-center relative">
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: "linear-gradient(#CBD5E1 1px, transparent 1px), linear-gradient(90deg, #CBD5E1 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }} />
              <div className="relative flex flex-col items-center gap-1.5">
                <div className="h-9 w-9 rounded-full bg-[#1877F2] flex items-center justify-center shadow-lg">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <span className="text-[11px] font-semibold text-[#374151] bg-white px-2 py-0.5 rounded-full border border-[#E5E7EB] shadow-sm">
                  Auto Test Cluj
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-[#1877F2] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[#111318]">Adresa</p>
                  <p className="text-xs text-[#6B7280]">{FAKE_STATIE.adresa}, {FAKE_STATIE.oras}, jud. {FAKE_STATIE.judet}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-[#1877F2] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[#111318]">Program</p>
                  <p className="text-xs text-[#6B7280]">Luni - Vineri: 08:00 - 18:00</p>
                  <p className="text-xs text-[#6B7280]">Sambata: 08:00 - 13:00</p>
                  <p className="text-xs text-[#9CA3AF]">Duminica: Inchis</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-[#1877F2] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[#111318]">Telefon</p>
                  <p className="text-xs text-[#6B7280]">{FAKE_STATIE.telefon}</p>
                </div>
              </div>
            </div>
            <button className="w-full flex items-center justify-center gap-2 bg-[#EFF6FF] text-[#1877F2] text-xs font-semibold py-2.5 rounded-lg border border-[#BFDBFE] hover:bg-[#DBEAFE] transition-colors">
              <Navigation className="h-4 w-4" /> Deschide in Google Maps
            </button>
          </div>
        )}

        <p className="text-center text-[10px] text-[#9CA3AF] py-3 border-t border-[#F3F4F6]">
          Powered by <span className="font-semibold">VELOS.RO</span>
        </p>
      </div>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = "text", hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; hint?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-[#374151] mb-1.5">{label}</label>
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-xs rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 text-[#111318] placeholder:text-[#9CA3AF]"
      />
      {hint && <p className="text-[10px] text-[#9CA3AF] mt-1">{hint}</p>}
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────
function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-[#1877F2] mt-0.5 shrink-0" />
      <div className="min-w-0">
        <span className="text-[11px] font-medium text-[#374151]">{label}: </span>
        <span className="text-[11px] text-[#111318]">{value}</span>
      </div>
    </div>
  );
}
