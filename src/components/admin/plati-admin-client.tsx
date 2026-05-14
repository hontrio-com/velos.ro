"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Search, CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  profile_id: string;
  stripe_session_id: string;
  stripe_payment_intent: string | null;
  cantitate: number;
  pret_total: number;
  status: string;
  completed_at: string | null;
  created_at: string;
  profile: { id: string; email: string; full_name: string | null } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  completed: { label: "Finalizat", color: "#059669", icon: CheckCircle2 },
  pending: { label: "În așteptare", color: "#EA580C", icon: Clock },
  failed: { label: "Eșuat", color: "#DC2626", icon: XCircle },
};

export function PlatiAdminClient({ payments }: { payments: Payment[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      (p.profile?.email ?? "").toLowerCase().includes(q) ||
      (p.profile?.full_name ?? "").toLowerCase().includes(q) ||
      p.stripe_session_id.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = filtered
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.pret_total ?? 0), 0);

  const totalSms = filtered
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + (p.cantitate ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#F3F4F6] rounded-xl p-4">
          <p className="text-xs text-[#6B7280]">Venituri (filtru curent)</p>
          <p className="text-xl font-bold text-[#059669] mt-1">€{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-[#F3F4F6] rounded-xl p-4">
          <p className="text-xs text-[#6B7280]">SMS vândute (filtru curent)</p>
          <p className="text-xl font-bold text-[#111318] mt-1">{totalSms.toLocaleString("ro-RO")}</p>
        </div>
        <div className="bg-white border border-[#F3F4F6] rounded-xl p-4">
          <p className="text-xs text-[#6B7280]">Tranzacții (filtru curent)</p>
          <p className="text-xl font-bold text-[#111318] mt-1">{filtered.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Caută după email, nume sau ID tranzacție..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:outline-none"
        >
          <option value="all">Toate statusurile</option>
          <option value="completed">Finalizate</option>
          <option value="pending">În așteptare</option>
          <option value="failed">Eșuate</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F4F6] bg-[#F9FAFB]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Utilizator</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">SMS achiziționate</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Preț</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">ID Stripe</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#9CA3AF]">
                    Nicio plată găsită
                  </td>
                </tr>
              )}
              {filtered.map((p) => {
                const statusConf = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending;
                const Icon = statusConf.icon;
                return (
                  <tr key={p.id} className="border-b border-[#F9FAFB] hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#111318] truncate max-w-[180px]">
                        {p.profile?.full_name || p.profile?.email || "—"}
                      </p>
                      {p.profile?.full_name && (
                        <p className="text-xs text-[#9CA3AF] truncate max-w-[180px]">{p.profile.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-[#111318]">
                        {(p.cantitate ?? 0).toLocaleString("ro-RO")}
                      </span>
                      <span className="text-[#9CA3AF] ml-1 text-xs">SMS</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#059669]">
                      €{Number(p.pret_total ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="flex items-center gap-1 text-xs font-medium w-fit"
                        style={{ color: statusConf.color }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {statusConf.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[#9CA3AF] font-mono truncate max-w-[120px] block">
                        {p.stripe_session_id.replace("cs_", "").substring(0, 16)}...
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#9CA3AF]">
                      {format(new Date(p.created_at), "d MMM yyyy HH:mm", { locale: ro })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-[#9CA3AF]">{filtered.length} din {payments.length} tranzacții</p>
    </div>
  );
}
