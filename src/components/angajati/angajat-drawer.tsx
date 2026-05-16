"use client";

import { useEffect, useState } from "react";
import { X, Loader2, UserPlus, Pencil, KeyRound, Shield, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  createAngajatContAction,
  deleteAngajatContAction,
  DEFAULT_PERMISIUNI,
  type Permisiuni,
} from "@/lib/actions/angajati";
import type { Angajat } from "./angajati-client";
import { cn } from "@/lib/utils";

interface AngajatDrawerProps {
  open: boolean;
  angajat: Angajat | null;
  statieId: string;
  statieNume: string;
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

const PERMISIUNI_LIST: { key: keyof Permisiuni; label: string; desc: string }[] = [
  { key: "programari", label: "Programări", desc: "Creează și gestionează programări" },
  { key: "clienti", label: "Clienți", desc: "Vizualizează profilurile clienților" },
  { key: "vehicule", label: "Vehicule", desc: "Vizualizează vehiculele" },
  { key: "rapoarte", label: "Rapoarte", desc: "Accesează rapoartele" },
  { key: "remindere", label: "Remindere", desc: "Gestionează reminderele SMS" },
];

const EMPTY: FormState = { nume: "", functie: "", telefon: "", email: "", activ: true };

export function AngajatDrawer({ open, angajat, statieId, statieNume, onClose, onSuccess }: AngajatDrawerProps) {
  const supabase = createClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [permisiuni, setPermisiuni] = useState<Permisiuni>(DEFAULT_PERMISIUNI);
  const [createCont, setCreateCont] = useState(false);
  const [parola, setParola] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingCont, setDeletingCont] = useState(false);

  const isEdit = !!angajat;
  const hasCont = !!angajat?.profile_id;

  useEffect(() => {
    if (open) {
      setForm(
        angajat
          ? {
              nume: angajat.nume,
              functie: angajat.functie ?? "",
              telefon: angajat.telefon ?? "",
              email: angajat.email ?? "",
              activ: angajat.activ,
            }
          : EMPTY
      );
      setPermisiuni((angajat?.permisiuni as Permisiuni) ?? DEFAULT_PERMISIUNI);
      setCreateCont(false);
      setParola("");
    }
  }, [open, angajat]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function togglePermisiune(key: keyof Permisiuni) {
    setPermisiuni((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nume.trim()) {
      toast.error("Numele este obligatoriu");
      return;
    }

    if (createCont) {
      if (!form.email.trim()) {
        toast.error("Email-ul este obligatoriu pentru cont");
        return;
      }
      if (parola.length < 8) {
        toast.error("Parola trebuie să aibă minim 8 caractere");
        return;
      }
    }

    setSaving(true);
    try {
      if (isEdit) {
        // Update angajat row client-side
        const updatePayload: Record<string, unknown> = {
          nume: form.nume.trim(),
          functie: form.functie.trim() || null,
          telefon: form.telefon.trim() || null,
          email: form.email.trim() || null,
          activ: form.activ,
          updated_at: new Date().toISOString(),
        };

        // Include permisiuni if has account
        if (hasCont) {
          updatePayload.permisiuni = permisiuni;
        }

        const { error: updateError } = await (supabase as any)
          .from("angajati")
          .update(updatePayload)
          .eq("id", angajat.id)
          .eq("statie_id", statieId);

        if (updateError) {
          toast.error(updateError.message ?? "Eroare la actualizare");
          return;
        }

        if (createCont && !hasCont) {
          const contResult = await createAngajatContAction(
            angajat.id,
            statieId,
            statieNume,
            form.nume.trim(),
            form.email.trim(),
            parola,
            permisiuni
          );
          if (!contResult.success) {
            toast.error(contResult.error ?? "Eroare la crearea contului");
            return;
          }
          toast.success("Angajat actualizat și cont creat");
        } else {
          toast.success("Angajat actualizat");
        }
      } else {
        // Insert new angajat client-side
        const { data: newAngajat, error: insertError } = await (supabase as any)
          .from("angajati")
          .insert({
            statie_id: statieId,
            nume: form.nume.trim(),
            functie: form.functie.trim() || null,
            telefon: form.telefon.trim() || null,
            email: form.email.trim() || null,
            activ: form.activ,
          })
          .select("id")
          .single();

        if (insertError || !newAngajat) {
          toast.error(insertError?.message ?? "Eroare la adăugare");
          return;
        }

        if (createCont) {
          const contResult = await createAngajatContAction(
            newAngajat.id,
            statieId,
            statieNume,
            form.nume.trim(),
            form.email.trim(),
            parola,
            permisiuni
          );
          if (!contResult.success) {
            toast.error(`Angajat creat, dar eroare la cont: ${contResult.error}`);
            onSuccess();
            return;
          }
          toast.success("Angajat adăugat și cont creat. Email de invitație trimis!");
        } else {
          toast.success("Angajat adăugat");
        }
      }

      onSuccess();
    } catch (err) {
      console.error("handleSubmit error:", err);
      toast.error("Eroare neașteptată. Încearcă din nou.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCont() {
    if (!angajat || !hasCont || !angajat.profile_id) return;
    if (!confirm("Ștergi contul de acces? Angajatul nu va mai putea intra în platformă.")) return;

    setDeletingCont(true);
    const result = await deleteAngajatContAction(angajat.profile_id);
    setDeletingCont(false);

    if (result.success) {
      toast.success("Cont șters");
      onSuccess();
    } else {
      toast.error(result.error ?? "Eroare");
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-[440px] border-l border-[#E5E7EB] bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF]">
              {isEdit ? <Pencil className="h-4 w-4 text-[#1877F2]" /> : <UserPlus className="h-4 w-4 text-[#1877F2]" />}
            </div>
            <div>
              <p className="font-semibold text-[#111318] text-sm">
                {isEdit ? "Editează angajat" : "Angajat nou"}
              </p>
              <p className="text-xs text-[#9CA3AF]">
                {isEdit ? angajat.nume : "Completează datele"}
              </p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* ── Date de bază ── */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">
                Nume complet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nume}
                onChange={(e) => setField("nume", e.target.value)}
                placeholder="ex: Ion Popescu"
                className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">Funcție</label>
              <input
                type="text"
                value={form.functie}
                onChange={(e) => setField("functie", e.target.value)}
                placeholder="ex: Inspector ITP, Mecanic"
                className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">Telefon</label>
                <input
                  type="tel"
                  value={form.telefon}
                  onChange={(e) => setField("telefon", e.target.value)}
                  placeholder="07xx xxx xxx"
                  className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="ion@statie.ro"
                  className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20"
                />
              </div>
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
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.activ ? "bg-[#1877F2]" : "bg-[#E5E7EB]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    form.activ ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* ── Cont de acces ── */}
          <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-[#6B7280]" />
              <p className="text-sm font-semibold text-[#111318]">Cont de acces platformă</p>
              {hasCont && (
                <span className="ml-auto px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full border border-emerald-200">
                  Activ
                </span>
              )}
            </div>

            <div className="p-4 space-y-4">
              {hasCont ? (
                // Angajatul are deja cont — arată permisiunile
                <div className="space-y-3">
                  <p className="text-xs text-[#6B7280]">
                    Angajatul se poate loga cu emailul <strong>{angajat?.email}</strong>.
                    Editează permisiunile de mai jos.
                  </p>

                  {/* Permisiuni */}
                  <div className="space-y-2">
                    {PERMISIUNI_LIST.map(({ key, label, desc }) => (
                      <label
                        key={key}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                          permisiuni[key]
                            ? "bg-[#EFF6FF] border-[#BFDBFE]"
                            : "bg-[#F9FAFB] border-[#E5E7EB] hover:bg-[#F3F4F6]"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={permisiuni[key]}
                          onChange={() => togglePermisiune(key)}
                          className="h-4 w-4 rounded accent-[#1877F2]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium", permisiuni[key] ? "text-[#1877F2]" : "text-[#374151]")}>
                            {label}
                          </p>
                          <p className="text-xs text-[#9CA3AF]">{desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Șterge cont */}
                  <button
                    type="button"
                    onClick={handleDeleteCont}
                    disabled={deletingCont}
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                  >
                    <ShieldOff className="h-3.5 w-3.5" />
                    {deletingCont ? "Se șterge..." : "Revocă accesul la platformă"}
                  </button>
                </div>
              ) : (
                // Fără cont — toggle creare
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#111318]">Creează cont de acces</p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">
                        Angajatul va putea intra în platformă
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCreateCont((v) => !v)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        createCont ? "bg-[#1877F2]" : "bg-[#E5E7EB]"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          createCont ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {createCont && (
                    <div className="space-y-3 pt-1">
                      {/* Email (pre-filled) */}
                      <div>
                        <label className="block text-xs font-medium text-[#374151] mb-1.5">
                          Email cont <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setField("email", e.target.value)}
                          placeholder="ion@statie.ro"
                          className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20"
                        />
                      </div>

                      {/* Parolă */}
                      <div>
                        <label className="block text-xs font-medium text-[#374151] mb-1.5">
                          Parolă inițială <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={parola}
                          onChange={(e) => setParola(e.target.value)}
                          placeholder="minim 8 caractere"
                          className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 font-mono"
                        />
                        <p className="text-[11px] text-[#9CA3AF] mt-1">
                          Va fi trimisă prin email angajatului
                        </p>
                      </div>

                      {/* Permisiuni */}
                      <div>
                        <p className="text-xs font-medium text-[#374151] mb-2 flex items-center gap-1.5">
                          <Shield className="h-3.5 w-3.5" />
                          Permisiuni acces
                        </p>
                        <div className="space-y-2">
                          {PERMISIUNI_LIST.map(({ key, label, desc }) => (
                            <label
                              key={key}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                permisiuni[key]
                                  ? "bg-[#EFF6FF] border-[#BFDBFE]"
                                  : "bg-[#F9FAFB] border-[#E5E7EB] hover:bg-[#F3F4F6]"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={permisiuni[key]}
                                onChange={() => togglePermisiune(key)}
                                className="h-4 w-4 rounded accent-[#1877F2]"
                              />
                              <div className="flex-1 min-w-0">
                                <p className={cn("text-sm font-medium", permisiuni[key] ? "text-[#1877F2]" : "text-[#374151]")}>
                                  {label}
                                </p>
                                <p className="text-xs text-[#9CA3AF]">{desc}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
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
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Se salvează...
              </>
            ) : isEdit ? (
              "Salvează"
            ) : (
              "Adaugă angajat"
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
