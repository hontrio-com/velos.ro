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

const SETTING_LABELS: Record<string, { label: string; type: string; suffix?: string; min?: number; step?: number }> = {
  sms_pret_eur:     { label: "Preț per SMS",           type: "number", suffix: "€",    min: 0.01, step: 0.001 },
  trial_sms_limita: { label: "SMS-uri trial",           type: "number", suffix: "SMS",  min: 0,    step: 1 },
  trial_zile:       { label: "Durata trial",            type: "number", suffix: "zile", min: 1,    step: 1 },
};

export function SetariAdminClient({ settings }: { settings: Setting[] }) {
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);

  function startEdit(s: Setting) {
    setEditKey(s.cheie);
    setEditValue(s.valoare);
  }

  function handleSave(cheie: string) {
    startTransition(async () => {
      await updateAdminSetting(cheie, editValue);
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
              </div>

              {/* Value + edit */}
              <div className="shrink-0">
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <div className="relative">
                      <input
                        type={meta?.type ?? "text"}
                        min={meta?.min}
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
                      onClick={() => setEditKey(null)}
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

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
        <p className="text-xs text-amber-700">
          <strong>Notă:</strong> Modificările la <code>trial_sms_limita</code> și <code>trial_zile</code> afectează
          doar utilizatorii noi care se înregistrează după schimbare. Utilizatorii existenți au deja
          <code>trial_expires_at</code> setat.
        </p>
      </div>
    </div>
  );
}
