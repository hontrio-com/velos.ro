"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, CalendarDays, Users, Car, ScanText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { ScanVehiculModal } from "./scan-vehicul-modal";

const NAV_ACTIONS = [
  { icon: CalendarDays, label: "Programare nouă", href: "/programari", color: "bg-[#1877F2]" },
  { icon: Users,        label: "Client nou",       href: "/clienti",    color: "bg-[#7C3AED]" },
  { icon: Car,          label: "Vehicul nou",       href: "/vehicule",   color: "bg-[#16A34A]" },
];

export function QuickActions() {
  const [open, setOpen] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const router = useRouter();
  const statieId = useAppStore((s) => s.statieActivaId);

  function handleAction(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[-1]"
                onClick={() => setOpen(false)}
              />

              {/* Scan vehicul — special action */}
              <motion.div
                key="scan"
                initial={{ opacity: 0, y: 16, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.9 }}
                transition={{ duration: 0.18, delay: NAV_ACTIONS.length * 0.05 }}
                className="flex items-center gap-3"
              >
                <span className="bg-white text-[#111318] text-xs font-medium px-2.5 py-1.5 rounded-lg shadow border border-[#F3F4F6] whitespace-nowrap">
                  Scanează vehicul
                </span>
                <motion.button
                  type="button"
                  onClick={() => { setOpen(false); setShowScan(true); }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full shadow-md bg-[#F59E0B]"
                >
                  <ScanText className="h-[18px] w-[18px] text-white" />
                </motion.button>
              </motion.div>

              {/* Regular nav actions */}
              {NAV_ACTIONS.map((action, i) => {
                const Icon = action.icon;
                return (
                  <motion.div
                    key={action.href}
                    initial={{ opacity: 0, y: 16, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.9 }}
                    transition={{ duration: 0.18, delay: (NAV_ACTIONS.length - 1 - i) * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <span className="bg-white text-[#111318] text-xs font-medium px-2.5 py-1.5 rounded-lg shadow border border-[#F3F4F6] whitespace-nowrap">
                      {action.label}
                    </span>
                    <motion.button
                      type="button"
                      onClick={() => handleAction(action.href)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full shadow-md",
                        action.color
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] text-white" />
                    </motion.button>
                  </motion.div>
                );
              })}
            </>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          type="button"
          onClick={() => setOpen((v) => !v)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1877F2] shadow-lg"
          style={{ boxShadow: "0 4px 12px rgba(24,119,242,0.4)" }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
        >
          <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
            <Plus className="h-5 w-5 text-white" />
          </motion.div>
        </motion.button>
      </div>

      {/* Scan modal */}
      {showScan && statieId && (
        <ScanVehiculModal
          statieId={statieId}
          onClose={() => setShowScan(false)}
        />
      )}
    </>
  );
}
