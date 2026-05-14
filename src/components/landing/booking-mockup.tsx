"use client";

import { useState } from "react";
import { format, addDays, parseISO, isBefore, startOfDay, getDay } from "date-fns";
import { ro } from "date-fns/locale";
import {
  CalendarDays, Clock, User, Car, CheckCircle2,
  ChevronLeft, ChevronRight, Loader2, AlertCircle,
  MapPin, Phone, Mail, Zap, RotateCcw, Star, Wrench,
  ImageIcon, Navigation, Globe, MousePointerClick,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ── Demo data ─────────────────────────────────────────────────────────────────
const STATIE = {
  nume: "Auto Test Cluj",
  adresa: "Str. Fabricii nr. 12",
  oras: "Cluj-Napoca",
  judet: "Cluj",
  telefon: "0740 123 456",
  email: "contact@autotest-cluj.ro",
  rating: 4.9,
  recenzii: 127,
};

type ProgramLucru = Record<string, { start: string; end: string } | null>;

const PROGRAM_LUCRU: ProgramLucru = {
  luni:     { start: "08:00", end: "18:00" },
  marti:    { start: "08:00", end: "18:00" },
  miercuri: { start: "08:00", end: "18:00" },
  joi:      { start: "08:00", end: "18:00" },
  vineri:   { start: "08:00", end: "18:00" },
  sambata:  { start: "08:00", end: "13:00" },
  duminica: null,
};

const PROGRAM_DISPLAY = [
  { zi: "Luni - Vineri", ore: "08:00 - 18:00", inchis: false },
  { zi: "Sâmbătă",       ore: "08:00 - 13:00", inchis: false },
  { zi: "Duminică",      ore: "Închis",         inchis: true  },
];

const SERVICII = [
  { nume: "ITP Autoturism",    pret: "150 lei", durata: "~30 min" },
  { nume: "ITP Motocicletă",   pret: "100 lei", durata: "~20 min" },
  { nume: "ITP Microbuz",      pret: "200 lei", durata: "~45 min" },
  { nume: "ITP Remorcă",       pret: "80 lei",  durata: "~15 min" },
  { nume: "Verificare frână",  pret: "50 lei",  durata: "~15 min" },
  { nume: "Verificare lumini", pret: "30 lei",  durata: "~10 min" },
];

const GALERIE_BG = [
  "bg-[#DBEAFE]", "bg-[#DCF5E4]", "bg-[#FEF3C7]",
  "bg-[#FCE7F3]", "bg-[#EDE9FE]", "bg-[#F1F5F9]",
];

const SLOTS_FAKE = [
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const ZILE_MAP: Record<number, string> = {
  1: "luni", 2: "marti", 3: "miercuri", 4: "joi",
  5: "vineri", 6: "sambata", 0: "duminica",
};
const ZILE_LABELS: Record<string, string> = {
  luni: "Lu", marti: "Ma", miercuri: "Mi", joi: "Jo",
  vineri: "Vi", sambata: "Sâ", duminica: "Du",
};
const LUNI_RO = [
  "Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie",
  "Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie",
];

function isOpen(date: Date): boolean {
  return !!PROGRAM_LUCRU[ZILE_MAP[getDay(date)]];
}

interface FormData {
  date: string; slot: string; prenume: string; nume: string;
  telefon: string; email: string; nrInmatriculare: string;
  marcaModel: string; observatii: string;
}
type Step = 1 | 2 | 3 | 4;

// ── Component ─────────────────────────────────────────────────────────────────
export function BookingMockup() {
  const [revealed, setRevealed] = useState(false);

  // booking form state
  const [step, setStep] = useState<Step>(1);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [slots, setSlots] = useState<typeof SLOTS_FAKE>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [form, setForm] = useState<FormData>({
    date: "", slot: "", prenume: "", nume: "",
    telefon: "", email: "", nrInmatriculare: "", marcaModel: "", observatii: "",
  });

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function resetDemo() {
    setStep(1); setSlots([]); setSlotsLoading(false); setSlotsError(null); setIsPending(false);
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

  async function selectDate(date: Date) {
    const dateStr = format(date, "yyyy-MM-dd");
    setField("date", dateStr); setField("slot", "");
    setSlotsLoading(true); setSlotsError(null); setSlots([]);
    await new Promise(r => setTimeout(r, 500));
    setSlotsLoading(false); setSlots(SLOTS_FAKE);
  }

  function step1Valid() { return !!form.date && !!form.slot; }
  function step2Valid() {
    return (
      form.prenume.trim().length >= 2 &&
      form.nume.trim().length >= 2 &&
      /^07[0-9]{8}$/.test(form.telefon.replace(/\s/g, "")) &&
      form.nrInmatriculare.trim().length >= 2
    );
  }

  async function handleSubmit() {
    setIsPending(true);
    await new Promise(r => setTimeout(r, 900));
    setIsPending(false); setStep(4);
  }

  const STEPS = [
    { n: 1, label: "Dată & Oră",      icon: CalendarDays },
    { n: 2, label: "Date personale",   icon: User },
    { n: 3, label: "Confirmare",       icon: Car },
  ];

  const selectedDateFormatted = form.date
    ? format(parseISO(form.date), "EEEE, d MMMM yyyy", { locale: ro })
    : "";

  const openDays = Object.entries(PROGRAM_LUCRU)
    .filter(([, v]) => !!v)
    .map(([k]) => ZILE_LABELS[k] ?? k);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-xl bg-white">

      {/* Browser chrome */}
      <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-4 py-3 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-[#FCA5A5]" />
        <span className="h-3 w-3 rounded-full bg-[#FCD34D]" />
        <span className="h-3 w-3 rounded-full bg-[#86EFAC]" />
        <div className="flex-1 mx-3 bg-white border border-[#E5E7EB] rounded-md px-3 py-1.5 text-center">
          <span className="text-[11px] text-[#9CA3AF] font-mono">velos.ro/itp/auto-test-cluj</span>
        </div>
        {revealed && step === 4 && (
          <button onClick={resetDemo} className="flex items-center gap-1 text-[10px] text-[#6B7280] hover:text-[#111318] transition-colors">
            <RotateCcw className="h-3 w-3" />Reset
          </button>
        )}
      </div>

      {/* Page wrapper */}
      <div className="relative max-h-[680px] overflow-y-auto">

        {/* ── Full ITP Smart Page content ── */}
        <div className={cn("bg-[#F7F8FA]", !revealed && "blur-sm pointer-events-none select-none")}>

          {/* Hero header */}
          <div className="bg-[#1877F2] px-5 py-5 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 shrink-0">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <h1 className="text-sm font-bold">{STATIE.nume}</h1>
                </div>
                <p className="text-[11px] text-blue-200 mb-2">Stație ITP autorizată RAR</p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                  ))}
                  <span className="text-[10px] text-blue-200 ml-1">{STATIE.rating} ({STATIE.recenzii} recenzii)</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-blue-200">Luni - Vineri</p>
                <p className="text-xs font-semibold">08:00 - 18:00</p>
                <span className="inline-block mt-1.5 text-[9px] font-bold bg-green-400 text-green-900 px-2 py-0.5 rounded-full">
                  DESCHIS
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-white/20">
              <span className="flex items-center gap-1 text-[10px] text-blue-100">
                <MapPin className="h-3 w-3" />{STATIE.adresa}, {STATIE.oras}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-blue-100">
                <Phone className="h-3 w-3" />{STATIE.telefon}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-blue-100">
                <Mail className="h-3 w-3" />{STATIE.email}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-5">

            {/* ── PROGRAMARE ──────────────────────────────────── */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="text-[11px] text-[#9CA3AF]">Program:</span>
                {openDays.map(z => (
                  <span key={z} className="px-1.5 py-0.5 bg-[#EFF6FF] text-[#1877F2] text-[10px] font-semibold rounded">{z}</span>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-[#111318] mb-4">Fă o programare</h2>
              <div className="space-y-6">

                {/* Step indicator */}
                {step < 4 && (
                  <div className="flex items-center gap-2">
                    {STEPS.map((s, i) => {
                      const Icon = s.icon;
                      const done = step > s.n, active = step === s.n;
                      return (
                        <div key={s.n} className="flex items-center gap-2 flex-1">
                          <div className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 transition-colors",
                            done ? "bg-[#1877F2] text-white" : active ? "bg-[#EFF6FF] text-[#1877F2] border-2 border-[#1877F2]" : "bg-[#F7F8FA] text-[#9CA3AF]"
                          )}>
                            {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                          </div>
                          <span className={cn("text-xs font-medium hidden sm:block", active ? "text-[#1877F2]" : done ? "text-[#374151]" : "text-[#9CA3AF]")}>
                            {s.label}
                          </span>
                          {i < STEPS.length - 1 && <div className={cn("flex-1 h-px", done ? "bg-[#1877F2]" : "bg-[#E5E7EB]")} />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Step 1 */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <button type="button" onClick={() => { if (calMonth===0){setCalYear(y=>y-1);setCalMonth(11);}else setCalMonth(m=>m-1); }} className="h-7 w-7 flex items-center justify-center rounded-md border border-[#E5E7EB] hover:bg-[#F7F8FA] transition-colors">
                          <ChevronLeft className="h-4 w-4 text-[#374151]" />
                        </button>
                        <span className="text-sm font-semibold text-[#111318]">{LUNI_RO[calMonth]} {calYear}</span>
                        <button type="button" onClick={() => { if (calMonth===11){setCalYear(y=>y+1);setCalMonth(0);}else setCalMonth(m=>m+1); }} className="h-7 w-7 flex items-center justify-center rounded-md border border-[#E5E7EB] hover:bg-[#F7F8FA] transition-colors">
                          <ChevronRight className="h-4 w-4 text-[#374151]" />
                        </button>
                      </div>
                      <div className="grid grid-cols-7 mb-2">
                        {["Lu","Ma","Mi","Jo","Vi","Sâ","Du"].map(z => (
                          <div key={z} className="text-center text-[11px] font-medium text-[#9CA3AF] py-1">{z}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-0.5">
                        {calDays().map((date, i) => {
                          if (!date) return <div key={`e-${i}`} />;
                          const ds = format(date, "yyyy-MM-dd");
                          const disabled = isBefore(date, today) || isBefore(maxDate, date) || !isOpen(date);
                          const selected = form.date === ds;
                          const isToday  = format(today, "yyyy-MM-dd") === ds;
                          return (
                            <button key={ds} type="button" disabled={disabled} onClick={() => selectDate(date)}
                              className={cn("h-8 w-full rounded-md text-xs font-medium transition-all",
                                selected  ? "bg-[#1877F2] text-white font-bold" :
                                disabled  ? "text-[#D1D5DB] cursor-not-allowed" :
                                isToday   ? "border border-[#1877F2] text-[#1877F2]" :
                                            "hover:bg-[#EFF6FF] text-[#374151]"
                              )}>
                              {date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {form.date && (
                      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="h-4 w-4 text-[#6B7280]" />
                          <span className="text-sm font-semibold text-[#111318]">Ore disponibile — {selectedDateFormatted}</span>
                        </div>
                        {slotsLoading && <div className="flex items-center gap-2 text-sm text-[#6B7280] py-4"><Loader2 className="h-4 w-4 animate-spin" />Se încarcă...</div>}
                        {slotsError  && <div className="flex items-center gap-2 text-sm text-[#DC2626] py-2"><AlertCircle className="h-4 w-4 shrink-0" />{slotsError}</div>}
                        {!slotsLoading && !slotsError && slots.length === 0 && <p className="text-sm text-[#6B7280] py-4 text-center">Niciun slot disponibil.</p>}
                        {!slotsLoading && slots.length > 0 && (
                          <div className="grid grid-cols-4 gap-2">
                            {slots.map(({ slot, libere, total }) => {
                              const av = libere > 0, sel = form.slot === slot;
                              return (
                                <button key={slot} type="button" disabled={!av} onClick={() => av && setField("slot", slot)}
                                  className={cn("flex flex-col items-center justify-center rounded-lg border py-2.5 text-xs font-medium transition-all",
                                    sel ? "border-[#1877F2] bg-[#1877F2] text-white shadow-sm" :
                                    av  ? "border-[#E5E7EB] hover:border-[#1877F2]/50 hover:bg-[#EFF6FF] text-[#374151] cursor-pointer" :
                                          "border-[#E5E7EB] bg-[#F9FAFB] text-[#D1D5DB] cursor-not-allowed"
                                  )}>
                                  <span>{slot}</span>
                                  {total > 1 && <span className="text-[9px] mt-0.5 opacity-70">{av ? `${libere}/${total}` : "Ocupat"}</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    <Button className="w-full bg-[#1877F2] hover:bg-[#1565D8] h-10" disabled={!step1Valid()} onClick={() => setStep(2)}>
                      Continuă <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-4">
                      <h3 className="text-sm font-semibold text-[#111318]">Date personale</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Prenume *" value={form.prenume} onChange={v => setField("prenume", v)} placeholder="Ion" />
                        <Field label="Nume *"    value={form.nume}    onChange={v => setField("nume", v)}    placeholder="Popescu" />
                      </div>
                      <Field label="Telefon *"        value={form.telefon}  onChange={v => setField("telefon", v)}  placeholder="07xx xxx xxx" type="tel" hint="Format: 07xx xxx xxx" />
                      <Field label="Email (opțional)" value={form.email}    onChange={v => setField("email", v)}    placeholder="exemplu@email.ro" type="email" />
                    </div>
                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-4">
                      <h3 className="text-sm font-semibold text-[#111318]">Date vehicul</h3>
                      <Field label="Nr. înmatriculare *"        value={form.nrInmatriculare} onChange={v => setField("nrInmatriculare", v.toUpperCase())} placeholder="B 123 ABC" />
                      <Field label="Marcă și model (opțional)"  value={form.marcaModel}      onChange={v => setField("marcaModel", v)}      placeholder="ex: Dacia Logan" />
                      <div>
                        <label className="block text-xs font-medium text-[#374151] mb-1.5">Observații (opțional)</label>
                        <textarea value={form.observatii} onChange={e => setField("observatii", e.target.value)}
                          placeholder="Orice informații suplimentare..." rows={3}
                          className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 resize-none text-[#111318] placeholder:text-[#9CA3AF]" />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 h-10" onClick={() => setStep(1)}><ChevronLeft className="h-4 w-4 mr-1" />Înapoi</Button>
                      <Button className="flex-1 bg-[#1877F2] hover:bg-[#1565D8] h-10" disabled={!step2Valid()} onClick={() => setStep(3)}>Continuă <ChevronRight className="h-4 w-4 ml-1" /></Button>
                    </div>
                  </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-[#1877F2]">Confirmare programare</h3>
                      <Row icon={CalendarDays} label="Data"     value={selectedDateFormatted} />
                      <Row icon={Clock}        label="Ora"      value={form.slot} />
                      <Row icon={User}         label="Persoană" value={`${form.prenume} ${form.nume} · ${form.telefon}`} />
                      <Row icon={Car}          label="Vehicul"  value={`${form.nrInmatriculare}${form.marcaModel ? ` · ${form.marcaModel}` : ""}`} />
                      {form.observatii && <Row icon={AlertCircle} label="Observații" value={form.observatii} />}
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 h-10" onClick={() => setStep(2)} disabled={isPending}><ChevronLeft className="h-4 w-4 mr-1" />Înapoi</Button>
                      <Button className="flex-1 bg-[#1877F2] hover:bg-[#1565D8] h-10" onClick={handleSubmit} disabled={isPending}>
                        {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Se trimite...</> : "Confirmă programarea"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4 */}
                {step === 4 && (
                  <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 flex flex-col items-center text-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#DCFCE7]">
                      <CheckCircle2 className="h-8 w-8 text-[#16A34A]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#111318]">Programare confirmată!</h2>
                      <p className="text-sm text-[#6B7280] mt-1">Programarea ta a fost înregistrată cu succes.</p>
                    </div>
                    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-4 py-3 w-full text-left space-y-1.5">
                      <p className="text-xs text-[#6B7280]"><span className="font-medium text-[#374151]">Data:</span> {selectedDateFormatted}</p>
                      <p className="text-xs text-[#6B7280]"><span className="font-medium text-[#374151]">Ora:</span> {form.slot}</p>
                      <p className="text-xs text-[#6B7280]"><span className="font-medium text-[#374151]">Vehicul:</span> {form.nrInmatriculare}</p>
                    </div>
                    <p className="text-xs text-[#9CA3AF]">Vei fi contactat dacă intervin modificări. Te așteptăm!</p>
                    <button onClick={resetDemo} className="text-xs text-[#1877F2] hover:underline flex items-center gap-1">
                      <RotateCcw className="h-3 w-3" />Reincepe demo
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* ── SERVICII ──────────────────────────────────────── */}
            <div>
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2 px-1">Servicii și prețuri</p>
              <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                {SERVICII.map((s, i) => (
                  <div key={s.nume} className={cn("flex items-center justify-between px-4 py-3", i !== SERVICII.length - 1 && "border-b border-[#F3F4F6]")}>
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
            </div>

            {/* ── GALERIE ───────────────────────────────────────── */}
            <div>
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2 px-1">Galerie foto</p>
              <div className="grid grid-cols-3 gap-2">
                {GALERIE_BG.map((bg, i) => (
                  <div key={i} className={cn("rounded-xl aspect-square flex items-center justify-center border border-[#E5E7EB]", bg)}>
                    <ImageIcon className="h-5 w-5 text-[#9CA3AF]" />
                  </div>
                ))}
              </div>
            </div>

            {/* ── LOCATIE ───────────────────────────────────────── */}
            <div>
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2 px-1">Locație</p>
              <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                {/* Fake map */}
                <div className="h-32 bg-[#F1F5F9] flex items-center justify-center relative">
                  <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(#CBD5E1 1px,transparent 1px),linear-gradient(90deg,#CBD5E1 1px,transparent 1px)", backgroundSize: "18px 18px" }} />
                  <div className="relative flex flex-col items-center gap-1.5">
                    <div className="h-9 w-9 rounded-full bg-[#1877F2] flex items-center justify-center shadow-md">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-[10px] font-semibold text-[#374151] bg-white px-2 py-0.5 rounded-full border border-[#E5E7EB] shadow-sm">
                      {STATIE.nume}
                    </span>
                  </div>
                </div>
                {/* Info */}
                <div className="px-4 py-3 space-y-2.5 border-t border-[#F3F4F6]">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-[#6B7280] mt-0.5 shrink-0" />
                    <span className="text-xs text-[#374151]">{STATIE.adresa}, {STATIE.oras}, jud. {STATIE.judet}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="h-4 w-4 text-[#6B7280] mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      {PROGRAM_DISPLAY.map(p => (
                        <p key={p.zi} className="text-xs">
                          <span className="text-[#374151]">{p.zi}: </span>
                          <span className={p.inchis ? "text-[#9CA3AF]" : "font-medium text-[#111318]"}>{p.ore}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                  <button className="w-full flex items-center justify-center gap-2 bg-[#EFF6FF] text-[#1877F2] text-xs font-semibold py-2 rounded-lg border border-[#BFDBFE] hover:bg-[#DBEAFE] transition-colors">
                    <Navigation className="h-3.5 w-3.5" />Deschide în Google Maps
                  </button>
                </div>
              </div>
            </div>

            {/* ── CONTACT ───────────────────────────────────────── */}
            <div>
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2 px-1">Contact</p>
              <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                <a href={`tel:${STATIE.telefon}`} className="flex items-center gap-3 px-4 py-3 border-b border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-[#1877F2]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#9CA3AF]">Telefon</p>
                    <p className="text-xs font-semibold text-[#1877F2]">{STATIE.telefon}</p>
                  </div>
                </a>
                <a href={`mailto:${STATIE.email}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F9FAFB] transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-[#1877F2]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#9CA3AF]">Email</p>
                    <p className="text-xs font-semibold text-[#1877F2]">{STATIE.email}</p>
                  </div>
                </a>
              </div>
            </div>

            <p className="text-center text-[11px] text-[#9CA3AF] pb-2">
              Powered by <span className="font-semibold">VELOS.RO</span>
            </p>

          </div>{/* /p-4 */}
        </div>{/* /page content */}

        {/* ── Cover overlay ──────────────────────────────────── */}
        {!revealed && (
          <div
            className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer"
            style={{ background: "rgba(10,15,30,0.35)" }}
            onClick={() => setRevealed(true)}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] px-7 py-6 flex flex-col items-center gap-3 text-center max-w-[240px] mx-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1877F2]">
                <Globe className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#111318]">ITP Smart Page</p>
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                  Mini-site-ul complet al stației tale. Apasă pentru a testa demo-ul interactiv.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-[#1877F2] px-4 py-1.5 rounded-full">
                <MousePointerClick className="h-3.5 w-3.5" />Încearcă demo-ul
              </span>
            </div>
          </div>
        )}

      </div>{/* /relative */}
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
      <label className="block text-xs font-medium text-[#374151] mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 text-[#111318] placeholder:text-[#9CA3AF]" />
      {hint && <p className="text-[11px] text-[#9CA3AF] mt-1">{hint}</p>}
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────
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
