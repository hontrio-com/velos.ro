"use client";

import { useState } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import { ro } from "date-fns/locale";
import {
  Phone,
  Car,
  MessageSquare,
  CheckCircle2,
  Clock,
  Loader2,
  CalendarClock,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

import type { TipReminder } from "@/lib/remindere-generator";
import { TIP_CONFIG } from "@/lib/remindere-generator";

const urgencyFromTip = (tip: TipReminder): "low" | "medium" | "high" | "critical" => {
  const u = TIP_CONFIG[tip]?.urgency ?? 0;
  if (u >= 4) return "critical";
  if (u === 3) return "high";
  if (u === 2) return "medium";
  return "low";
};

const tipConfig = (tip: TipReminder) => ({
  label: TIP_CONFIG[tip]?.label ?? tip,
  shortLabel: TIP_CONFIG[tip]?.labelShort ?? tip,
  urgency: urgencyFromTip(tip),
});

const urgencyBar: Record<string, string> = {
  low: "bg-blue-400",
  medium: "bg-amber-400",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

const urgencyBadge: Record<string, string> = {
  low: "bg-blue-50 text-blue-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-orange-50 text-orange-700",
  critical: "bg-red-50 text-red-700",
};

export interface ReminderRow {
  id: string;
  tip: TipReminder;
  data_trimitere: string;
  trimis: boolean;
  canal: "sms" | "email";
  mesaj: string | null;
  client: {
    id: string;
    nume: string;
    prenume: string | null;
    telefon: string;
  } | null;
  vehicul: {
    id: string;
    nr_inmatriculare: string;
    expirare_itp: string | null;
    marca: string | null;
    model: string | null;
  } | null;
}

interface ReminderCardProps {
  reminder: ReminderRow;
  onUpdate: () => void;
  index: number;
}

export function ReminderCard({ reminder: r, onUpdate, index }: ReminderCardProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const tip = tipConfig(r.tip);
  const urgency = r.trimis ? "low" : tip.urgency;

  const numeClient = r.client
    ? `${r.client.nume}${r.client.prenume ? " " + r.client.prenume : ""}`
    : "Client necunoscut";

  const dataTrimitere = parseISO(r.data_trimitere + "T12:00:00");
  const daysUntil = differenceInDays(dataTrimitere, new Date());
  const dataLabel =
    daysUntil === 0
      ? "Azi"
      : daysUntil > 0
      ? `In ${daysUntil} zile`
      : `Acum ${Math.abs(daysUntil)} zile`;

  async function marcheazaTrimis() {
    setLoading(true);
    const { error } = await supabase
      .from("remindere")
      .update({ trimis: true })
      .eq("id", r.id);

    if (error) {
      toast.error("Eroare la actualizare");
    } else {
      toast.success("Reminder marcat ca trimis");
      onUpdate();
    }
    setLoading(false);
  }

  async function sterge() {
    setLoading(true);
    const { error } = await supabase.from("remindere").delete().eq("id", r.id);
    if (error) {
      toast.error("Eroare la stergere");
    } else {
      toast.success("Reminder sters");
      onUpdate();
    }
    setLoading(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.025 }}
    >
      <Card
        className={cn(
          "border-border shadow-none overflow-hidden transition-opacity",
          r.trimis && "opacity-60"
        )}
      >
        <div className="flex">
          {/* Urgency indicator */}
          <div
            className={cn(
              "w-1 shrink-0",
              r.trimis ? "bg-muted" : urgencyBar[tip.urgency]
            )}
          />

          <CardContent className="flex-1 p-4">
            <div className="flex items-start gap-3">
              {/* Left: tip badge + date */}
              <div className="shrink-0 text-center min-w-[52px]">
                <Badge
                  className={cn(
                    "border-0 text-xs font-bold mb-1",
                    r.trimis
                      ? "bg-muted text-muted-foreground"
                      : urgencyBadge[tip.urgency]
                  )}
                >
                  {tip.shortLabel}
                </Badge>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {format(dataTrimitere, "d MMM", { locale: ro })}
                </p>
                <p
                  className={cn(
                    "text-[10px] font-medium leading-tight",
                    daysUntil < 0 && !r.trimis
                      ? "text-red-600"
                      : daysUntil === 0 && !r.trimis
                      ? "text-amber-600"
                      : "text-muted-foreground"
                  )}
                >
                  {dataLabel}
                </p>
              </div>

              {/* Separator */}
              <div className="w-px self-stretch bg-border" />

              {/* Center: info */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">
                    {numeClient}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono font-medium">
                    {r.vehicul?.nr_inmatriculare}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  {r.client?.telefon && (
                    <a
                      href={`tel:${r.client.telefon}`}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Phone className="h-3 w-3" />
                      {r.client.telefon}
                    </a>
                  )}
                  {r.vehicul && (r.vehicul.marca || r.vehicul.model) && (
                    <span className="flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      {[r.vehicul.marca, r.vehicul.model]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                  )}
                  {r.vehicul?.expirare_itp && (
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" />
                      ITP:{" "}
                      {format(
                        parseISO(r.vehicul.expirare_itp + "T12:00:00"),
                        "d MMM yyyy",
                        { locale: ro }
                      )}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <Badge
                    className={cn(
                      "border text-xs",
                      r.tip === "expirat"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-muted text-muted-foreground border-border"
                    )}
                  >
                    {tip.label}
                  </Badge>
                  <Badge className="border-0 bg-muted text-muted-foreground text-xs gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {r.canal.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Right: status + actions */}
              <div className="shrink-0 flex flex-col items-end gap-2">
                {r.trimis ? (
                  <Badge className="border-0 bg-emerald-100 text-emerald-700 gap-1 text-xs">
                    <CheckCircle2 className="h-3 w-3" />
                    Trimis
                  </Badge>
                ) : (
                  <Badge className="border-0 bg-amber-100 text-amber-700 gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    In asteptare
                  </Badge>
                )}

                <div className="flex items-center gap-1">
                  {!r.trimis && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading}
                      onClick={marcheazaTrimis}
                      className="h-7 px-2 text-xs gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    >
                      {loading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      Trimis
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={loading}
                    onClick={sterge}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}
