"use client";

import { useEffect, useState } from "react";
import {
  X,
  Loader2,
  UserPlus,
  Pencil,
  KeyRound,
  Shield,
  ShieldOff,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type Angajat,
  type Permisiuni,
  DEFAULT_PERMISIUNI,
  createAngajatAction,
  updateAngajatAction,
  createContAngajatAction,
  deleteContAngajatAction,
} from "@/lib/actions/angajati";

// ─────────────────────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  angajat: Angajat | null; // null = adăugare nouă, non-null = editare
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

const EMPTY_FORM: FormState = {
  nume: "",
  functie: "",
  telefon: "",
  email: "",
  activ: true,
};

const PERMISIUNI_CONFIG: {
  key: keyof Permisiuni;
  label: string;
  desc: string;
}[] = [
  { key: "programari", label: "Programări", desc: "Crează și gestionează programări" },
  { key: "clienti", label: "Clienți", desc: "Vizualizează și editează profiluri clienți" },
  { key: "vehicule", label: "Vehicule", desc: "Vizualizează și editează vehicule" },
  { key: "rapoarte", label: "Rapoarte", desc: "Accesează rapoartele stației" },
  { key: "remindere", label: "Remindere", desc: "Gestionează reminderele SMS" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function AngajatDrawer({
  open,
  angajat,
  statieId,
  statieNume,
  onClose,
  onSuccess,
}: Props) {
  const isEdit = !!angajat;
  const hasCont = !!angajat?.profile_id;

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [permisiuni, setPermisiuni] = useState<Permisiuni>(DEFAULT_PERMISIUNI);

  // Cont creation (only for new angajat or existing without cont)
  const [vreauCont, setVreauCont] = useState(false);
  const [contEmail, setContEmail] = useState("");
  const [contParola, setContParola] = useState("");
  const [showParola, setShowParola] = useState(false);

  // Loading states
  const [saving, setSaving] = useState(false);
  const [deletingCont, setDeletingCont] = useState(false);

  // ── Sync form when angajat changes ─────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    if (angajat) {
      setForm({
        nume: angajat.nume,
        functie: angajat.functie ?? "",
        telefon: angajat.telefon ?? "",
        email: angajat.email ?? "",
        activ: angajat.activ,
      });
      setPermisiuni(
        (angajat.permisiuni as Permisiuni | null) ?? DEFAULT_PERMISIUNI
      );
    } else {
      setForm(EMPTY_FORM);
      setPermisiuni(DEFAULT_PERMISIUNI);
    }

    setVreauCont(false);
    setContEmail("");
    setContParola("");
    setShowParola(false);
  }, [open, angajat]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function togglePerm(k: keyof Permisiuni) {
    setPermisiuni((prev) => ({ ...prev, [k]: !prev[k] }));
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate basic fields
    if (!form.nume.trim()) {
      toast.error("Numele este obligatoriu");
      return;
    }

    // Validate cont creation fields
    if (vreauCont && !hasCont) {
      const emailPentruCont = contEmail.trim() || form.email.trim();
      if (!emailPentruCont) {
        toast.error("Email-ul este obligatoriu pentru crearea contului");
        return;
      }
      if (contParola.length < 8) {
        toast.error("Parola trebuie să aibă cel puțin 8 caractere");
        return;
      }
    }

    setSaving(true);
    try {
      if (isEdit && angajat) {
        // ── EDITARE ──────────────────────────────────────────────────────────
        const result = await updateAngajatAction(angajat.id, statieId, {
          nume: form.nume.trim(),
          functie: form.functie.trim() || null,
          telefon: form.telefon.trim() || null,
          email: form.email.trim() || null,
          activ: form.activ,
          // Actualizează permisiunile dacă angajatul are cont
          ...(hasCont ? { permisiuni } : {}),
        });

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        // Creează cont dacă e solicitat și nu există deja
        if (vreauCont && !hasCont) {
          const emailPentruCont = contEmail.trim() || form.email.trim();
          const contResult = await createContAngajatAction(
            angajat.id,
            statieId,
            statieNume,
            form.nume.trim(),
            emailPentruCont,
            contParola,
            permisiuni
          );
          if (!contResult.success) {
            toast.error(
              `Angajat actualizat, dar eroare la cont: ${contResult.error}`
            );
            onSuccess();
            return;
          }
          toast.success("Angajat actualizat și cont creat!");
        } else {
          toast.success("Angajat actualizat");
        }
      } else {
        // ── CREARE NOUĂ ──────────────────────────────────────────────────────
        const result = await createAngajatAction(statieId, {
          nume: form.nume.trim(),
          functie: form.functie.trim() || null,
          telefon: form.telefon.trim() || null,
          email: form.email.trim() || null,
          activ: form.activ,
        });

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        const angajatId = result.data.id;

        // Creează cont dacă e solicitat
        if (vreauCont) {
          const emailPentruCont = contEmail.trim() || form.email.trim();
          const contResult = await createContAngajatAction(
            angajatId,
            statieId,
            statieNume,
            form.nume.trim(),
            emailPentruCont,
            contParola,
            permisiuni
          );
          if (!contResult.success) {
            toast.error(
              `Angajat adăugat, dar eroare la cont: ${contResult.error}`
            );
            onSuccess();
            return;
          }
          toast.success("Angajat adăugat cu cont de acces! Email trimis.");
        } else {
          toast.success("Angajat adăugat");
        }
      }

      onSuccess();
    } finally {
      setSaving(false);
    }
  }

  // ── Delete cont ────────────────────────────────────────────────────────────
  async function handleDeleteCont() {
    if (!angajat?.profile_id) return;
    if (
      !confirm(
        "Revocare acces platformă?\nAngajatul nu va mai putea intra în cont. Datele din platformă rămân."
      )
    )
      return;

    setDeletingCont(true);
    const result = await deleteContAngajatAction(angajat.profile_id, statieId);
    setDeletingCont(false);

    if (result.success) {
      toast.success("Acces revocat");
      onSuccess();
    } else {
      toast.error(result.error);
    }
  }

  // ── Render guard ───────────────────────────────────────────────────────────
  if (!open) return null;

  const emailPentruCont = contEmail.trim() || form.email.trim();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-[460px] border-l border-[#E5E7EB] bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF]">
              {isEdit ? (
                <Pencil className="h-4 w-4 text-[#1877F2]" />
              ) : (
                <UserPlus className="h-4 w-4 text-[#1877F2]" />
              )}
            </div>
            <div>
              <p className="font-semibold text-[#111318] text-sm">
                {isEdit ? "Editează angajat" : "Angajat nou"}
              </p>
              <p className="text-xs text-[#9CA3AF]">
                {isEdit ? angajat!.nume : statieNume}
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

        {/* Scrollable form body */}
        <form
          id="angajat-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-6"
        >
          {/* ── Date personale ── */}
          <section className="space-y-4">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
              Date personale
            </p>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">
                Nume complet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nume}
                onChange={(e) => setField("nume", e.target.value)}
                placeholder="ex: Ion Popescu"
                autoComplete="off"
                className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">
                Funcție / Rol
              </label>
              <input
                type="text"
                value={form.functie}
                onChange={(e) => setField("functie", e.target.value)}
                placeholder="ex: Inspector ITP, Mecanic"
                autoComplete="off"
                className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={form.telefon}
                  onChange={(e) => setField("telefon", e.target.value)}
                  placeholder="07xx xxx xxx"
                  autoComplete="off"
                  className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="ion@statie.ro"
                  autoComplete="off"
                  className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 transition-all"
                />
              </div>
            </div>

            {/* Toggle activ */}
            <div className="flex items-center justify-between py-3 px-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
              <div>
                <p className="text-sm font-medium text-[#111318]">
                  Angajat activ
                </p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  Poate fi atribuit la programări
                </p>
              </div>
              <Toggle
                checked={form.activ}
                onChange={(v) => setField("activ", v)}
              />
            </div>
          </section>

          {/* ── Cont de acces ── */}
          <section className="border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-[#6B7280]" />
              <p className="text-sm font-semibold text-[#111318]">
                Cont de acces platformă
              </p>
              {hasCont && (
                <span className="ml-auto px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full border border-emerald-200">
                  Activ
                </span>
              )}
            </div>

            <div className="p-4 space-y-4">
              {hasCont ? (
                // ── Angajat cu cont existent ──────────────────────────────
                <div className="space-y-4">
                  <p className="text-xs text-[#6B7280]">
                    Angajatul se poate autentifica cu{" "}
                    <strong className="text-[#111318]">{angajat!.email}</strong>
                    . Modifică permisiunile de mai jos.
                  </p>

                  <PermisiuniEditor
                    permisiuni={permisiuni}
                    onToggle={togglePerm}
                  />

                  <button
                    type="button"
                    onClick={handleDeleteCont}
                    disabled={deletingCont}
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                  >
                    <ShieldOff className="h-3.5 w-3.5" />
                    {deletingCont
                      ? "Se revocă accesul..."
                      : "Revocă accesul la platformă"}
                  </button>
                </div>
              ) : (
                // ── Angajat fără cont (creare nouă sau editare) ──────────
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#111318]">
                        Creează cont de acces
                      </p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">
                        Angajatul va putea intra în platformă
                      </p>
                    </div>
                    <Toggle
                      checked={vreauCont}
                      onChange={setVreauCont}
                    />
                  </div>

                  {vreauCont && (
                    <div className="space-y-3 pt-1">
                      {/* Email cont */}
                      <div>
                        <label className="block text-xs font-medium text-[#374151] mb-1.5">
                          Email cont{" "}
                          <span className="text-red-500">*</span>
                          {form.email && !contEmail && (
                            <span className="ml-1 text-[#9CA3AF]">
                              (preluat din câmpul de mai sus)
                            </span>
                          )}
                        </label>
                        <input
                          type="email"
                          value={contEmail}
                          onChange={(e) => setContEmail(e.target.value)}
                          placeholder={
                            form.email || "email@angajat.ro"
                          }
                          autoComplete="new-password"
                          className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 transition-all"
                        />
                        {!emailPentruCont && (
                          <p className="text-[11px] text-red-400 mt-1">
                            Completează email-ul angajatului sau câmpul Email de mai sus.
                          </p>
                        )}
                      </div>

                      {/* Parolă */}
                      <div>
                        <label className="block text-xs font-medium text-[#374151] mb-1.5">
                          Parolă inițială{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showParola ? "text" : "password"}
                            value={contParola}
                            onChange={(e) => setContParola(e.target.value)}
                            placeholder="minim 8 caractere"
                            autoComplete="new-password"
                            className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 pr-9 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 transition-all font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowParola((v) => !v)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                          >
                            {showParola ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {contParola && contParola.length < 8 && (
                          <p className="text-[11px] text-amber-500 mt-1">
                            Parola trebuie să aibă minim 8 caractere ({contParola.length}/8)
                          </p>
                        )}
                        <p className="text-[11px] text-[#9CA3AF] mt-1">
                          Va fi trimisă prin email angajatului.
                        </p>
                      </div>

                      {/* Permisiuni */}
                      <div>
                        <p className="text-xs font-medium text-[#374151] mb-2 flex items-center gap-1.5">
                          <Shield className="h-3.5 w-3.5" />
                          Permisiuni de acces
                        </p>
                        <PermisiuniEditor
                          permisiuni={permisiuni}
                          onToggle={togglePerm}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </form>

        {/* Footer */}
        <div className="border-t border-[#E5E7EB] p-4 flex gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={saving}
          >
            Anulează
          </Button>
          <Button
            type="submit"
            form="angajat-form"
            className="flex-1 bg-[#1877F2] hover:bg-[#1565D8]"
            disabled={saving || !form.nume.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Se salvează...
              </>
            ) : isEdit ? (
              "Salvează modificările"
            ) : (
              "Adaugă angajat"
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2]/40",
        checked ? "bg-[#1877F2]" : "bg-[#E5E7EB]"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

function PermisiuniEditor({
  permisiuni,
  onToggle,
}: {
  permisiuni: Permisiuni;
  onToggle: (k: keyof Permisiuni) => void;
}) {
  return (
    <div className="space-y-2">
      {PERMISIUNI_CONFIG.map(({ key, label, desc }) => (
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
            onChange={() => onToggle(key)}
            className="h-4 w-4 rounded accent-[#1877F2] shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm font-medium",
                permisiuni[key] ? "text-[#1877F2]" : "text-[#374151]"
              )}
            >
              {label}
            </p>
            <p className="text-xs text-[#9CA3AF]">{desc}</p>
          </div>
        </label>
      ))}
    </div>
  );
}
