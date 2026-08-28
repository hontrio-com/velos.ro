"use client";

import { useEffect, useState, useTransition } from "react";
import { Eye, LogOut } from "lucide-react";
import { stopImpersonation } from "@/lib/actions/impersonation";

interface Props {
  targetEmail: string;
  targetName: string | null;
  adminEmail: string;
  expiresAt: number;
}

function ramas(expiresAt: number) {
  const s = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function ImpersonationBanner({ targetEmail, targetName, adminEmail, expiresAt }: Props) {
  const [timp, setTimp] = useState(() => ramas(expiresAt));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const t = setInterval(() => setTimp(ramas(expiresAt)), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 bg-[#B45309] px-4 py-2 text-white">
      <div className="flex items-center gap-2 text-sm">
        <Eye className="h-4 w-4 shrink-0" />
        <span>
          Mod impersonare — ești conectat ca{" "}
          <strong>{targetName ?? targetEmail}</strong>{" "}
          <span className="opacity-80">({targetEmail})</span>. Orice acțiune se face în numele
          acestui cont și este înregistrată pe contul de admin {adminEmail}.
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono text-xs tabular-nums opacity-90">expiră în {timp}</span>
        <button
          onClick={() => startTransition(() => { void stopImpersonation(); })}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/25 disabled:opacity-60"
        >
          <LogOut className="h-3.5 w-3.5" />
          {isPending ? "Se iese..." : "Ieși din cont"}
        </button>
      </div>
    </div>
  );
}
