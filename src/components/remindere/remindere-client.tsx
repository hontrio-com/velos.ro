"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { differenceInDays, parseISO } from "date-fns";
import { Sparkles, Loader2, Clock, Bell, ShieldAlert, FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { genereazaRemindereAction } from "@/lib/actions/remindere";
import { RemindereStats } from "./remindere-stats";
import { TabPending, type PendingReminder } from "./tab-pending";
import { TabToate, type AllReminder } from "./tab-toate";
import { TabItpExpirare, type ItpVehicul } from "./tab-itp-expirare";
import { TabTemplates } from "./tab-templates";
import type { TipReminder } from "@/lib/remindere-generator";

interface RemindereClientProps {
  statieId: string;
}

export function RemindereClient({ statieId }: RemindereClientProps) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "toate" | "itp" | "templates">("pending");

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["remindere", statieId] });
    queryClient.invalidateQueries({ queryKey: ["remindere-stats", statieId] });
    queryClient.invalidateQueries({ queryKey: ["itp-vehicule", statieId] });
  }, [queryClient, statieId]);

  // All reminders
  const { data: allRemindere = [], isLoading: loadingAll } = useQuery({
    queryKey: ["remindere", statieId],
    queryFn: async () => {
      const { data } = await supabase
        .from("remindere")
        .select(`
          id, tip, status, mesaj, programat_la, trimis_la, eroare,
          client:clienti(id, nume, telefon, sms_optin),
          vehicul:vehicule(nr_inmatriculare, expirare_itp, marca, model)
        `)
        .eq("statie_id", statieId)
        .order("programat_la", { ascending: true });
      return (data ?? []).map((r) => ({
        ...r,
        client: Array.isArray(r.client) ? r.client[0] : r.client,
        vehicul: Array.isArray(r.vehicul) ? r.vehicul[0] : r.vehicul,
      })) as AllReminder[];
    },
  });

  // ITP vehicles
  const { data: itpVehicule = [], isLoading: loadingVehicule } = useQuery({
    queryKey: ["itp-vehicule", statieId],
    queryFn: async () => {
      const today = new Date();
      const thirtyDaysLater = new Date(today);
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

      const { data: statie } = await supabase
        .from("statii")
        .select("id, nume, telefon")
        .eq("id", statieId)
        .single();

      const { data: vehicule } = await supabase
        .from("vehicule")
        .select(`
          id, nr_inmatriculare, expirare_itp, marca, model,
          client:clienti(id, nume, telefon, sms_optin)
        `)
        .eq("statie_id", statieId)
        .not("expirare_itp", "is", null)
        .lte("expirare_itp", thirtyDaysLater.toISOString().split("T")[0]);

      return (vehicule ?? []).map((v) => ({
        ...v,
        expirare_itp: v.expirare_itp!,
        client: Array.isArray(v.client) ? v.client[0] : v.client,
        statie: statie ?? null,
      })) as ItpVehicul[];
    },
  });

  // Templates
  const { data: templates = {} as Record<TipReminder, string | null>, isLoading: loadingTemplates } = useQuery({
    queryKey: ["sms-templates", statieId],
    queryFn: async () => {
      const { data } = await supabase
        .from("sms_templates")
        .select("tip, mesaj")
        .eq("statie_id", statieId);

      const map: Partial<Record<TipReminder, string | null>> = {};
      for (const t of data ?? []) {
        map[t.tip as TipReminder] = t.mesaj;
      }
      return map as Record<TipReminder, string | null>;
    },
  });

  const pendingRemindere = allRemindere.filter((r) => r.status === "pending") as PendingReminder[];
  const pendingCount = pendingRemindere.length;
  const itpCount = itpVehicule.length;

  async function handleGenerate() {
    setGenerating(true);
    const result = await genereazaRemindereAction();
    setGenerating(false);
    if (result.success) {
      toast.success("Remindere generate cu succes!");
      invalidateAll();
    } else {
      toast.error(result.error ?? "Eroare la generare");
    }
  }

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-end">
        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={generating}
          className="gap-1.5 bg-[#1877F2] hover:bg-[#1565D8] text-white"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generează remindere
        </Button>
      </div>

      {/* Stats */}
      <RemindereStats statieId={statieId} />

      {/* Tabs */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Tab bar */}
        <div className="flex overflow-x-auto border-b border-[#E5E7EB]" style={{ scrollbarWidth: "none" }}>
          {([
            { value: "pending",   label: "În așteptare", icon: Clock,       count: pendingCount,          badgeClass: "bg-amber-100 text-amber-700" },
            { value: "toate",     label: "Toate",         icon: Bell,        count: allRemindere.length,   badgeClass: "bg-[#F7F8FA] text-[#6B7280]" },
            { value: "itp",       label: "ITP Urgent",   icon: ShieldAlert, count: itpCount,              badgeClass: "bg-red-100 text-red-600" },
            { value: "templates", label: "Template-uri", icon: FileText,    count: 0,                     badgeClass: "" },
          ] as const).map(({ value, label, icon: Icon, count, badgeClass }) => {
            const isActive = activeTab === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setActiveTab(value)}
                className={[
                  "relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                  "border-b-2 -mb-px focus-visible:outline-none",
                  isActive
                    ? "text-[#1877F2] border-[#1877F2] bg-white"
                    : "text-[#6B7280] border-transparent hover:text-[#111318] hover:bg-[#F9FAFB]",
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
                {count > 0 && (
                  <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold ${badgeClass}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-5">
          {activeTab === "pending" && (
            <TabPending remindere={pendingRemindere} isLoading={loadingAll} onUpdate={invalidateAll} />
          )}
          {activeTab === "toate" && (
            <TabToate remindere={allRemindere} isLoading={loadingAll} onUpdate={invalidateAll} />
          )}
          {activeTab === "itp" && (
            <TabItpExpirare vehicule={itpVehicule} statieId={statieId} isLoading={loadingVehicule} onUpdate={invalidateAll} />
          )}
          {activeTab === "templates" && !loadingTemplates && (
            <TabTemplates
              templates={templates}
              onUpdate={() => queryClient.invalidateQueries({ queryKey: ["sms-templates", statieId] })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
