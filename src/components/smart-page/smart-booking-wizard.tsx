"use client";

import { useState, useTransition } from "react";
import { format, addDays, parseISO, isBefore, startOfDay, getDay } from "date-fns";
import { ro } from "date-fns/locale";
import {
  CalendarDays, Clock, User, Car, CheckCircle2,
  ChevronLeft, ChevronRight, Loader2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getBookingAvailabilityAction, createBookingAction } from "@/lib/actions/booking";
import type { SlotInfo } from "@/lib/actions/booking";

type ProgramLucru = Record<string, { start: string; end: string } | null>;

const ZILE_MAP: Record<number, string> = {
  1: "luni", 2: "marti", 3: "miercuri", 4: "joi",
  5: "vineri", 6: "sambata", 0: "duminica",
};

const LUNI_RO = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];

interface Props {
  statieId: string;
  programLucru: ProgramLucru | null;
  accent: string;
}

interface FormData {
  date: string; slot: string; nume: string; prenume: string;
  telefon: string; email: string; nrInmatriculare: string;
  marcaModel: string; observatii: string;
}

type Step = 1 | 2 | 3 | 4;

function isOpen(date: Date, programLucru: ProgramLucru | null) {
  if (!programLucru) return false;
  return !!programLucru[ZILE_MAP[getDay(date)]];
}

export function SmartBookingWizard({ statieId, programLucru, accent }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormData>({
    date: "", slot: "", nume: "", prenume: "",
    telefon: "", email: "", nrInmatriculare: "", marcaModel: "", observatii: "",
  });

  function setField<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 60);

  function calDays(): (Date | null)[] {
    const first = new Date(calYear, calMonth, 1);
    const last = new Date(calYear, calMonth + 1, 0);
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
    const dateStr = format(date, "yyyy-MM-dd");
    setField("date", dateStr);
    setField("slot", "");
    setSlotsLoading(true);
    setSlotsError(null);
    setSlots([]);
    const result = await getBookingAvailabilityAction(statieId, dateStr);
    setSlotsLoading(false);
    if (result.error) setSlotsError(result.error);
    else if (result.inchis) setSlotsError("Stația este închisă în această zi.");
    else setSlots(result.slots);
  }

  function step1Valid() { return !!form.date && !!form.slot; }
  function step2Valid() {
    return (
      form.nume.trim().length >= 2 && form.prenume.trim().length >= 2 &&
      /^07[0-9]{8}$/.test(form.telefon.replace(/\s/g, "")) &&
      form.nrInmatriculare.trim().length >= 2
    );
  }

  function handleSubmit() {
    setSubmitError(null);
    startTransition(async () => {
      const result = await createBookingAction({
        statieId, date: form.date, slot: form.slot,
        nume: form.nume.trim(), prenume: form.prenume.trim(),
        telefon: form.telefon.replace(/\s/g, ""),
        email: form.email.trim() || undefined,
        nrInmatriculare: form.nrInmatriculare.trim(),
        marcaModel: form.marcaModel.trim() || undefined,
        observatii: form.observatii.trim() || undefined,
      });
      if (result.success) setStep(4);
      else setSubmitError(result.error ?? "Eroare la trimitere");
    });
  }

  const selectedDateFormatted = form.date
    ? format(parseISO(form.date), "EEEE, d MMMM yyyy", { locale: ro })
    : "";

  const accentBg = { backgroundColor: accent };
  const accentBorder = { borderColor: accent };
  const accentText = { color: accent };

  const steps = [
    { n: 1, label: "Dată & Oră", icon: CalendarDays },
    { n: 2, label: "Date personale", icon: User },
    { n: 3, label: "Confirmare", icon: Car },
  ];

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      {step < 4 && (
        <div className="flex items-center w-full gap-0">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.n;
            const active = step === s.n;
            return (
              <div key={s.n} className="flex items-center flex-1">
                {/* Connector left */}
                {i > 0 && (
                  <div className="flex-1 h-px" style={done || active ? accentBg : { backgroundColor: "#E5E7EB" }} />
                )}
                {/* Step circle + label */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0 transition-colors",
                      done ? "text-white" : active ? "bg-white border-2" : "bg-[#F3F4F6] text-[#9CA3AF]"
                    )}
                    style={done ? accentBg : active ? { ...accentBorder, ...accentText } : undefined}
                  >
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                  </div>
                  <span
                    className={cn("text-[10px] font-medium text-center leading-tight",
                      active ? "" : done ? "text-[#374151]" : "text-[#9CA3AF]"
                    )}
                    style={active ? accentText : undefined}
                  >
                    {s.label}
                  </span>
                </div>
                {/* Connector right */}
                {i < steps.length - 1 && (
                  <div className="flex-1 h-px" style={done ? accentBg : { backgroundColor: "#E5E7EB" }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={prevMonth}
                className="h-8 w-8 flex items-center justify-center rounded-xl border border-[#E5E7EB] hover:bg-[#F7F8FA] transition-colors">
                <ChevronLeft className="h-4 w-4 text-[#374151]" />
              </button>
              <span className="text-sm font-semibold text-[#111318]">
                {LUNI_RO[calMonth]} {calYear}
              </span>
              <button type="button" onClick={nextMonth}
                className="h-8 w-8 flex items-center justify-center rounded-xl border border-[#E5E7EB] hover:bg-[#F7F8FA] transition-colors">
                <ChevronRight className="h-4 w-4 text-[#374151]" />
              </button>
            </div>
            <div className="grid grid-cols-7 mb-2">
              {["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"].map((z) => (
                <div key={z} className="text-center text-[11px] font-medium text-[#9CA3AF] py-1">{z}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {calDays().map((date, i) => {
                if (!date) return <div key={`e-${i}`} />;
                const dateStr = format(date, "yyyy-MM-dd");
                const isDisabled = isBefore(date, today) || isBefore(maxDate, date) || !isOpen(date, programLucru);
                const isSelected = form.date === dateStr;
                const isToday = format(today, "yyyy-MM-dd") === dateStr;
                return (
                  <button key={dateStr} type="button" disabled={isDisabled}
                    onClick={() => selectDate(date)}
                    className={cn(
                      "h-9 w-full rounded-xl text-xs font-medium transition-all",
                      isDisabled ? "text-[#D1D5DB] cursor-not-allowed" : "cursor-pointer"
                    )}
                    style={
                      isSelected ? { ...accentBg, color: "white", fontWeight: "bold" } :
                      isToday && !isDisabled ? { border: `2px solid ${accent}`, ...accentText } :
                      !isDisabled ? undefined : undefined
                    }
                    onMouseEnter={(e) => {
                      if (!isDisabled && !isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${accent}15`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isDisabled && !isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "";
                      }
                    }}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {form.date && (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4" style={accentText} />
                <span className="text-sm font-semibold text-[#111318]">
                  Ore disponibile — {selectedDateFormatted}
                </span>
              </div>
              {slotsLoading && (
                <div className="flex items-center gap-2 text-sm text-[#6B7280] py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />Se încarcă...
                </div>
              )}
              {slotsError && (
                <div className="flex items-center gap-2 text-sm text-red-600 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />{slotsError}
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
                      <button key={slot} type="button" disabled={!available}
                        onClick={() => available && setField("slot", slot)}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-xl border py-2.5 text-xs font-medium transition-all",
                          !available && "border-[#E5E7EB] bg-[#F9FAFB] text-[#D1D5DB] cursor-not-allowed"
                        )}
                        style={
                          isSelected ? { ...accentBg, color: "white", borderColor: accent } :
                          available ? { borderColor: "#E5E7EB", cursor: "pointer" } : undefined
                        }
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

          <button
            className="w-full h-12 rounded-2xl text-white font-semibold text-sm transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
            style={accentBg}
            disabled={!step1Valid()}
            onClick={() => setStep(2)}
          >
            Continuă <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-[#111318]">Date personale</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prenume *" value={form.prenume} onChange={(v) => setField("prenume", v)} placeholder="Ion" accent={accent} />
              <Field label="Nume *" value={form.nume} onChange={(v) => setField("nume", v)} placeholder="Popescu" accent={accent} />
            </div>
            <Field label="Telefon *" value={form.telefon} onChange={(v) => setField("telefon", v)} placeholder="07xx xxx xxx" type="tel" hint="Format: 07xx xxx xxx" accent={accent} />
            <Field label="Email (opțional)" value={form.email} onChange={(v) => setField("email", v)} placeholder="exemplu@email.ro" type="email" accent={accent} />
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-[#111318]">Date vehicul</h3>
            <Field label="Nr. înmatriculare *" value={form.nrInmatriculare} onChange={(v) => setField("nrInmatriculare", v.toUpperCase())} placeholder="B 123 ABC" accent={accent} />
            <Field label="Marcă și model (opțional)" value={form.marcaModel} onChange={(v) => setField("marcaModel", v)} placeholder="ex: Dacia Logan" accent={accent} />
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">Observații (opțional)</label>
              <textarea value={form.observatii} onChange={(e) => setField("observatii", e.target.value)}
                placeholder="Orice informații suplimentare..." rows={3}
                className="w-full text-sm rounded-xl border border-[#E5E7EB] px-3 py-2.5 outline-none resize-none text-[#111318] placeholder:text-[#9CA3AF]"
                onFocus={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${accent}20`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = ""; }}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 h-12 rounded-2xl border border-[#E5E7EB] text-[#374151] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#F9FAFB] transition-colors"
              onClick={() => setStep(1)}>
              <ChevronLeft className="h-4 w-4" />Înapoi
            </button>
            <button className="flex-1 h-12 rounded-2xl text-white font-semibold text-sm transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
              style={accentBg} disabled={!step2Valid()} onClick={() => setStep(3)}>
              Continuă <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-2xl p-4 space-y-3 border" style={{ backgroundColor: `${accent}10`, borderColor: `${accent}30` }}>
            <h3 className="text-sm font-semibold" style={accentText}>Confirmare programare</h3>
            <ConfirmRow icon={CalendarDays} label="Data" value={selectedDateFormatted} accent={accent} />
            <ConfirmRow icon={Clock} label="Ora" value={form.slot} accent={accent} />
            <ConfirmRow icon={User} label="Persoană" value={`${form.prenume} ${form.nume} · ${form.telefon}`} accent={accent} />
            <ConfirmRow icon={Car} label="Vehicul" value={`${form.nrInmatriculare}${form.marcaModel ? ` · ${form.marcaModel}` : ""}`} accent={accent} />
          </div>
          {submitError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />{submitError}
            </div>
          )}
          <div className="flex gap-3">
            <button className="flex-1 h-12 rounded-2xl border border-[#E5E7EB] text-[#374151] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#F9FAFB] transition-colors"
              onClick={() => setStep(2)} disabled={isPending}>
              <ChevronLeft className="h-4 w-4" />Înapoi
            </button>
            <button className="flex-1 h-12 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              style={accentBg} onClick={handleSubmit} disabled={isPending}>
              {isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Se trimite...</> : "Confirmă programarea"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <div className="rounded-2xl border border-[#E5E7EB] p-8 flex flex-col items-center text-center gap-4 bg-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#DCFCE7]">
            <CheckCircle2 className="h-8 w-8 text-[#16A34A]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#111318]">Programare confirmată!</h2>
            <p className="text-sm text-[#6B7280] mt-1">Programarea ta a fost înregistrată cu succes.</p>
          </div>
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 w-full text-left space-y-1.5">
            <p className="text-xs text-[#6B7280]"><span className="font-medium text-[#374151]">Data:</span> {selectedDateFormatted}</p>
            <p className="text-xs text-[#6B7280]"><span className="font-medium text-[#374151]">Ora:</span> {form.slot}</p>
            <p className="text-xs text-[#6B7280]"><span className="font-medium text-[#374151]">Vehicul:</span> {form.nrInmatriculare}</p>
          </div>
          <p className="text-xs text-[#9CA3AF]">Vei fi contactat dacă intervin modificări. Te așteptăm!</p>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", hint, accent }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; hint?: string; accent: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#374151] mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-sm rounded-xl border border-[#E5E7EB] px-3 py-2.5 outline-none text-[#111318] placeholder:text-[#9CA3AF] transition-all"
        onFocus={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${accent}20`; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = ""; }}
      />
      {hint && <p className="text-[11px] text-[#9CA3AF] mt-1">{hint}</p>}
    </div>
  );
}

function ConfirmRow({ icon: Icon, label, value, accent }: {
  icon: React.ElementType; label: string; value: string; accent: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: accent }} />
      <div className="min-w-0">
        <span className="text-xs font-medium text-[#374151]">{label}: </span>
        <span className="text-xs text-[#111318]">{value}</span>
      </div>
    </div>
  );
}
