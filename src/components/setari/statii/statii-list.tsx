"use client";

import { motion, AnimatePresence } from "framer-motion";
import { StatieCard } from "./statie-card";
import type { StatieExtinsa } from "@/types/database.types";

interface StatiiListProps {
  statii: StatieExtinsa[];
}

export function StatiiList({ statii }: StatiiListProps) {
  return (
    <div className="space-y-4">
      <AnimatePresence>
        {statii.map((statie, i) => (
          <motion.div
            key={statie.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <StatieCard statie={statie} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
