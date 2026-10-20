"use client";

import { useState, useTransition } from "react";
import { Check, X, Pencil, Info } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { updateAdminSetting } from "@/lib/actions/admin";

interface Setting {
  cheie: string;
  valoare: string;
  descriere: string | null;
  updated_at: string;
}

const SETTING_LABELS: Record<string, { label: string; type: string; suffix?: string; min?: number; max?: number; step?: number }> = {
  sms_pret_eur:     { label: "Preț per SMS",                type: "number", suffix: "€",    min: 0.01, step: 0.001 },
  trial_luni:       { label: "Durata trial (conturi noi)",  type: "number", suffix: "luni", min: 1,    step: 1, max: 24 },
  trial_sms_limita: { label: "SMS-uri trial vechi",         type: "number", suffix: "SMS",  min: 0,    step: 1 },
  trial_zile:       { label: "Durata trial vechi",          type: "number", suffix: "zile", min: 1,    step: 1 },
};

export function SetariAdminClient({ settings }: { settings: Setting[] }) {
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);
  const [eroare, setEroare] = useState<{ cheie: string; text: string } | null>(null);

  function startEdit(s: Setting) {
    setEditKey(s.cheie);
    setEditValue(s.valoare);
    setEroare(null);
  }

  function handleSave(cheie: string) {
    setEroare(null);
    startTransition(async () => {
      let rezultat: { error?: string };
      try {
        rezultat = await updateAdminSetting(cheie, editValue);
      } catch {
        rezultat = { error: "Nu am putut salva setarea. Încearcă din nou." };
      }
      if (rezultat.error) {
        // Editorul rămâne deschis, cu valoarea tastată, ca s-o poți corecta.
        setEroare({ cheie, text: rezultat.error });
        return;
      }
      setSaved(cheie);
      setEditKey(null);
      setTimeout(() => setSaved(null), 2000);
    });
  }

  return (
    <div className="max-w-2xl space-y-3">
      {settings.map((s) => {
        const meta = SETTING_LABELS[s.cheie];
        const isEditing = editKey === s.cheie;
        const wasSaved = saved === s.cheie;
        const eroareRand = isEditing && eroare?.cheie === s.cheie ? eroare.text : null;

        return (
          <div
            key={s.cheie}
            className={cn(
              "bg-white border rounded-xl p-5 transition-all",
              isEditing ? "border-[#1877F2]/40 shadow-sm" : "border-[#F3F4F6]"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[#111318]">
                    {meta?.label ?? s.cheie}
                  </p>
                  <code className="text-[10px] text-[#9CA3AF] bg-[#F3F4F6] px-1.5 py-0.5 rounded font-mono">
                    {s.cheie}
                  </code>
                  {wasSaved && (
                    <span className="flex items-center gap-0.5 text-[10px] text-[#059669]">
                      <Check className="h-3 w-3" /> Salvat
                    </span>
                  )}
                </div>
                {s.descriere && (
                  <p className="text-xs text-[#6B7280] mt-0.5 flex items-center gap-1">
                    <Info className="h-3 w-3 shrink-0" />
                    {s.descriere}
                  </p>
                )}
                <p className="text-[10px] text-[#9CA3AF] mt-1">
                  Actualizat: {format(new Date(s.updated_at), "d MMM yyyy HH:mm", { locale: ro })}
                </p>
                {eroareRand && (
                  <p role="alert" className="text-xs text-red-500 mt-1">
                    {eroareRand}
                  </p>
                )}
                {s.cheie === "sms_pret_eur" && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                    <strong>Atenție:</strong> prețul de aici se folosește doar la plata din Stripe. Textele cu
                    prețul nu se actualizează singure — trebuie schimbate și în cod: fereastra „Cumpără SMS-uri”
                    (<code>cumpara-sms-modal.tsx</code>: <code>PACHETE</code>, <code>PRET_PER_SMS</code> și
                    textul „0,05€/SMS” din antet), <code>PRET_SMS_AFISAT</code> (<code>sms-disponibil-shared.ts</code>),
                    prețuri, întrebări frecvente și emailul de bun venit. Conform art. 6.5 din termeni, clienții
                    trebuie anunțați prin e-mail cu cel puțin 30 de zile înainte de schimbarea prețului.
                  </p>
                )}
              </div>

              {/* Value + edit */}
              <div className="shrink-0">
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <div className="relative">
                      <input
                        type={meta?.type ?? "text"}
                        min={meta?.min}
                        max={meta?.max}
                        step={meta?.step}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                        className="w-24 border border-[#1877F2]/60 rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 text-right pr-8"
                      />
                      {meta?.suffix && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">
                          {meta.suffix}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleSave(s.cheie)}
                      disabled={isPending}
                      className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#1877F2] text-white hover:bg-[#1565D8] transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { setEditKey(null); setEroare(null); }}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#111318]">
                      {s.valoare}
                      {meta?.suffix && (
                        <span className="text-sm font-normal text-[#6B7280] ml-0.5">{meta.suffix}</span>
                      )}
                    </span>
                    <button
                      onClick={() => startEdit(s)}
                      className="h-7 w-7 flex items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#1877F2] transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4 space-y-2">
        <p className="text-xs text-amber-700">
          <strong>Trial nou:</strong> <code>trial_luni</code> (între 1 și 24) se citește la crearea contului,
          deci se aplică doar conturilor create după modificare. Conturile create începând cu 20.10.2026 nu
          primesc SMS-uri incluse în trial — trimit doar din credit SMS cumpărat. Dacă schimbi durata,
          actualizează și textele publice (pagina principală, pagina de înregistrare, prețuri, întrebări
          frecvente, termeni, emailul de bun venit).
        </p>
        <p className="text-xs text-amber-700">
          <strong>Trial vechi:</strong> <code>trial_zile</code> nu mai este folosită (doar istoric).{" "}
          <code>trial_sms_limita</code> este citită la fiecare trimitere pentru conturile create înainte de
          20.10.2026 aflate încă în trial: o modificare li se aplică imediat.
        </p>
      </div>
    </div>
  );
}
