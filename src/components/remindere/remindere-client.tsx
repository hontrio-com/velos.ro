"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { differenceInDays, parseISO } from "date-fns";
import { Sparkles, Loader2, Clock, Bell, ShieldAlert, FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <Tabs defaultValue="pending">
        <TabsList className="bg-[#F7F8FA] border border-[#F3F4F6] h-9 p-0.5">
          {[
            { value: "pending", label: "În așteptare", icon: Clock, count: pendingCount },
            { value: "toate", label: "Toate", icon: Bell, count: allRemindere.length },
            { value: "itp", label: "ITP Urgent", icon: ShieldAlert, count: itpCount },
            { value: "templates", label: "Template-uri", icon: FileText, count: 0 },
          ].map(({ value, label, icon: Icon, count }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="gap-1.5 text-xs h-8 px-3 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#1877F2]"
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              {count > 0 && (
                <span className={
                  value === "pending"
                    ? "inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold"
                    : "text-[10px] text-[#9CA3AF]"
                }>
                  {count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="pt-4">
          <TabsContent value="pending" className="mt-0">
            <TabPending
              remindere={pendingRemindere}
              isLoading={loadingAll}
              onUpdate={invalidateAll}
            />
          </TabsContent>

          <TabsContent value="toate" className="mt-0">
            <TabToate
              remindere={allRemindere}
              isLoading={loadingAll}
              onUpdate={invalidateAll}
            />
          </TabsContent>

          <TabsContent value="itp" className="mt-0">
            <TabItpExpirare
              vehicule={itpVehicule}
              statieId={statieId}
              isLoading={loadingVehicule}
              onUpdate={invalidateAll}
            />
          </TabsContent>

          <TabsContent value="templates" className="mt-0">
            {!loadingTemplates && (
              <TabTemplates
                templates={templates}
                onUpdate={() =>
                  queryClient.invalidateQueries({ queryKey: ["sms-templates", statieId] })
                }
              />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
