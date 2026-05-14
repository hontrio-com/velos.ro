"use client";

import { useState, useTransition } from "react";
import { Search, ChevronDown } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { addSmsCredit, setSmsCredit } from "@/lib/actions/admin";

const PLAN_COLORS: Record<string, string> = {
  trial: "#6B7280",
  basic: "#059669",
  pro: "#1877F2",
  enterprise: "#7C3AED",
};

interface UserSms {
  id: string;
  email: string;
  full_name: string | null;
  plan: string;
  sms_credit: number;
  trial_expires_at: string;
  smsTrimise: number;
  smsLimita: number;
}

export function SmsAdminClient({ users }: { users: UserSms[] }) {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [editId, setEditId] = useState<string | null>(null);
  const [creditInput, setCreditInput] = useState("");
  const [addMode, setAddMode] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      u.email.toLowerCase().includes(q) ||
      (u.full_name ?? "").toLowerCase().includes(q);
    const matchPlan = planFilter === "all" || u.plan === planFilter;
    return matchSearch && matchPlan;
  });

  function showMsg(id: string, text: string, ok: boolean) {
    setMessage({ id, text, ok });
    setTimeout(() => setMessage(null), 3000);
  }

  function handleCredit(userId: string) {
    const amount = parseInt(creditInput, 10);
    if (isNaN(amount) || amount < 0) return;
    startTransition(async () => {
      try {
        if (addMode) {
          await addSmsCredit(userId, amount);
          showMsg(userId, `+${amount} credite adăugate`, true);
        } else {
          await setSmsCredit(userId, amount);
          showMsg(userId, `Credit setat: ${amount}`, true);
        }
      } catch {
        showMsg(userId, "Eroare", false);
      }
      setEditId(null);
      setCreditInput("");
    });
  }

  const totalTrimise = filtered.reduce((s, u) => s + u.smsTrimise, 0);
  const totalCredit = filtered.reduce((s, u) => s + u.sms_credit, 0);

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#F3F4F6] rounded-xl p-4">
          <p className="text-xs text-[#6B7280]">SMS trimise (filtru)</p>
          <p className="text-xl font-bold text-[#111318] mt-1">{totalTrimise.toLocaleString("ro-RO")}</p>
        </div>
        <div className="bg-white border border-[#F3F4F6] rounded-xl p-4">
          <p className="text-xs text-[#6B7280]">Credite cumpărate (filtru)</p>
          <p className="text-xl font-bold text-[#1877F2] mt-1">{totalCredit.toLocaleString("ro-RO")}</p>
        </div>
        <div className="bg-white border border-[#F3F4F6] rounded-xl p-4">
          <p className="text-xs text-[#6B7280]">Utilizatori (filtru)</p>
          <p className="text-xl font-bold text-[#111318] mt-1">{filtered.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Caută după email sau nume..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2]"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:outline-none"
        >
          <option value="all">Toate planurile</option>
          {["trial", "basic", "pro", "enterprise"].map((p) => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F4F6] bg-[#F9FAFB]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Utilizator</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Trial / Exp.</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">SMS trimise/lună</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Progres</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Credit cumpărat</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Modifică credit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#9CA3AF]">Niciun utilizator găsit</td>
                </tr>
              )}
              {filtered.map((user) => {
                const pct = user.smsLimita > 0 ? Math.min((user.smsTrimise / user.smsLimita) * 100, 100) : 0;
                const barColor = pct > 90 ? "#DC2626" : pct > 70 ? "#EA580C" : "#1877F2";
                const trialExp = new Date(user.trial_expires_at);
                const trialZile = differenceInDays(trialExp, new Date());
                const trialExpired = trialExp < new Date();
                const msg = message?.id === user.id ? message : null;

                return (
                  <tr key={user.id} className="border-b border-[#F9FAFB] hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#111318] truncate max-w-[160px]">{user.full_name || user.email}</p>
                      {user.full_name && <p className="text-xs text-[#9CA3AF] truncate max-w-[160px]">{user.email}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                        style={{ background: PLAN_COLORS[user.plan] ?? "#6B7280" }}
                      >
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {user.plan === "trial" ? (
                        <span className={cn(
                          "font-medium",
                          trialExpired ? "text-red-500" : trialZile <= 3 ? "text-orange-500" : "text-[#6B7280]"
                        )}>
                          {trialExpired
                            ? "Expirat"
                            : `${trialZile}z rămase`}
                          <br />
                          <span className="text-[#9CA3AF] font-normal">
                            {format(trialExp, "d MMM", { locale: ro })}
                          </span>
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[#374151]">
                      {user.smsTrimise}
                      {user.smsLimita > 0 && (
                        <span className="text-[#9CA3AF] font-normal">
                          {" "}/{user.smsLimita === 9999 ? " ∞" : ` ${user.smsLimita}`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 w-32">
                      <div className="w-full h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: barColor }}
                        />
                      </div>
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5">{Math.round(pct)}%</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "font-semibold text-sm",
                        user.sms_credit > 0 ? "text-[#1877F2]" : "text-[#9CA3AF]"
                      )}>
                        {user.sms_credit}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {editId === user.id ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setAddMode(true)}
                              className={cn("text-[10px] px-1.5 py-0.5 rounded", addMode ? "bg-[#1877F2] text-white" : "bg-[#F3F4F6] text-[#6B7280]")}
                            >+</button>
                            <button
                              onClick={() => setAddMode(false)}
                              className={cn("text-[10px] px-1.5 py-0.5 rounded", !addMode ? "bg-[#1877F2] text-white" : "bg-[#F3F4F6] text-[#6B7280]")}
                            >=</button>
                            <input
                              type="number"
                              min="0"
                              step="10"
                              value={creditInput}
                              onChange={(e) => setCreditInput(e.target.value)}
                              autoFocus
                              className="w-16 text-xs border border-[#E5E7EB] rounded px-1.5 py-0.5 focus:outline-none focus:border-[#1877F2]"
                              placeholder="SMS"
                            />
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleCredit(user.id)}
                              disabled={isPending}
                              className="text-[10px] bg-[#059669] text-white px-2 py-0.5 rounded hover:bg-[#047857]"
                            >
                              Salvează
                            </button>
                            <button
                              onClick={() => { setEditId(null); setCreditInput(""); }}
                              className="text-[10px] bg-[#F3F4F6] text-[#6B7280] px-2 py-0.5 rounded"
                            >
                              Anulează
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditId(user.id)}
                          className="flex items-center gap-1 text-xs text-[#1877F2] hover:underline"
                        >
                          Modifică
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      )}
                      {msg && (
                        <p className={cn("text-[10px] mt-0.5", msg.ok ? "text-[#059669]" : "text-red-500")}>
                          {msg.text}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-[#9CA3AF]">{filtered.length} din {users.length} utilizatori</p>
    </div>
  );
}
