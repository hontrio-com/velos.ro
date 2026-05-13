"use client";

import { useEffect, useState } from "react";
import { X, Loader2, UserPlus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createAngajatAction, updateAngajatAction } from "@/lib/actions/angajati";
import type { Angajat } from "./angajati-client";

interface AngajatDrawerProps {
  open: boolean;
  angajat: Angajat | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  nume: string;
  functie: string;
  telefon: string;
  email: string;
  activ: boolean;
}

const EMPTY: FormState = { nume: "", functie: "", telefon: "", email: "", activ: true };

export function AngajatDrawer({ open, angajat, onClose, onSuccess }: AngajatDrawerProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const isEdit = !!angajat;

  useEffect(() => {
    if (open) {
      setForm(angajat
        ? { nume: angajat.nume, functie: angajat.functie ?? "", telefon: angajat.telefon ?? "", email: angajat.email ?? "", activ: angajat.activ }
        : EMPTY
      );
    }
  }, [open, angajat]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nume.trim()) { toast.error("Numele este obligatoriu"); return; }

    setSaving(true);
    const result = isEdit
      ? await updateAngajatAction(angajat.id, form)
      : await createAngajatAction(form);
    setSaving(false);

    if (result.success) {
      toast.success(isEdit ? "Angajat actualizat" : "Angajat adăugat");
      onSuccess();
    } else {
      toast.error(result.error ?? "Eroare");
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-[400px] border-l border-[#E5E7EB] bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF]">
              {isEdit ? <Pencil className="h-4 w-4 text-[#1877F2]" /> : <UserPlus className="h-4 w-4 text-[#1877F2]" />}
            </div>
            <div>
              <p className="font-semibold text-[#111318] text-sm">{isEdit ? "Editează angajat" : "Angajat nou"}</p>
              <p className="text-xs text-[#9CA3AF]">{isEdit ? angajat.nume : "Completează datele"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-[#F7F8FA] transition-colors"
          >
            <X className="h-4 w-4 text-[#6B7280]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Nume */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">
              Nume complet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nume}
              onChange={(e) => setField("nume", e.target.value)}
              placeholder="ex: Ion Popescu"
              className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 text-[#111318] placeholder:text-[#9CA3AF]"
              required
            />
          </div>

          {/* Functie */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Funcție</label>
            <input
              type="text"
              value={form.functie}
              onChange={(e) => setField("functie", e.target.value)}
              placeholder="ex: Inspector ITP, Mecanic, Recepționist"
              className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 text-[#111318] placeholder:text-[#9CA3AF]"
            />
          </div>

          {/* Telefon */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Telefon</label>
            <input
              type="tel"
              value={form.telefon}
              onChange={(e) => setField("telefon", e.target.value)}
              placeholder="07xx xxx xxx"
              className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 text-[#111318] placeholder:text-[#9CA3AF]"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="angajat@statie.ro"
              className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 text-[#111318] placeholder:text-[#9CA3AF]"
            />
          </div>

          {/* Activ toggle */}
          <div className="flex items-center justify-between py-3 px-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
            <div>
              <p className="text-sm font-medium text-[#111318]">Angajat activ</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Poate fi atribuit la programări</p>
            </div>
            <button
              type="button"
              onClick={() => setField("activ", !form.activ)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${form.activ ? "bg-[#1877F2]" : "bg-[#E5E7EB]"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${form.activ ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-[#E5E7EB] p-4 flex gap-3 shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
            Anulează
          </Button>
          <Button
            className="flex-1 bg-[#1877F2] hover:bg-[#1565D8]"
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={saving || !form.nume.trim()}
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Se salvează...</> : isEdit ? "Salvează" : "Adaugă angajat"}
          </Button>
        </div>
      </div>
    </>
  );
}
