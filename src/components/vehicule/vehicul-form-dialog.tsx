"use client";

import { useState, useTransition } from "react";
import { X, Loader2, Car, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface VehiculInitial {
  id: string;
  nr_inmatriculare: string;
  marca: string | null;
  model: string | null;
  an_fabricatie: number | null;
  serie_sasiu: string | null;
  culoare: string | null;
  expirare_itp: string | null;
  observatii: string | null;
  client: {
    id: string;
    nume: string;
    prenume: string | null;
    telefon: string;
    email: string | null;
  } | null;
}

interface VehiculFormDialogProps {
  statieId: string;
  initial?: VehiculInitial | null;
  prefillNrInmatriculare?: string;
  onClose: () => void;
  onSave: () => void;
}

export function VehiculFormDialog({
  statieId,
  initial,
  prefillNrInmatriculare,
  onClose,
  onSave,
}: VehiculFormDialogProps) {
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!initial;

  // Proprietar
  const [telefon, setTelefon] = useState(initial?.client?.telefon ?? "");
  const [nume, setNume] = useState(initial?.client?.nume ?? "");
  const [prenume, setPrenume] = useState(initial?.client?.prenume ?? "");
  const [email, setEmail] = useState(initial?.client?.email ?? "");

  // Vehicul
  const [nrInmatriculare, setNrInmatriculare] = useState(
    initial?.nr_inmatriculare ?? prefillNrInmatriculare ?? ""
  );
  const [marca, setMarca] = useState(initial?.marca ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [anFabricatie, setAnFabricatie] = useState(
    initial?.an_fabricatie ? String(initial.an_fabricatie) : ""
  );
  const [serieSasiu, setSerieSasiu] = useState(initial?.serie_sasiu ?? "");
  const [culoare, setCuloare] = useState(initial?.culoare ?? "");
  const [expirareItp, setExpirareItp] = useState(initial?.expirare_itp ?? "");
  const [observatii, setObservatii] = useState(initial?.observatii ?? "");

  function salveaza() {
    if (!telefon.trim()) {
      toast.error("Telefonul proprietarului este obligatoriu");
      return;
    }
    if (!nume.trim()) {
      toast.error("Numele proprietarului este obligatoriu");
      return;
    }
    if (!nrInmatriculare.trim()) {
      toast.error("Numarul de inmatriculare este obligatoriu");
      return;
    }

    startTransition(async () => {
      let clientId = initial?.client?.id ?? null;

      if (isEdit && clientId) {
        // Update existing client
        const { error } = await supabase
          .from("clienti")
          .update({
            nume: nume.trim(),
            prenume: prenume.trim() || null,
            telefon: telefon.trim(),
            email: email.trim() || null,
          })
          .eq("id", clientId);

        if (error) {
          toast.error("Eroare la actualizarea proprietarului");
          return;
        }
      } else {
        // Upsert client by phone
        const { data: existing } = await supabase
          .from("clienti")
          .select("id")
          .eq("statie_id", statieId)
          .eq("telefon", telefon.trim())
          .maybeSingle();

        if (existing) {
          clientId = existing.id;
          await supabase
            .from("clienti")
            .update({
              nume: nume.trim(),
              prenume: prenume.trim() || null,
              email: email.trim() || null,
            })
            .eq("id", existing.id);
        } else {
          const { data: newClient, error } = await supabase
            .from("clienti")
            .insert({
              statie_id: statieId,
              nume: nume.trim(),
              prenume: prenume.trim() || null,
              telefon: telefon.trim(),
              email: email.trim() || null,
            })
            .select("id")
            .single();

          if (error || !newClient) {
            toast.error("Eroare la crearea proprietarului");
            return;
          }
          clientId = newClient.id;
        }
      }

      const vehiculPayload = {
        nr_inmatriculare: nrInmatriculare.trim().toUpperCase(),
        marca: marca.trim() || null,
        model: model.trim() || null,
        an_fabricatie: anFabricatie ? parseInt(anFabricatie) : null,
        serie_sasiu: serieSasiu.trim() || null,
        culoare: culoare.trim() || null,
        expirare_itp: expirareItp || null,
        observatii: observatii.trim() || null,
        client_id: clientId!,
      };

      if (isEdit) {
        const { error } = await supabase
          .from("vehicule")
          .update(vehiculPayload)
          .eq("id", initial!.id);

        if (error) {
          toast.error("Eroare la actualizarea vehiculului");
          return;
        }
        toast.success("Vehicul actualizat");
      } else {
        const { error } = await supabase.from("vehicule").insert({
          ...vehiculPayload,
          statie_id: statieId,
        });

        if (error) {
          if (error.code === "23505") {
            toast.error("Exista deja un vehicul cu acest numar de inmatriculare");
          } else {
            toast.error("Eroare la adaugarea vehiculului");
          }
          return;
        }
        toast.success("Vehicul adaugat");
      }

      onSave();
    });
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div>
              <p className="font-semibold text-base">
                {isEdit ? "Editeaza vehicul" : "Vehicul nou"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEdit
                  ? "Modifica datele vehiculului si proprietarului"
                  : "Adauga un vehicul si proprietarul acestuia"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Proprietar */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Proprietar
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>
                    Telefon <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={telefon}
                    onChange={(e) => setTelefon(e.target.value)}
                    placeholder="07xx xxx xxx"
                    type="tel"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplu.ro"
                    type="email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>
                    Nume <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={nume}
                    onChange={(e) => setNume(e.target.value)}
                    placeholder="Popescu"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Prenume</Label>
                  <Input
                    value={prenume}
                    onChange={(e) => setPrenume(e.target.value)}
                    placeholder="Ion"
                  />
                </div>
              </div>
            </div>

            {/* Vehicul */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Date vehicul
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>
                  Nr. inmatriculare <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={nrInmatriculare}
                  onChange={(e) =>
                    setNrInmatriculare(e.target.value.toUpperCase())
                  }
                  placeholder="B 123 ABC"
                  className="font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Marca</Label>
                  <Input
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    placeholder="Dacia"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Model</Label>
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Logan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>An fabricatie</Label>
                  <Input
                    value={anFabricatie}
                    onChange={(e) => setAnFabricatie(e.target.value)}
                    placeholder="2020"
                    type="number"
                    min={1900}
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Culoare</Label>
                  <Input
                    value={culoare}
                    onChange={(e) => setCuloare(e.target.value)}
                    placeholder="Alb"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Serie sasiu (VIN)</Label>
                  <Input
                    value={serieSasiu}
                    onChange={(e) => setSerieSasiu(e.target.value.toUpperCase())}
                    placeholder="WBA3A5..."
                    className="font-mono uppercase text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Expirare ITP</Label>
                  <Input
                    type="date"
                    lang="ro"
                    value={expirareItp}
                    onChange={(e) => setExpirareItp(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Observatii</Label>
                <Textarea
                  value={observatii}
                  onChange={(e) => setObservatii(e.target.value)}
                  rows={2}
                  placeholder="Note suplimentare despre vehicul..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border p-4 shrink-0 flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Anuleaza
            </Button>
            <Button onClick={salveaza} disabled={isPending} className="flex-1">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salveaza modificarile" : "Adauga vehicul"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
