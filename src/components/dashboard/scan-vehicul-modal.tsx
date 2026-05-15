"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { X, ScanText, Loader2, Camera, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runLicensePlateOcr } from "@/lib/ocr";

interface Props {
  onClose: () => void;
  onPlateScan: (plate: string) => void;
}

export function ScanVehiculModal({ onClose, onPlateScan }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);

  async function handlePhoto(file: File) {
    setScanning(true);
    try {
      const result = await runLicensePlateOcr(file);
      if (result.plate) {
        onPlateScan(result.plate);
        onClose();
      } else {
        toast.warning("Nu s-a detectat nicio plăcuță — completați manual");
        onPlateScan("");
        onClose();
      }
    } catch {
      toast.error("Eroare la scanare");
      onPlateScan("");
      onClose();
    } finally {
      setScanning(false);
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
              <p className="text-sm font-semibold text-[#111318]">Scanează plăcuța</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[#9CA3AF] hover:text-[#374151] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5">
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

            {scanning ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Loader2 className="h-8 w-8 text-[#1877F2] animate-spin" />
                <p className="text-sm font-medium text-[#111318]">Se analizează imaginea...</p>
                <p className="text-xs text-[#9CA3AF]">AI detectează numărul de înmatriculare</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EFF6FF]">
                  <Camera className="h-8 w-8 text-[#1877F2]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111318]">Fotografiați plăcuța</p>
                  <p className="text-xs text-[#6B7280] mt-1 max-w-[240px]">
                    Asigurați-vă că plăcuța este clară și bine iluminată. AI-ul detectează automat numărul.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
                  <span>Recunoaștere AI rapidă · fără descărcări</span>
                </div>

                <Button
                  className="bg-[#1877F2] hover:bg-[#1565D8] gap-2 w-full"
                  onClick={() => cameraRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                  Deschide camera
                </Button>

                <button
                  type="button"
                  onClick={() => { onPlateScan(""); onClose(); }}
                  className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                >
                  Completează manual fără scanare →
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
