"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MoreHorizontal, Settings, Copy, Power, Trash2, MapPin, Clock, Layers,
  CheckCircle2, XCircle, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DeleteStatieDialog } from "./delete-statie-dialog";
import { toggleStatieActivaAction } from "@/lib/actions/statii";
import { toast } from "sonner";
import type { StatieExtinsa } from "@/types/database.types";

interface StatieCardProps {
  statie: StatieExtinsa;
}

export function StatieCard({ statie }: StatieCardProps) {
  const router = useRouter();
  const [activa, setActiva] = useState(statie.activa);
  const [showDelete, setShowDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleActiva() {
    startTransition(async () => {
      const result = await toggleStatieActivaAction(statie.id, !activa);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setActiva(!activa);
        toast.success(activa ? "Stație dezactivată" : "Stație activată");
      }
    });
  }

  function copyLink() {
    const link = `${window.location.origin}/booking/${statie.slug}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiat!");
  }

  const initiale = statie.nume
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        className={[
          "rounded-xl border bg-white overflow-hidden transition-shadow hover:shadow-md",
          activa ? "border-[#E5E7EB]" : "border-[#E5E7EB] opacity-70",
        ].join(" ")}
      >
        {/* Accent bar */}
        {activa && (
          <div className="h-0.5 bg-gradient-to-r from-[#1877F2] to-[#60A5FA]" />
        )}

        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <Avatar className="h-14 w-14 rounded-xl shrink-0 border border-[#E5E7EB]">
              {statie.logo_url && (
                <AvatarImage src={statie.logo_url} alt={statie.nume} className="object-cover" />
              )}
              <AvatarFallback className="rounded-xl bg-[#EFF6FF] text-[#1877F2] font-bold text-sm">
                {initiale}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <h3 className="font-semibold text-base text-[#111318] truncate">{statie.nume}</h3>
                {activa ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A]">
                    <CheckCircle2 className="h-3 w-3" /> Activă
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280]">
                    <XCircle className="h-3 w-3" /> Inactivă
                  </span>
                )}
                {statie.booking_activ && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1877F2]">
                    <Globe className="h-3 w-3" /> Booking activ
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6B7280]">
                {(statie.localitate || statie.judet) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {[statie.localitate, statie.judet].filter(Boolean).join(", ")}
                  </span>
                )}
                {statie.nr_linii && (
                  <span className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    {statie.nr_linii} {statie.nr_linii === 1 ? "linie" : "linii"}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {statie.durata_slot_minute} min/slot
                </span>
              </div>
            </div>

            {/* Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/setari/statii/${statie.id}`)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurează
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyLink}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiază link booking
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleActiva} disabled={isPending}>
                  <Power className="mr-2 h-4 w-4" />
                  {activa ? "Dezactivează" : "Activează"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setShowDelete(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Șterge stația
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Footer row */}
          <div className="mt-4 pt-4 border-t border-[#F3F4F6] flex items-center justify-between">
            <p className="text-xs text-[#9CA3AF] font-mono">/{statie.slug}</p>
            <Link href={`/setari/statii/${statie.id}`}>
              <Button size="sm" className="bg-[#1877F2] hover:bg-[#1565D8] text-white gap-1.5 h-8 text-xs">
                <Settings className="h-3.5 w-3.5" />
                Configurează
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {showDelete && (
        <DeleteStatieDialog
          statieId={statie.id}
          statieNume={statie.nume}
        />
      )}
    </>
  );
}
