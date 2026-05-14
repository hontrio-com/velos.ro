"use client";

import { useState } from "react";
import { format, addDays, isBefore, startOfDay, getDay } from "date-fns";
import { ro } from "date-fns/locale";
import {
  CalendarDays, Clock, User, Car, CheckCircle2, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, MapPin, Phone, Mail, Zap, RotateCcw, Star, Wrench,
  ImageIcon, Navigation, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ── Demo data ─────────────────────────────────────────────────────────────────
const STATIE = {
  nume: "Auto Test Cluj",
  subtitlu: "Statie ITP autorizata RAR",
  adresa: "Str. Fabricii nr. 12",
  oras: "Cluj-Napoca",
  judet: "Cluj",
  telefon: "0740 123 456",
  email: "contact@autotest-cluj.ro",
  rating: "4.9",
  recenzii: 127,
};

const PROGRAM = [
  { zi: "Luni - Vineri", ore: "08:00 - 18:00" },
  { zi: "Sâmbătă",       ore: "08:00 - 13:00" },
  { zi: "Duminică",      ore: "Închis" },
];

const SERVICII = [
  { nume: "ITP Autoturism",    pret: "150 lei", durata: "~30 min" },
  { nume: "ITP Motocicletă",   pret: "100 lei", durata: "~20 min" },
  { nume: "ITP Microbuz",      pret: "200 lei", durata: "~45 min" },
  { nume: "ITP Remorcă",       pret: "80 lei",  durata: "~15 min" },
  { nume: "Verificare frână",  pret: "50 lei",  durata: "~15 min" },
  { nume: "Verificare lumini", pret: "30 lei",  durata: "~10 min" },
];

const GALERIE = ["bg-[#DBEAFE]", "bg-[#DCF5E4]", "bg-[#FEF3C7]", "bg-[#FCE7F3]", "bg-[#EDE9FE]", "bg-[#F1F5F9]"];

const PROGRAM_LUCRU: Record<string, { start: string; end: string } | null> = {
  luni: { start: "08:00", end: "18:00" }, marti: { start: "08:00", end: "18:00" },
  miercuri: { start: "08:00", end: "18:00" }, joi: { start: "08:00", end: "18:00" },
  vineri: { start: "08:00", end: "18:00" }, sambata: { start: "08:00", end: "13:00" },
  duminica: null,
};

const SLOTS_FAKE = [
  { slot: "08:00", libere: 1 }, { slot: "08:30", libere: 0 },
  { slot: "09:00", libere: 1 }, { slot: "09:30", libere: 1 },
  { slot: "10:00", libere: 1 }, { slot: "10:30", libere: 0 },
  { slot: "11:00", libere: 1 }, { slot: "11:30", libere: 1 },
  { slot: "14:00", libere: 1 }, { slot: "14:30", libere: 0 },
  { slot: "15:00", libere: 1 }, { slot: "15:30", libere: 1 },
];

const ZILE_MAP: Record<number, string> = {
  1: "luni", 2: "marti", 3: "miercuri", 4: "joi", 5: "vineri", 6: "sambata", 0: "duminica",
};
const LUNI_RO = ["Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie","Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie"];

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormData {
  date: string; slot: string; prenume: string; nume: string;
  telefon: string; email: string; nrInmatriculare: string; marcaModel: string; observatii: string;
}
type Step = 1 | 2 | 3 | 4;

// ── Component ─────────────────────────────────────────────────────────────────
export function BookingMockup() {
  const [step, setStep] = useState<Step>(1);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [slots, setSlots] = useState<typeof SLOTS_FAKE>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState<FormData>({
    date: "", slot: "", prenume: "", nume: "", telefon: "", email: "",
    nrInmatriculare: "", marcaModel: "", observatii: "",
  });

  function setField<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm(p => ({ ...p, [k]: v }));
  }

  function reset() {
    setStep(1); setSlots([]); setSlotsLoading(false); setPending(false);
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
    const s = format(date, "yyyy-MM-dd");
    setField("date", s); setField("slot", "");
    setSlotsLoading(true); setSlots([]);
    await new Promise(r => setTimeout(r, 500));
    setSlotsLoading(false); setSlots(SLOTS_FAKE);
  }

  async function handleSubmit() {
    setPending(true);
    await new Promise(r => setTimeout(r, 900));
    setPending(false); setStep(4);
  }

  const step1Valid = !!form.date && !!form.slot;
  const step2Valid =
    form.prenume.trim().length >= 2 && form.nume.trim().length >= 2 &&
    /^07[0-9]{8}$/.test(form.telefon.replace(/\s/g, "")) &&
    form.nrInmatriculare.trim().length >= 2;

  const selectedDateFormatted = form.date
    ? format(new Date(form.date), "EEEE, d MMMM yyyy", { locale: ro })
    : "";

  const STEPS = [
    { n: 1, label: "Dată & Oră", icon: CalendarDays },
    { n: 2, label: "Date personale", icon: User },
    { n: 3, label: "Confirmare", icon: Car },
  ];

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
        {step === 4 && (
          <button onClick={reset} className="flex items-center gap-1 text-[10px] text-[#6B7280] hover:text-[#111318] transition-colors">
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      {/* Scrollable page */}
      <div className="max-h-[700px] overflow-y-auto bg-[#F7F8FA]">

        {/* ── Station hero ─────────────────────────────────── */}
        <div className="bg-[#1877F2] px-5 py-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 shrink-0">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-sm font-bold">{STATIE.nume}</h1>
              </div>
              <p className="text-[11px] text-blue-200">{STATIE.subtitlu}</p>
              <div className="flex items-center gap-1 mt-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                ))}
                <span className="text-[10px] text-blue-200 ml-1">{STATIE.rating} ({STATIE.recenzii} recenzii)</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-blue-200">Luni - Vineri</p>
              <p className="text-xs font-semibold">08:00 - 18:00</p>
              <span className="inline-block mt-1.5 text-[9px] font-bold bg-green-400 text-green-900 px-2 py-0.5 rounded-full">DESCHIS</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-white/20">
            <span className="flex items-center gap-1 text-[10px] text-blue-100"><MapPin className="h-3 w-3" />{STATIE.adresa}, {STATIE.oras}</span>
            <span className="flex items-center gap-1 text-[10px] text-blue-100"><Phone className="h-3 w-3" />{STATIE.telefon}</span>
            <span className="flex items-center gap-1 text-[10px] text-blue-100"><Mail className="h-3 w-3" />{STATIE.email}</span>
          </div>
        </div>

        <div className="p-4 space-y-4">

          {/* ── Programare ───────────────────────────────────── */}
          <section>
            <SectionTitle icon={CalendarDays} title="Programare online" />
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-4">
              {step < 4 && (
                <div className="flex items-center gap-2">
                  {STEPS.map((s, i) => {
                    const Icon = s.icon;
                    const done = step > s.n;
                    const active = step === s.n;
                    return (
                      <div key={s.n} className="flex items-center gap-1.5 flex-1">
                        <div className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full shrink-0 transition-colors",
                          done   ? "bg-[#1877F2] text-white" :
                          active ? "bg-[#EFF6FF] text-[#1877F2] border-2 border-[#1877F2]" :
                                   "bg-[#F7F8FA] text-[#9CA3AF]"
                        )}>
                          {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3 w-3" />}
                        </div>
                        <span className={cn("text-[10px] font-medium hidden sm:block",
                          active ? "text-[#1877F2]" : done ? "text-[#374151]" : "text-[#9CA3AF]"
                        )}>{s.label}</span>
                        {i < STEPS.length - 1 && <div className={cn("flex-1 h-px", done ? "bg-[#1877F2]" : "bg-[#E5E7EB]")} />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="border border-[#E5E7EB] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-3">
                      <button onClick={() => { if (calMonth === 0) { setCalYear(y => y-1); setCalMonth(11); } else setCalMonth(m => m-1); }} className="h-6 w-6 flex items-center justify-center rounded-md border border-[#E5E7EB] hover:bg-[#F7F8FA]">
                        <ChevronLeft className="h-3.5 w-3.5 text-[#374151]" />
                      </button>
                      <span className="text-xs font-semibold text-[#111318]">{LUNI_RO[calMonth]} {calYear}</span>
                      <button onClick={() => { if (calMonth === 11) { setCalYear(y => y+1); setCalMonth(0); } else setCalMonth(m => m+1); }} className="h-6 w-6 flex items-center justify-center rounded-md border border-[#E5E7EB] hover:bg-[#F7F8FA]">
                        <ChevronRight className="h-3.5 w-3.5 text-[#374151]" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 mb-1">
                      {["Lu","Ma","Mi","Jo","Vi","Sa","Du"].map(z => (
                        <div key={z} className="text-center text-[9px] font-medium text-[#9CA3AF] py-0.5">{z}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {calDays().map((date, i) => {
                        if (!date) return <div key={`e-${i}`} />;
                        const ds = format(date, "yyyy-MM-dd");
                        const key = ZILE_MAP[getDay(date)];
                        const isDisabled = isBefore(date, today) || isBefore(maxDate, date) || !PROGRAM_LUCRU[key];
                        const isSelected = form.date === ds;
                        const isToday = format(today, "yyyy-MM-dd") === ds;
                        return (
                          <button key={ds} disabled={isDisabled} onClick={() => selectDate(date)}
                            className={cn("h-6 w-full rounded text-[10px] font-medium transition-all",
                              isSelected  ? "bg-[#1877F2] text-white" :
                              isDisabled  ? "text-[#D1D5DB] cursor-not-allowed" :
                              isToday     ? "border border-[#1877F2] text-[#1877F2]" :
                                            "hover:bg-[#EFF6FF] text-[#374151]"
                            )}>
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {form.date && (
                    <div className="border border-[#E5E7EB] rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-3.5 w-3.5 text-[#6B7280]" />
                        <span className="text-xs font-semibold text-[#111318]">Ore disponibile</span>
                      </div>
                      {slotsLoading && <div className="flex items-center gap-2 text-xs text-[#6B7280]"><Loader2 className="h-3.5 w-3.5 animate-spin" />Se incarca...</div>}
                      {!slotsLoading && slots.length > 0 && (
                        <div className="grid grid-cols-4 gap-1.5">
                          {slots.map(({ slot, libere }) => {
                            const av = libere > 0; const sel = form.slot === slot;
                            return (
                              <button key={slot} disabled={!av} onClick={() => av && setField("slot", slot)}
                                className={cn("flex flex-col items-center rounded-lg border py-1.5 text-[10px] font-medium transition-all",
                                  sel ? "border-[#1877F2] bg-[#1877F2] text-white" :
                                  av  ? "border-[#E5E7EB] hover:border-[#1877F2]/50 hover:bg-[#EFF6FF] text-[#374151]" :
                                        "border-[#E5E7EB] bg-[#F9FAFB] text-[#D1D5DB] cursor-not-allowed"
                                )}>
                                {slot}{!av && <span className="text-[8px]">Ocupat</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  <Button className="w-full bg-[#1877F2] hover:bg-[#1565D8] h-8 text-xs" disabled={!step1Valid} onClick={() => setStep(2)}>
                    Continua <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="space-y-3">
                  <div className="space-y-2.5">
                    <p className="text-xs font-semibold text-[#111318]">Date personale</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Prenume *" value={form.prenume} onChange={v => setField("prenume", v)} placeholder="Ion" />
                      <Field label="Nume *" value={form.nume} onChange={v => setField("nume", v)} placeholder="Popescu" />
                    </div>
                    <Field label="Telefon *" value={form.telefon} onChange={v => setField("telefon", v)} placeholder="07xx xxx xxx" type="tel" hint="Format: 07xx xxx xxx" />
                    <Field label="Email (optional)" value={form.email} onChange={v => setField("email", v)} placeholder="exemplu@email.ro" type="email" />
                  </div>
                  <div className="space-y-2.5">
                    <p className="text-xs font-semibold text-[#111318]">Date vehicul</p>
                    <Field label="Nr. înmatriculare *" value={form.nrInmatriculare} onChange={v => setField("nrInmatriculare", v.toUpperCase())} placeholder="B 123 ABC" />
                    <Field label="Marcă și model (optional)" value={form.marcaModel} onChange={v => setField("marcaModel", v)} placeholder="ex: Dacia Logan" />
                    <div>
                      <label className="block text-[10px] font-medium text-[#374151] mb-1">Observații (optional)</label>
                      <textarea value={form.observatii} onChange={e => setField("observatii", e.target.value)} placeholder="Informații suplimentare..." rows={2}
                        className="w-full text-[11px] rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 outline-none focus:border-[#1877F2] resize-none text-[#111318] placeholder:text-[#9CA3AF]" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 h-8 text-xs" onClick={() => setStep(1)}>
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />Înapoi
                    </Button>
                    <Button className="flex-1 bg-[#1877F2] hover:bg-[#1565D8] h-8 text-xs" disabled={!step2Valid} onClick={() => setStep(3)}>
                      Continua<ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="space-y-3">
                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-[#1877F2]">Confirmare programare</p>
                    <Row icon={CalendarDays} label="Data" value={selectedDateFormatted} />
                    <Row icon={Clock} label="Ora" value={form.slot} />
                    <Row icon={User} label="Persoana" value={`${form.prenume} ${form.nume} · ${form.telefon}`} />
                    <Row icon={Car} label="Vehicul" value={`${form.nrInmatriculare}${form.marcaModel ? ` · ${form.marcaModel}` : ""}`} />
                    {form.observatii && <Row icon={AlertCircle} label="Observatii" value={form.observatii} />}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 h-8 text-xs" onClick={() => setStep(2)} disabled={pending}>
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />Înapoi
                    </Button>
                    <Button className="flex-1 bg-[#1877F2] hover:bg-[#1565D8] h-8 text-xs" onClick={handleSubmit} disabled={pending}>
                      {pending ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Se trimite...</> : "Confirmă programarea"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4 */}
              {step === 4 && (
                <div className="flex flex-col items-center text-center gap-3 py-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DCFCE7]">
                    <CheckCircle2 className="h-6 w-6 text-[#16A34A]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111318]">Programare confirmată!</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">Programarea a fost înregistrată cu succes.</p>
                  </div>
                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 w-full text-left space-y-1">
                    <p className="text-[11px] text-[#6B7280]"><span className="font-medium text-[#374151]">Data:</span> {selectedDateFormatted}</p>
                    <p className="text-[11px] text-[#6B7280]"><span className="font-medium text-[#374151]">Ora:</span> {form.slot}</p>
                    <p className="text-[11px] text-[#6B7280]"><span className="font-medium text-[#374151]">Vehicul:</span> {form.nrInmatriculare}</p>
                  </div>
                  <button onClick={reset} className="text-xs text-[#1877F2] hover:underline flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" />Reincepe demo
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ── Servicii ─────────────────────────────────────── */}
          <section>
            <SectionTitle icon={Wrench} title="Servicii și prețuri" />
            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
              {SERVICII.map((s, i) => (
                <div key={s.nume} className={cn("flex items-center justify-between px-4 py-3", i !== SERVICII.length - 1 && "border-b border-[#F3F4F6]")}>
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                      <Wrench className="h-3.5 w-3.5 text-[#1877F2]" />
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
          </section>

          {/* ── Galerie ──────────────────────────────────────── */}
          <section>
            <SectionTitle icon={ImageIcon} title="Galerie foto" />
            <div className="grid grid-cols-3 gap-2">
              {GALERIE.map((color, i) => (
                <div key={i} className={cn("rounded-xl aspect-square flex items-center justify-center border border-[#E5E7EB]", color)}>
                  <ImageIcon className="h-5 w-5 text-[#9CA3AF]" />
                </div>
              ))}
            </div>
          </section>

          {/* ── Informații stație ────────────────────────────── */}
          <section>
            <SectionTitle icon={Info} title="Informații stație" />
            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#F3F4F6]">
                <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Program de lucru</p>
                {PROGRAM.map(p => (
                  <div key={p.zi} className="flex justify-between text-xs py-0.5">
                    <span className="text-[#374151]">{p.zi}</span>
                    <span className={cn("font-medium", p.ore === "Închis" ? "text-[#9CA3AF]" : "text-[#111318]")}>{p.ore}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 space-y-2">
                <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Contact</p>
                <div className="flex items-center gap-2 text-xs text-[#374151]">
                  <MapPin className="h-3.5 w-3.5 text-[#6B7280] shrink-0" />
                  <span>{STATIE.adresa}, {STATIE.oras}, jud. {STATIE.judet}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="h-3.5 w-3.5 text-[#6B7280] shrink-0" />
                  <span className="text-[#1877F2]">{STATIE.telefon}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="h-3.5 w-3.5 text-[#6B7280] shrink-0" />
                  <span className="text-[#1877F2]">{STATIE.email}</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Locație / Hartă ──────────────────────────────── */}
          <section>
            <SectionTitle icon={MapPin} title="Locație" />
            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
              {/* Fake map */}
              <div className="h-32 bg-[#F1F5F9] flex items-center justify-center relative">
                <div className="absolute inset-0" style={{
                  backgroundImage: "linear-gradient(#CBD5E1 1px, transparent 1px), linear-gradient(90deg, #CBD5E1 1px, transparent 1px)",
                  backgroundSize: "18px 18px", opacity: 0.4,
                }} />
                <div className="relative flex flex-col items-center gap-1">
                  <div className="h-8 w-8 rounded-full bg-[#1877F2] flex items-center justify-center shadow-md">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#374151] bg-white px-2 py-0.5 rounded-full border border-[#E5E7EB] shadow-sm">{STATIE.nume}</span>
                </div>
              </div>
              <div className="px-4 py-3">
                <button className="w-full flex items-center justify-center gap-2 bg-[#EFF6FF] text-[#1877F2] text-xs font-semibold py-2 rounded-lg border border-[#BFDBFE] hover:bg-[#DBEAFE] transition-colors">
                  <Navigation className="h-3.5 w-3.5" />Deschide în Google Maps
                </button>
              </div>
            </div>
          </section>

          <p className="text-center text-[10px] text-[#9CA3AF] pb-2">
            Powered by <span className="font-semibold">VELOS.RO</span>
          </p>

        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon className="h-3.5 w-3.5 text-[#6B7280]" />
      <h2 className="text-xs font-semibold text-[#374151] uppercase tracking-wide">{title}</h2>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; hint?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-[#374151] mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-[11px] rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2]/20 text-[#111318] placeholder:text-[#9CA3AF]" />
      {hint && <p className="text-[9px] text-[#9CA3AF] mt-0.5">{hint}</p>}
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-[#1877F2] mt-0.5 shrink-0" />
      <span className="text-[11px] text-[#374151]"><span className="font-medium">{label}: </span>{value}</span>
    </div>
  );
}
