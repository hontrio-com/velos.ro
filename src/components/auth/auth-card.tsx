"use client";

import { motion } from "framer-motion";

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-[420px] bg-white rounded-xl p-6 sm:p-10"
    >
      {children}
    </motion.div>
  );
}
