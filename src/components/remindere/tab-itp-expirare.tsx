"use client";

import { useState, useMemo } from "react";
import { format, parseISO, differenceInDays, isPast } from "date-fns";
import { ro } from "date-fns/locale";
import { Car, AlertTriangle, MessageSquare, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { TrimiteBulkDialog, type BulkReminder } from "./trimite-bulk-dialog";
import { DEFAULT_TEMPLATES } from "@/lib/remindere-generator";
import { buildTemplateVars, interpolateTemplate } from "@/lib/sms-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ItpVehicul {
  id: string;
  nr_inmatriculare: string;
  expirare_itp: string;
  marca: string | null;
  model: string | null;
  client: { id: string; nume: string; telefon: string | null; sms_optin: boolean } | null;
  statie: { id: string; nume: string; telefon: string | null } | null;
}

function getUrgencyClass(days: number) {
  if (days < 0) return { bar: "bg-red-600", badge: "bg-red-100 text-red-700 border-red-200", label: "Expirat" };
  if (days <= 1) return { bar: "bg-red-500", badge: "bg-red-50 text-red-600 border-red-200", label: `${days}z` };
  if (days <= 7) return { bar: "bg-orange-500", badge: "bg-orange-50 text-orange-700 border-orange-200", label: `${days}z` };
  if (days <= 15) return { bar: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200", label: `${days}z` };
  return { bar: "bg-blue-400", badge: "bg-blue-50 text-blue-700 border-blue-200", label: `${days}z` };
}

interface TabItpExpirareProps {
  vehicule: ItpVehicul[];
  statieId: string;
  isLoading: boolean;
  onUpdate: () => void;
}

export function TabItpExpirare({ vehicule, statieId, isLoading, onUpdate }: TabItpExpirareProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDialog, setBulkDialog] = useState(false);

  const today = new Date();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return vehicule
      .filter((v) => {
        if (!q) return true;
        return (
          v.nr_inmatriculare.toLowerCase().includes(q) ||
          (v.client?.nume ?? "").toLowerCase().includes(q) ||
          (v.client?.telefon ?? "").includes(q)
        );
      })
      .sort((a, b) => {
        const da = differenceInDays(parseISO(a.expirare_itp + "T12:00:00"), today);
        const db = differenceInDays(parseISO(b.expirare_itp + "T12:00:00"), today);
        return da - db;
      });
  }, [vehicule, search]);

  const trimisibile = filtered.filter(
    (v) => v.client?.sms_optin && v.client?.telefon
  );

  const allSelected = trimisibile.length > 0 && trimisibile.every((v) => selected.has(v.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(trimisibile.map((v) => v.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedVehicule = trimisibile.filter((v) => selected.has(v.id));

  const bulkPayload: BulkReminder[] = selectedVehicule.map((v) => {
    const days = differenceInDays(parseISO(v.expirare_itp + "T12:00:00"), today);
    const tip = days < 0 ? "expirat" : days <= 1 ? "1_zi" : days <= 7 ? "7_zile" : days <= 15 ? "15_zile" : "30_zile";
    const statieInfo = v.statie;
    const vars = buildTemplateVars({
      clientNume: v.client?.nume ?? "",
      nrInmatriculare: v.nr_inmatriculare,
      expirareItp: v.expirare_itp,
      statieNume: statieInfo?.nume ?? "",
      statieTelefon: statieInfo?.telefon ?? undefined,
    });
    const mesaj = interpolateTemplate(DEFAULT_TEMPLATES[tip] ?? "", vars);
    return {
      id: v.id,
      telefon: v.client!.telefon!,
      numeClient: v.client!.nume,
      nrInmatriculare: v.nr_inmatriculare,
      tip,
      mesaj,
    };
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (vehicule.length === 0) {
    return (
      <EmptyState
        icon={Car}
        title="Niciun vehicul cu ITP urgent"
        description="Nu există vehicule cu ITP care expiră în curând."
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <Input
            placeholder="Caută vehicul sau client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        {selected.size > 0 && (
          <Button
            size="sm"
            className="gap-1.5 shrink-0 bg-[#1877F2] hover:bg-[#1565D8] text-white"
            onClick={() => setBulkDialog(true)}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            SMS ({selected.size})
          </Button>
        )}
      </div>

      {/* Select all */}
      {trimisibile.length > 1 && (
        <div className="flex items-center gap-2 px-1">
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleAll}
            className="h-3.5 w-3.5"
          />
          <span className="text-xs text-[#6B7280]">
            Selectează toți ({trimisibile.length} cu SMS activ)
          </span>
        </div>
      )}

      {/* List */}
      {filtered.map((v, i) => {
        const days = differenceInDays(parseISO(v.expirare_itp + "T12:00:00"), today);
        const { bar, badge, label } = getUrgencyClass(days);
        const canSend = v.client?.sms_optin && v.client?.telefon;

        return (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: i * 0.025 }}
          >
            <div className="flex rounded-xl border border-[#F3F4F6] bg-white overflow-hidden">
              <div className={cn("w-1 shrink-0", bar)} />
              <div className="flex-1 p-4">
                <div className="flex items-center gap-3">
                  {canSend && (
                    <Checkbox
                      checked={selected.has(v.id)}
                      onCheckedChange={() => toggleOne(v.id)}
                      className="h-3.5 w-3.5 shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-[#111318]">
                        {v.nr_inmatriculare}
                      </span>
                      {v.marca && (
                        <span className="text-xs text-[#6B7280]">
                          {[v.marca, v.model].filter(Boolean).join(" ")}
                        </span>
                      )}
                      <Badge className={cn("border text-[10px] font-bold", badge)}>
                        {label}
                      </Badge>
                    </div>
                    <div className="text-xs text-[#6B7280] mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{v.client?.nume ?? "—"}</span>
                      {v.client?.telefon && (
                        <span className="font-mono">{v.client.telefon}</span>
                      )}
                      <span>
                        ITP:{" "}
                        {format(
                          parseISO(v.expirare_itp + "T12:00:00"),
                          "d MMM yyyy",
                          { locale: ro }
                        )}
                      </span>
                    </div>
                  </div>

                  {days < 0 && (
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}

      <TrimiteBulkDialog
        open={bulkDialog}
        onOpenChange={setBulkDialog}
        remindere={bulkPayload}
        onSuccess={() => {
          setSelected(new Set());
          onUpdate();
        }}
      />
    </div>
  );
}
