"use client";

import { useState } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import { ro } from "date-fns/locale";
import { Bell, MessageSquare, Send, Loader2, Phone, Car, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ReminderStatusBadge } from "./reminder-status-badge";
import { TrimiteSmsDialog } from "./trimite-sms-dialog";
import { TrimiteBulkDialog, type BulkReminder } from "./trimite-bulk-dialog";
import { anuleazaReminderAction } from "@/lib/actions/remindere";
import { TIP_CONFIG } from "@/lib/remindere-generator";
import type { TipReminder } from "@/lib/remindere-generator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface PendingReminder {
  id: string;
  tip: TipReminder;
  status: string;
  mesaj: string | null;
  programat_la: string | null;
  client: { id: string; nume: string; telefon: string | null; sms_optin: boolean } | null;
  vehicul: { nr_inmatriculare: string; expirare_itp: string | null; marca: string | null; model: string | null } | null;
}

interface TabPendingProps {
  remindere: PendingReminder[];
  isLoading: boolean;
  onUpdate: () => void;
}

export function TabPending({ remindere, isLoading, onUpdate }: TabPendingProps) {
  const [smsDialog, setSmsDialog] = useState<{ id: string; telefon: string; numeClient: string; mesaj: string } | null>(null);
  const [bulkDialog, setBulkDialog] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const trimisibile = remindere.filter(
    (r) => r.client?.sms_optin && r.client?.telefon
  );

  const bulkPayload: BulkReminder[] = trimisibile.map((r) => ({
    id: r.id,
    telefon: r.client!.telefon!,
    numeClient: r.client!.nume,
    nrInmatriculare: r.vehicul?.nr_inmatriculare ?? "",
    tip: r.tip,
    mesaj: r.mesaj ?? "",
  }));

  async function handleCancel(id: string) {
    setCancelling(id);
    const result = await anuleazaReminderAction(id);
    setCancelling(null);
    if (result.success) {
      toast.success("Reminder anulat");
      onUpdate();
    } else {
      toast.error(result.error ?? "Eroare");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (remindere.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="Niciun reminder în așteptare"
        description="Toate reminderele au fost trimise sau nu există vehicule cu ITP care expiră curând."
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Bulk banner */}
      {trimisibile.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]"
        >
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-[#1877F2]" />
            <p className="text-sm font-medium text-[#1877F2]">
              {trimisibile.length} remindere gata de trimis
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setBulkDialog(true)}
            className="gap-1.5 bg-[#1877F2] hover:bg-[#1565D8] text-white text-xs"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Trimite toate
          </Button>
        </motion.div>
      )}

      {/* List */}
      <AnimatePresence initial={false}>
        {remindere.map((r, i) => {
          const tipCfg = TIP_CONFIG[r.tip];
          const numeClient = r.client?.nume ?? "Client necunoscut";
          const canSend = r.client?.sms_optin && r.client?.telefon;

          const programatLa = r.programat_la
            ? parseISO(r.programat_la)
            : null;
          const daysUntil = programatLa
            ? differenceInDays(programatLa, new Date())
            : null;

          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15, delay: i * 0.03 }}
            >
              <div className="flex gap-0 rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
                {/* Urgency bar */}
                <div className={cn("w-1 shrink-0", tipCfg.bgClass.replace("bg-", "bg-").replace("50", "400"))} />

                <div className="flex-1 p-4">
                  <div className="flex items-start gap-3">
                    {/* Type badge */}
                    <div className="shrink-0 min-w-[48px] text-center">
                      <Badge
                        className={cn(
                          "border-0 text-xs font-bold mb-1",
                          tipCfg.bgClass,
                          tipCfg.colorClass
                        )}
                      >
                        {tipCfg.labelShort}
                      </Badge>
                      {programatLa && (
                        <p className="text-[10px] text-[#6B7280] leading-tight">
                          {format(programatLa, "d MMM", { locale: ro })}
                        </p>
                      )}
                      {daysUntil !== null && (
                        <p
                          className={cn(
                            "text-[10px] font-medium leading-tight",
                            daysUntil < 0
                              ? "text-red-600"
                              : daysUntil === 0
                              ? "text-amber-600"
                              : "text-[#6B7280]"
                          )}
                        >
                          {daysUntil === 0
                            ? "Azi"
                            : daysUntil > 0
                            ? `Pst. ${daysUntil}z`
                            : `Dep. ${Math.abs(daysUntil)}z`}
                        </p>
                      )}
                    </div>

                    <div className="w-px self-stretch bg-[#F7F8FA]" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-[#111318]">
                          {numeClient}
                        </span>
                        {r.vehicul?.nr_inmatriculare && (
                          <span className="text-xs font-mono font-medium text-[#6B7280]">
                            {r.vehicul.nr_inmatriculare}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#6B7280] flex-wrap">
                        {r.client?.telefon ? (
                          <a
                            href={`tel:${r.client.telefon}`}
                            className="flex items-center gap-1 hover:text-[#1877F2] transition-colors"
                          >
                            <Phone className="h-3 w-3" />
                            {r.client.telefon}
                          </a>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500">
                            <Phone className="h-3 w-3" />
                            Fără telefon
                          </span>
                        )}
                        {r.vehicul?.marca && (
                          <span className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {[r.vehicul.marca, r.vehicul.model].filter(Boolean).join(" ")}
                          </span>
                        )}
                        {r.vehicul?.expirare_itp && (
                          <span>
                            ITP exp.{" "}
                            {format(
                              parseISO(r.vehicul.expirare_itp + "T12:00:00"),
                              "d MMM yyyy",
                              { locale: ro }
                            )}
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5">
                        <ReminderStatusBadge status={r.status} />
                        {!canSend && (
                          <span className="ml-2 text-[10px] text-red-500">
                            {!r.client?.sms_optin ? "SMS dezactivat" : "Fără telefon"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      {canSend && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs gap-1 text-[#1877F2] border-[#BFDBFE] hover:bg-[#EFF6FF]"
                          onClick={() =>
                            setSmsDialog({
                              id: r.id,
                              telefon: r.client!.telefon!,
                              numeClient,
                              mesaj: r.mesaj ?? "",
                            })
                          }
                        >
                          <MessageSquare className="h-3 w-3" />
                          SMS
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-[#9CA3AF] hover:text-red-500"
                        disabled={cancelling === r.id}
                        onClick={() => handleCancel(r.id)}
                      >
                        {cancelling === r.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* SMS Dialog */}
      {smsDialog && (
        <TrimiteSmsDialog
          open={!!smsDialog}
          onOpenChange={(o) => !o && setSmsDialog(null)}
          reminderId={smsDialog.id}
          telefon={smsDialog.telefon}
          numeClient={smsDialog.numeClient}
          mesajInitial={smsDialog.mesaj}
          onSuccess={onUpdate}
        />
      )}

      {/* Bulk Dialog */}
      <TrimiteBulkDialog
        open={bulkDialog}
        onOpenChange={setBulkDialog}
        remindere={bulkPayload}
        onSuccess={onUpdate}
      />
    </div>
  );
}
