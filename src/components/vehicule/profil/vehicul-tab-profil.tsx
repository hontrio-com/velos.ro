"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Loader2, Car, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateVehiculProfileAction } from "@/lib/actions/documente";
import type { VehiculComplet } from "./vehicul-profil-client";

const TIP_VEHICUL = ["autoturism", "autoutilitara", "motocicleta", "autobus", "camion", "remorca", "altul"];
const COMBUSTIBIL = ["benzina", "motorina", "electric", "hibrid", "gpl", "cng", "altul"];
const TIP_PROPRIETAR = [
  { value: "persoana_fizica", label: "Persoană fizică" },
  { value: "persoana_juridica", label: "Persoană juridică" },
];

interface Props { vehicul: VehiculComplet }

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFF6FF]">
        <Icon className="h-3.5 w-3.5 text-[#1877F2]" />
      </div>
      <h3 className="text-sm font-semibold text-[#111318]">{title}</h3>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#374151] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 text-[#111318] placeholder:text-[#9CA3AF]"
    />
  );
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 text-[#111318] bg-white"
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function VehiculTabProfil({ vehicul }: Props) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nr_inmatriculare: vehicul.nr_inmatriculare,
    marca: vehicul.marca ?? "",
    model: vehicul.model ?? "",
    an_fabricatie: vehicul.an_fabricatie?.toString() ?? "",
    serie_sasiu: vehicul.serie_sasiu ?? "",
    vin: vehicul.vin ?? "",
    culoare: vehicul.culoare ?? "",
    tip_vehicul: vehicul.tip_vehicul ?? "autoturism",
    combustibil: vehicul.combustibil ?? "",
    capacitate_cilindrica: vehicul.capacitate_cilindrica?.toString() ?? "",
    masa_maxima: vehicul.masa_maxima?.toString() ?? "",
    kilometraj: vehicul.kilometraj?.toString() ?? "",
    expirare_itp: vehicul.expirare_itp ?? "",
    expirare_rca: vehicul.expirare_rca ?? "",
    expirare_rovinieta: vehicul.expirare_rovinieta ?? "",
    expirare_revizie: vehicul.expirare_revizie ?? "",
    expirare_tahograf: vehicul.expirare_tahograf ?? "",
    expirare_iscir: vehicul.expirare_iscir ?? "",
    tip_proprietar: vehicul.tip_proprietar ?? "persoana_fizica",
    denumire_firma: vehicul.denumire_firma ?? "",
    cui_firma: vehicul.cui_firma ?? "",
    observatii: vehicul.observatii ?? "",
    note_interne: vehicul.note_interne ?? "",
  });

  function set(key: keyof typeof form, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    const payload: Record<string, string | number | null> = {
      nr_inmatriculare: form.nr_inmatriculare.trim(),
      marca: form.marca || null,
      model: form.model || null,
      an_fabricatie: form.an_fabricatie ? parseInt(form.an_fabricatie) : null,
      serie_sasiu: form.serie_sasiu || null,
      vin: form.vin || null,
      culoare: form.culoare || null,
      tip_vehicul: form.tip_vehicul || null,
      combustibil: form.combustibil || null,
      capacitate_cilindrica: form.capacitate_cilindrica ? parseInt(form.capacitate_cilindrica) : null,
      masa_maxima: form.masa_maxima ? parseInt(form.masa_maxima) : null,
      kilometraj: form.kilometraj ? parseInt(form.kilometraj) : null,
      expirare_itp: form.expirare_itp || null,
      expirare_rca: form.expirare_rca || null,
      expirare_rovinieta: form.expirare_rovinieta || null,
      expirare_revizie: form.expirare_revizie || null,
      expirare_tahograf: form.expirare_tahograf || null,
      expirare_iscir: form.expirare_iscir || null,
      tip_proprietar: form.tip_proprietar,
      denumire_firma: form.denumire_firma || null,
      cui_firma: form.cui_firma || null,
      observatii: form.observatii || null,
      note_interne: form.note_interne || null,
    };

    const result = await updateVehiculProfileAction(vehicul.id, payload);
    setSaving(false);
    if (result.success) {
      toast.success("Vehicul actualizat");
      queryClient.invalidateQueries({ queryKey: ["vehicul-profil", vehicul.id] });
      queryClient.invalidateQueries({ queryKey: ["vehicule-list"] });
    } else {
      toast.error(result.error ?? "Eroare la salvare");
    }
  }

  return (
    <div className="space-y-5">
      {/* Date generale */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl p-5">
        <SectionTitle icon={Car} title="Date vehicul" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Nr. înmatriculare *">
            <Input value={form.nr_inmatriculare} onChange={(v) => set("nr_inmatriculare", v.toUpperCase())} placeholder="B 123 ABC" />
          </Field>
          <Field label="Marcă">
            <Input value={form.marca} onChange={(v) => set("marca", v)} placeholder="Dacia" />
          </Field>
          <Field label="Model">
            <Input value={form.model} onChange={(v) => set("model", v)} placeholder="Logan" />
          </Field>
          <Field label="An fabricație">
            <Input type="number" value={form.an_fabricatie} onChange={(v) => set("an_fabricatie", v)} placeholder="2020" />
          </Field>
          <Field label="Tip vehicul">
            <Select value={form.tip_vehicul} onChange={(v) => set("tip_vehicul", v)}
              options={TIP_VEHICUL.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))} />
          </Field>
          <Field label="Combustibil">
            <Select value={form.combustibil} onChange={(v) => set("combustibil", v)}
              options={[{ value: "", label: "— Selectează —" }, ...COMBUSTIBIL.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))]} />
          </Field>
          <Field label="Serie șasiu / VIN">
            <Input value={form.serie_sasiu} onChange={(v) => set("serie_sasiu", v.toUpperCase())} placeholder="UU1LSDABC..." />
          </Field>
          <Field label="VIN (alternativ)">
            <Input value={form.vin} onChange={(v) => set("vin", v.toUpperCase())} placeholder="WVWZZZ1JZ3W386752" />
          </Field>
          <Field label="Culoare">
            <Input value={form.culoare} onChange={(v) => set("culoare", v)} placeholder="Alb, Negru..." />
          </Field>
          <Field label="Capacitate cilindrică (cc)">
            <Input type="number" value={form.capacitate_cilindrica} onChange={(v) => set("capacitate_cilindrica", v)} placeholder="1600" />
          </Field>
          <Field label="Masă maximă (kg)">
            <Input type="number" value={form.masa_maxima} onChange={(v) => set("masa_maxima", v)} placeholder="3500" />
          </Field>
          <Field label="Kilometraj actual">
            <Input type="number" value={form.kilometraj} onChange={(v) => set("kilometraj", v)} placeholder="125000" />
          </Field>
        </div>
      </div>

      {/* Expirări */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl p-5">
        <SectionTitle icon={Settings} title="Date expirare" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { key: "expirare_itp", label: "Expirare ITP" },
            { key: "expirare_rca", label: "Expirare RCA" },
            { key: "expirare_rovinieta", label: "Expirare Rovinietă" },
            { key: "expirare_revizie", label: "Expirare Revizie" },
            { key: "expirare_tahograf", label: "Expirare Tahograf" },
            { key: "expirare_iscir", label: "Expirare ISCIR" },
          ].map(({ key, label }) => (
            <Field key={key} label={label}>
              <Input type="date" value={form[key as keyof typeof form]} onChange={(v) => set(key as keyof typeof form, v)} />
            </Field>
          ))}
        </div>
      </div>

      {/* Proprietar */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl p-5">
        <SectionTitle icon={User} title="Proprietar" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Tip proprietar">
            <Select value={form.tip_proprietar} onChange={(v) => set("tip_proprietar", v)} options={TIP_PROPRIETAR} />
          </Field>
          {form.tip_proprietar === "persoana_juridica" && (
            <>
              <Field label="Denumire firmă">
                <Input value={form.denumire_firma} onChange={(v) => set("denumire_firma", v)} placeholder="SC Example SRL" />
              </Field>
              <Field label="CUI firmă">
                <Input value={form.cui_firma} onChange={(v) => set("cui_firma", v)} placeholder="RO12345678" />
              </Field>
            </>
          )}
        </div>
      </div>

      {/* Observații */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl p-5">
        <SectionTitle icon={Settings} title="Observații" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Observații publice">
            <textarea value={form.observatii} onChange={(e) => set("observatii", e.target.value)} rows={3}
              placeholder="Observații vizibile în programări..."
              className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 resize-none text-[#111318] placeholder:text-[#9CA3AF]" />
          </Field>
          <Field label="Note interne (nu se văd la client)">
            <textarea value={form.note_interne} onChange={(e) => set("note_interne", e.target.value)} rows={3}
              placeholder="Note interne, observații inspector..."
              className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 resize-none text-[#111318] placeholder:text-[#9CA3AF]" />
          </Field>
        </div>
      </div>

      <Button
        className="bg-[#1877F2] hover:bg-[#1565D8] gap-2"
        onClick={handleSave}
        disabled={saving || !form.nr_inmatriculare.trim()}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvează modificările
      </Button>
    </div>
  );
}
