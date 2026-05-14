"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Search, Shield, ChevronDown, Plus, Check, X, Ban, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateUserPlan, addSmsCredit, setSmsCredit, toggleAdminRole, suspendUser, unsuspendUser } from "@/lib/actions/admin";

const PLAN_COLORS: Record<string, string> = {
  trial: "#6B7280",
  basic: "#059669",
  pro: "#1877F2",
  enterprise: "#7C3AED",
};

const PLANS = ["trial", "basic", "pro", "enterprise"];

interface User {
  id: string;
  email: string;
  full_name: string | null;
  plan: string;
  sms_credit: number;
  trial_expires_at: string;
  is_admin: boolean;
  suspended_at: string | null;
  suspend_reason: string | null;
  created_at: string;
  statiiCount: number;
  smsTrimise: number;
  smsLimita: number;
}

interface EditState {
  userId: string;
  type: "plan" | "credit";
}

export function UtilizatoriClient({ users: initialUsers }: { users: User[] }) {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [editState, setEditState] = useState<EditState | null>(null);
  const [creditInput, setCreditInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  const filtered = initialUsers.filter((u) => {
    const matchSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === "all" || u.plan === planFilter;
    return matchSearch && matchPlan;
  });

  function showMsg(id: string, text: string, ok: boolean) {
    setMessage({ id, text, ok });
    setTimeout(() => setMessage(null), 3000);
  }

  function handlePlanChange(userId: string, plan: string) {
    startTransition(async () => {
      try {
        await updateUserPlan(userId, plan);
        showMsg(userId, `Plan schimbat: ${plan}`, true);
      } catch {
        showMsg(userId, "Eroare la schimbare plan", false);
      }
      setEditState(null);
    });
  }

  function handleAddCredit(userId: string) {
    const amount = parseInt(creditInput, 10);
    if (!amount || amount <= 0) return;
    startTransition(async () => {
      try {
        await addSmsCredit(userId, amount);
        showMsg(userId, `+${amount} credite adăugate`, true);
      } catch {
        showMsg(userId, "Eroare la adăugare credite", false);
      }
      setEditState(null);
      setCreditInput("");
    });
  }

  function handleSetCredit(userId: string) {
    const amount = parseInt(creditInput, 10);
    if (amount === undefined || amount < 0) return;
    startTransition(async () => {
      try {
        await setSmsCredit(userId, amount);
        showMsg(userId, `Credit setat: ${amount} SMS`, true);
      } catch {
        showMsg(userId, "Eroare la setare credit", false);
      }
      setEditState(null);
      setCreditInput("");
    });
  }

  function handleToggleAdmin(userId: string, current: boolean) {
    if (!window.confirm(`${current ? "Elimini" : "Acorzi"} drepturi de admin acestui utilizator?`)) return;
    startTransition(async () => {
      try {
        await toggleAdminRole(userId, !current);
        showMsg(userId, current ? "Admin eliminat" : "Admin acordat", true);
      } catch {
        showMsg(userId, "Eroare", false);
      }
    });
  }

  function handleSuspend(userId: string, isSuspended: boolean) {
    if (isSuspended) {
      if (!window.confirm("Reactivezi acest cont?")) return;
      startTransition(async () => {
        try {
          await unsuspendUser(userId);
          showMsg(userId, "Cont reactivat", true);
        } catch {
          showMsg(userId, "Eroare", false);
        }
      });
    } else {
      const reason = window.prompt("Motivul suspendării (obligatoriu):");
      if (!reason?.trim()) return;
      startTransition(async () => {
        try {
          await suspendUser(userId, reason);
          showMsg(userId, "Cont suspendat", true);
        } catch {
          showMsg(userId, "Eroare", false);
        }
      });
    }
  }

  return (
    <div className="space-y-4">
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
          className="px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2]"
        >
          <option value="all">Toate planurile</option>
          {PLANS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">SMS Credit</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">SMS Luna</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Stații</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Înregistrat</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#9CA3AF] text-sm">
                    Niciun utilizator găsit
                  </td>
                </tr>
              )}
              {filtered.map((user) => {
                const isEditing = editState?.userId === user.id;
                const msg = message?.id === user.id ? message : null;

                return (
                  <tr key={user.id} className="border-b border-[#F9FAFB] hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.is_admin && (
                          <Shield className="h-3.5 w-3.5 text-[#1877F2] shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-[#111318] truncate max-w-[180px]">
                            {user.full_name || user.email}
                          </p>
                          {user.full_name && (
                            <p className="text-xs text-[#9CA3AF] truncate max-w-[180px]">{user.email}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Plan cell */}
                    <td className="px-4 py-3">
                      {isEditing && editState?.type === "plan" ? (
                        <div className="flex items-center gap-1">
                          <select
                            defaultValue={user.plan}
                            onChange={(e) => handlePlanChange(user.id, e.target.value)}
                            disabled={isPending}
                            autoFocus
                            className="text-xs border border-[#E5E7EB] rounded px-2 py-1 focus:outline-none focus:border-[#1877F2]"
                          >
                            {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <button onClick={() => setEditState(null)} className="text-[#9CA3AF] hover:text-[#111318]">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditState({ userId: user.id, type: "plan" })}
                          className="flex items-center gap-1 group"
                          title="Click pentru a schimba planul"
                        >
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                            style={{ background: PLAN_COLORS[user.plan] ?? "#6B7280" }}
                          >
                            {user.plan}
                          </span>
                          <ChevronDown className="h-3 w-3 text-[#9CA3AF] opacity-0 group-hover:opacity-100" />
                        </button>
                      )}
                    </td>

                    {/* Credit cell */}
                    <td className="px-4 py-3">
                      {isEditing && editState?.type === "credit" ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="10"
                            placeholder="Cantitate"
                            value={creditInput}
                            onChange={(e) => setCreditInput(e.target.value)}
                            autoFocus
                            className="w-20 text-xs border border-[#E5E7EB] rounded px-2 py-1 focus:outline-none focus:border-[#1877F2]"
                          />
                          <button
                            onClick={() => handleAddCredit(user.id)}
                            disabled={isPending}
                            title="Adaugă"
                            className="text-[#059669] hover:text-[#047857]"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleSetCredit(user.id)}
                            disabled={isPending}
                            title="Setează exact"
                            className="text-[#1877F2] hover:text-[#1565D8]"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => { setEditState(null); setCreditInput(""); }} className="text-[#9CA3AF] hover:text-[#111318]">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditState({ userId: user.id, type: "credit" })}
                          className="flex items-center gap-1 group text-sm"
                          title="Click pentru a modifica credite"
                        >
                          <span className={cn("font-medium", user.sms_credit > 0 ? "text-[#1877F2]" : "text-[#9CA3AF]")}>
                            {user.sms_credit}
                          </span>
                          <ChevronDown className="h-3 w-3 text-[#9CA3AF] opacity-0 group-hover:opacity-100" />
                        </button>
                      )}
                      {msg && (
                        <p className={cn("text-[10px] mt-0.5", msg.ok ? "text-[#059669]" : "text-red-500")}>
                          {msg.text}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-sm text-[#374151]">
                        {user.smsTrimise}
                        {user.smsLimita > 0 && (
                          <span className="text-[#9CA3AF]"> / {user.smsLimita === 9999 ? "∞" : user.smsLimita}</span>
                        )}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sm text-[#374151]">{user.statiiCount}</td>

                    <td className="px-4 py-3 text-xs text-[#9CA3AF]">
                      {format(new Date(user.created_at), "d MMM yyyy", { locale: ro })}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                          disabled={isPending}
                          className={cn(
                            "flex items-center gap-1 text-[10px] px-2 py-1 rounded-md font-medium transition-colors",
                            user.is_admin
                              ? "bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20"
                              : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
                          )}
                        >
                          <Shield className="h-3 w-3" />
                          {user.is_admin ? "Admin" : "Normal"}
                        </button>
                        <button
                          onClick={() => handleSuspend(user.id, !!user.suspended_at)}
                          disabled={isPending}
                          className={cn(
                            "flex items-center gap-1 text-[10px] px-2 py-1 rounded-md font-medium transition-colors",
                            user.suspended_at
                              ? "bg-green-50 text-[#059669] hover:bg-green-100"
                              : "bg-red-50 text-red-500 hover:bg-red-100"
                          )}
                        >
                          {user.suspended_at
                            ? <><CheckCircle2 className="h-3 w-3" />Reactivează</>
                            : <><Ban className="h-3 w-3" />Suspendă</>}
                        </button>
                      </div>
                      {user.suspended_at && (
                        <p className="text-[10px] text-red-500 mt-0.5">
                          Suspendat {format(new Date(user.suspended_at), "d MMM", { locale: ro })}
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

      <p className="text-xs text-[#9CA3AF]">
        {filtered.length} din {initialUsers.length} utilizatori
      </p>
    </div>
  );
}
