"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { X, Car, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface Props {
  statieId: string;
  prefillPlate?: string;
  onClose: () => void;
  onSave: () => void;
}

export function QuickAddVehiculModal({ statieId, prefillPlate = "", onClose, onSave }: Props) {
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [plate, setPlate] = useState(prefillPlate.toUpperCase());
  const [telefon, setTelefon] = useState("");
  const [nume, setNume] = useState("");

  function salveaza() {
    if (!plate.trim()) { toast.error("Introduceți numărul de înmatriculare"); return; }
    if (!telefon.trim()) { toast.error("Telefonul proprietarului este obligatoriu"); return; }
    if (!nume.trim()) { toast.error("Numele proprietarului este obligatoriu"); return; }

    startTransition(async () => {
      // Upsert client by phone
      const { data: existing } = await supabase
        .from("clienti")
        .select("id")
        .eq("statie_id", statieId)
        .eq("telefon", telefon.trim())
        .maybeSingle();

      let clientId: string;
      if (existing) {
        clientId = existing.id;
      } else {
        const { data: newClient, error } = await supabase
          .from("clienti")
          .insert({ statie_id: statieId, nume: nume.trim(), telefon: telefon.trim() })
          .select("id")
          .single();
        if (error || !newClient) { toast.error("Eroare la crearea proprietarului"); return; }
        clientId = newClient.id;
      }

      const { error } = await supabase.from("vehicule").insert({
        statie_id: statieId,
        client_id: clientId,
        nr_inmatriculare: plate.trim().toUpperCase(),
      });

      if (error) {
        if (error.code === "23505") toast.error("Există deja un vehicul cu acest număr");
        else toast.error("Eroare la adăugarea vehiculului");
        return;
      }

      toast.success("Vehicul adăugat cu succes!");
      onSave();
    });
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ duration: 0.22 }}
          className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0FDF4]">
                <Car className="h-4 w-4 text-[#16A34A]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111318]">Adăugare rapidă vehicul</p>
                <p className="text-xs text-[#9CA3AF]">Câmpuri esențiale — detalii mai târziu</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="text-[#9CA3AF] hover:text-[#374151] transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[#374151]">
                Nr. înmatriculare <span className="text-red-500">*</span>
              </Label>
              <Input
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="B 123 ABC"
                className="font-mono uppercase tracking-widest text-center text-base h-11"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#374151]">
                Telefon proprietar <span className="text-red-500">*</span>
              </Label>
              <Input
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                placeholder="07xx xxx xxx"
                type="tel"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#374151]">
                Nume proprietar <span className="text-red-500">*</span>
              </Label>
              <Input
                value={nume}
                onChange={(e) => setNume(e.target.value)}
                placeholder="Popescu Ion"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={onClose} className="flex-1" disabled={isPending}>
                Anulează
              </Button>
              <Button
                onClick={salveaza}
                disabled={isPending}
                className="flex-1 bg-[#16A34A] hover:bg-[#15803D]"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adaugă vehicul
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
