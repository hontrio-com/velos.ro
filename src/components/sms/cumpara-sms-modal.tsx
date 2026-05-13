"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Zap, Check, Minus, Plus } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PACHETE = [
  { id: "p100", cantitate: 100, pret: 5.0, popular: false },
  { id: "p500", cantitate: 500, pret: 25.0, popular: true },
  { id: "p1000", cantitate: 1000, pret: 50.0, popular: false },
];

const PRET_PER_SMS = 0.05;
const MIN_CUSTOM = 50;

export function CumparaSmsModal({ open, onClose }: Props) {
  const [selected, setSelected] = useState<string>("p500");
  const [customQty, setCustomQty] = useState(200);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isCustom = selected === "custom";
  const cantitate = isCustom
    ? Math.max(MIN_CUSTOM, customQty)
    : PACHETE.find((p) => p.id === selected)?.cantitate ?? 500;
  const pretTotal = isCustom
    ? Math.round(cantitate * PRET_PER_SMS * 100) / 100
    : PACHETE.find((p) => p.id === selected)?.pret ?? 0;

  async function handleCumpara() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cantitate }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <MessageSquare className="h-5 w-5 text-[#1877F2]" />
                  <h2 className="text-lg font-semibold text-[#111318]">Cumpără SMS-uri</h2>
                </div>
                <p className="text-sm text-[#6B7280]">0,05€/SMS · Nu expiră niciodată</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#F3F4F6] transition-colors"
              >
                <X className="h-4 w-4 text-[#6B7280]" />
              </button>
            </div>

            {/* Pachete */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {PACHETE.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p.id)}
                  className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                    selected === p.id
                      ? "border-[#1877F2] bg-[#EFF6FF]"
                      : "border-[#E5E7EB] hover:border-[#D1D5DB] bg-white"
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#1877F2] text-white text-[10px] font-medium whitespace-nowrap">
                      Popular
                    </span>
                  )}
                  <span className="text-lg font-bold text-[#111318]">
                    {p.cantitate >= 1000 ? `${p.cantitate / 1000}K` : p.cantitate}
                  </span>
                  <span className="text-xs text-[#6B7280] mb-1">SMS</span>
                  <span className="text-sm font-semibold text-[#1877F2]">{p.pret.toFixed(2)}€</span>
                  {selected === p.id && (
                    <Check className="absolute top-2 right-2 h-3.5 w-3.5 text-[#1877F2]" />
                  )}
                </button>
              ))}
            </div>

            {/* Custom */}
            <button
              type="button"
              onClick={() => setSelected("custom")}
              className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all mb-5 ${
                isCustom
                  ? "border-[#1877F2] bg-[#EFF6FF]"
                  : "border-[#E5E7EB] hover:border-[#D1D5DB] bg-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#F59E0B]" />
                <span className="text-sm font-medium text-[#111318]">Cantitate personalizată</span>
              </div>
              {isCustom ? (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setCustomQty((q) => Math.max(MIN_CUSTOM, q - 50))}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB]"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <input
                    type="number"
                    min={MIN_CUSTOM}
                    step={50}
                    value={customQty}
                    onChange={(e) => setCustomQty(Math.max(MIN_CUSTOM, parseInt(e.target.value) || MIN_CUSTOM))}
                    className="w-20 text-center text-sm font-semibold border border-[#E5E7EB] rounded-lg px-2 py-1 outline-none focus:border-[#1877F2]"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomQty((q) => q + 50)}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB]"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <span className="text-xs text-[#9CA3AF]">min. {MIN_CUSTOM} SMS</span>
              )}
            </button>

            {/* Sumar */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7F8FA] mb-4">
              <div>
                <p className="text-sm text-[#6B7280]">Total de plată</p>
                <p className="text-xl font-bold text-[#111318]">{pretTotal.toFixed(2)}€</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#6B7280]">Primești</p>
                <p className="text-xl font-bold text-[#1877F2]">{cantitate.toLocaleString("ro")} SMS</p>
              </div>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={handleCumpara}
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#1877F2] hover:bg-[#1565D8] text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Se redirecționează..." : "Plătește cu cardul →"}
            </button>

            <p className="text-center text-[11px] text-[#9CA3AF] mt-3">
              Plată securizată prin Stripe · SMS-urile nu expiră
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
