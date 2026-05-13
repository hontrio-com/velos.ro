"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  X, ScanText, Loader2, Car, CheckCircle2, AlertCircle, Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { runLicensePlateOcr } from "@/lib/ocr";
import { scanVehiculAction } from "@/lib/actions/scan-vehicul";

interface Props {
  statieId: string;
  onClose: () => void;
}

type Step = "scan" | "confirm" | "saving" | "done";

export function ScanVehiculModal({ statieId, onClose }: Props) {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("scan");
  const [scanning, setScanning] = useState(false);
  const [plate, setPlate] = useState("");
  const [marca, setMarca] = useState("");
  const [model, setModel] = useState("");
  const [expirareItp, setExpirareItp] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);

  async function handlePhoto(file: File) {
    setScanning(true);
    try {
      const result = await runLicensePlateOcr(file);
      setPlate(result.plate ?? "");
      setStep("confirm");
      if (!result.plate) {
        toast.warning("Nu s-a putut detecta automat numărul — completează manual");
      }
    } catch {
      toast.error("Eroare la scanare");
      setStep("confirm");
    } finally {
      setScanning(false);
    }
  }

  async function handleSave() {
    if (!plate.trim()) { toast.error("Nr. înmatriculare este obligatoriu"); return; }
    setStep("saving");
    const result = await scanVehiculAction({
      nrInmatriculare: plate,
      marca: marca || undefined,
      model: model || undefined,
      expirareItp: expirareItp || undefined,
      statieId,
    });
    if (result.success) {
      setCreatedId(result.vehiculId);
      setStep("done");
      router.refresh();
    } else {
      toast.error(result.error ?? "Eroare la salvare");
      setStep("confirm");
    }
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF]">
                <ScanText className="h-4 w-4 text-[#1877F2]" />
              </div>
              <p className="text-sm font-semibold text-[#111318]">Scanează vehicul</p>
            </div>
            <button type="button" onClick={onClose} className="text-[#9CA3AF] hover:text-[#374151] transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Step: scan */}
            {step === "scan" && (
              <>
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handlePhoto(f);
                    e.target.value = "";
                  }}
                />

                <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex flex-col items-center gap-3 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EFF6FF]">
                    <Camera className="h-7 w-7 text-[#1877F2]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111318]">Fotografiați plăcuța</p>
                    <p className="text-xs text-[#6B7280] mt-1">
                      Pe telefon se deschide camera. Asigurați-vă că numărul este clar și bine iluminat.
                    </p>
                  </div>
                  <Button
                    className="bg-[#1877F2] hover:bg-[#1565D8] gap-2 mt-1"
                    onClick={() => cameraRef.current?.click()}
                    disabled={scanning}
                  >
                    {scanning ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />Scanare în curs...</>
                    ) : (
                      <><Camera className="h-4 w-4" />Deschide camera</>
                    )}
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={() => setStep("confirm")}
                  className="w-full text-center text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                >
                  Completează manual →
                </button>
              </>
            )}

            {/* Step: confirm */}
            {step === "confirm" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">
                    Nr. înmatriculare *
                  </label>
                  <input
                    type="text"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    placeholder="B 123 ABC"
                    className="w-full text-sm font-mono font-bold rounded-lg border border-[#E5E7EB] px-3 py-2.5 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 text-[#111318] placeholder:text-[#9CA3AF] placeholder:font-normal"
                    autoFocus
                  />
                  {plate && (
                    <p className="text-[11px] text-[#9CA3AF] mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-[#16A34A]" />
                      Detectat automat prin OCR — verificați corectitudinea
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Marcă</label>
                    <input type="text" value={marca} onChange={(e) => setMarca(e.target.value)}
                      placeholder="Dacia"
                      className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] text-[#111318] placeholder:text-[#9CA3AF]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Model</label>
                    <input type="text" value={model} onChange={(e) => setModel(e.target.value)}
                      placeholder="Logan"
                      className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] text-[#111318] placeholder:text-[#9CA3AF]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">
                    Data expirare ITP
                    <span className="ml-1 text-[#9CA3AF] font-normal">(opțional — crează remindere automat)</span>
                  </label>
                  <input type="date" value={expirareItp} onChange={(e) => setExpirareItp(e.target.value)}
                    className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] text-[#111318]" />
                  {expirareItp && (
                    <p className="text-[11px] text-[#1877F2] mt-1">
                      ✓ Se vor crea remindere la 30 zile, 7 zile și 1 zi înainte de expirare
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setStep("scan")}>
                    ← Scanează din nou
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-[#1877F2] hover:bg-[#1565D8]"
                    onClick={handleSave}
                    disabled={!plate.trim()}
                  >
                    <Car className="h-3.5 w-3.5 mr-1.5" />
                    Salvează vehicul
                  </Button>
                </div>
              </div>
            )}

            {/* Step: saving */}
            {step === "saving" && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <Loader2 className="h-8 w-8 text-[#1877F2] animate-spin" />
                <p className="text-sm font-medium text-[#111318]">Se salvează vehiculul...</p>
                <p className="text-xs text-[#9CA3AF]">Se creează și reminderele ITP</p>
              </div>
            )}

            {/* Step: done */}
            {step === "done" && (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F0FDF4]">
                  <CheckCircle2 className="h-7 w-7 text-[#16A34A]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111318]">{plate} adăugat!</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    {expirareItp ? "Vehicul creat + remindere ITP programate." : "Vehicul creat cu succes."}
                  </p>
                </div>
                <div className="flex gap-3 w-full">
                  <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>
                    Închide
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-[#1877F2] hover:bg-[#1565D8]"
                    onClick={() => {
                      onClose();
                      router.push(`/vehicule/${createdId}`);
                    }}
                  >
                    Vezi profil →
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
