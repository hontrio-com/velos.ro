"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MoreHorizontal, Settings, Copy, Power, Trash2, MapPin, Clock, Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
        className="rounded-xl border border-border bg-card p-5"
      >
        <div className="flex items-start gap-4">
          {/* Logo */}
          <Avatar className="h-12 w-12 rounded-lg shrink-0">
            {statie.logo_url && (
              <AvatarImage src={statie.logo_url} alt={statie.nume} className="object-cover" />
            )}
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold text-sm">
              {initiale}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base truncate">{statie.nume}</h3>
              <Badge className={activa
                ? "bg-[#DCFCE7] text-[#16A34A] hover:bg-[#DCFCE7]"
                : "bg-muted text-muted-foreground hover:bg-muted"
              }>
                {activa ? "Activă" : "Inactivă"}
              </Badge>
              {statie.booking_activ && (
                <Badge className="bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#EFF6FF]">
                  Booking public
                </Badge>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
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

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/setari/statii/${statie.id}`}>
              <Button size="sm" variant="outline">
                <Settings className="mr-1.5 h-3.5 w-3.5" />
                Configurează
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
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
        </div>
      </motion.div>

      {/* Delete dialog controlled from outside */}
      {showDelete && (
        <DeleteStatieDialog
          statieId={statie.id}
          statieNume={statie.nume}
        />
      )}
    </>
  );
}
