"use client";

import { useState, useTransition } from "react";
import { Send, Users, Info, AlertTriangle, CheckCircle2, Zap, Clock } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { sendBroadcast } from "@/lib/actions/admin";

const TIP_OPTIONS = [
  { value: "info",    label: "Info",     icon: Info,          color: "#1877F2", bg: "#EFF6FF" },
  { value: "success", label: "Succes",   icon: CheckCircle2,  color: "#059669", bg: "#ECFDF5" },
  { value: "warning", label: "Avertizare", icon: AlertTriangle, color: "#EA580C", bg: "#FFF7ED" },
  { value: "update",  label: "Update",   icon: Zap,           color: "#7C3AED", bg: "#F5F3FF" },
];

const PLAN_LABELS: Record<string, string> = {
  all: "Toți utilizatorii",
  trial: "Trial",
  basic: "Basic",
  pro: "Pro",
  enterprise: "Enterprise",
};

interface BroadcastClientProps {
  planCounts: Record<string, number>;
  recentBroadcasts: Array<{
    id: string;
    admin_email: string;
    detalii: Record<string, unknown> | null;
    created_at: string;
  }>;
}

export function BroadcastClient({ planCounts, recentBroadcasts }: BroadcastClientProps) {
  const [titlu, setTitlu] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [tip, setTip] = useState("info");
  const [target, setTarget] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ count: number } | null>(null);

  const targetCount = planCounts[target] ?? 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titlu.trim() || !mesaj.trim()) return;
    startTransition(async () => {
      const res = await sendBroadcast({ titlu, mesaj, tip, target });
      setResult(res);
      setTitlu("");
      setMesaj("");
      setTimeout(() => setResult(null), 5000);
    });
  }

  const selectedTip = TIP_OPTIONS.find((t) => t.value === tip) ?? TIP_OPTIONS[0];
  const TipIcon = selectedTip.icon;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
      {/* Form */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-[#111318] mb-5">Mesaj nou</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tip */}
          <div>
            <label className="text-xs font-medium text-[#374151] mb-2 block">Tip notificare</label>
            <div className="grid grid-cols-2 gap-2">
              {TIP_OPTIONS.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTip(t.value)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                      tip === t.value
                        ? "border-current"
                        : "border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]"
                    )}
                    style={tip === t.value ? { borderColor: t.color, background: t.bg, color: t.color } : {}}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target */}
          <div>
            <label className="text-xs font-medium text-[#374151] mb-2 block">Destinatari</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2]"
            >
              {Object.entries(PLAN_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label} ({planCounts[key] ?? 0} utilizatori)
                </option>
              ))}
            </select>
          </div>

          {/* Titlu */}
          <div>
            <label className="text-xs font-medium text-[#374151] mb-2 block">Titlu</label>
            <input
              type="text"
              value={titlu}
              onChange={(e) => setTitlu(e.target.value)}
              placeholder="Titlul notificării..."
              maxLength={80}
              required
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2]"
            />
          </div>

          {/* Mesaj */}
          <div>
            <label className="text-xs font-medium text-[#374151] mb-2 block">Mesaj</label>
            <textarea
              value={mesaj}
              onChange={(e) => setMesaj(e.target.value)}
              placeholder="Conținutul notificării..."
              rows={4}
              maxLength={500}
              required
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2] resize-none"
            />
            <p className="text-[10px] text-[#9CA3AF] text-right mt-1">{mesaj.length}/500</p>
          </div>

          {/* Preview */}
          {titlu && (
            <div className="rounded-lg p-3 border" style={{ background: selectedTip.bg, borderColor: `${selectedTip.color}30` }}>
              <div className="flex items-start gap-2">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${selectedTip.color}20` }}>
                  <TipIcon className="h-3.5 w-3.5" style={{ color: selectedTip.color }} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#111318]">{titlu}</p>
                  {mesaj && <p className="text-[11px] text-[#6B7280] mt-0.5 line-clamp-2">{mesaj}</p>}
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Notificare trimisă la <strong>{result.count}</strong> utilizatori!
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !titlu.trim() || !mesaj.trim()}
            className="w-full flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#1565D8] disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            <Send className="h-4 w-4" />
            {isPending ? "Se trimite..." : `Trimite la ${targetCount} utilizatori`}
          </button>
        </form>
      </div>

      {/* Istoric */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-[#111318] mb-5 flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#6B7280]" />
          Istoricul broadcast-urilor
        </h2>

        {recentBroadcasts.length === 0 && (
          <div className="text-center py-8">
            <Send className="h-8 w-8 text-[#E5E7EB] mx-auto mb-2" />
            <p className="text-sm text-[#9CA3AF]">Niciun broadcast trimis încă</p>
          </div>
        )}

        <div className="space-y-3">
          {recentBroadcasts.map((b) => {
            const d = b.detalii as any;
            const tipConf = TIP_OPTIONS.find((t) => t.value === d?.tip) ?? TIP_OPTIONS[0];
            const BIcon = tipConf.icon;
            return (
              <div key={b.id} className="border border-[#F3F4F6] rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded flex items-center justify-center shrink-0" style={{ background: tipConf.bg }}>
                    <BIcon className="h-3 w-3" style={{ color: tipConf.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#111318] truncate">{b.id ? (d?.titlu ?? "—") : "—"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#9CA3AF]">
                        {PLAN_LABELS[d?.target ?? "all"]} · {d?.destinatari ?? 0} destinatari
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-[#9CA3AF]">{b.admin_email}</span>
                      <span className="text-[10px] text-[#9CA3AF]">
                        {format(new Date(b.created_at), "d MMM HH:mm", { locale: ro })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
