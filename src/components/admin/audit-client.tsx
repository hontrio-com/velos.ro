"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: string;
  admin_email: string;
  actiune: string;
  target_type: string | null;
  target_label: string | null;
  detalii: Record<string, unknown> | null;
  created_at: string;
}

const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  change_plan:         { label: "Schimbare plan",      color: "#1877F2" },
  add_sms_credit:      { label: "Adăugare credite SMS", color: "#059669" },
  set_sms_credit:      { label: "Setare credite SMS",   color: "#059669" },
  grant_admin:         { label: "Acordare admin",       color: "#7C3AED" },
  revoke_admin:        { label: "Retragere admin",      color: "#7C3AED" },
  suspend_user:        { label: "Suspendare cont",      color: "#DC2626" },
  unsuspend_user:      { label: "Reactivare cont",      color: "#059669" },
  activate_station:    { label: "Activare stație",      color: "#059669" },
  deactivate_station:  { label: "Dezactivare stație",   color: "#EA580C" },
  delete_station:      { label: "Ștergere stație",      color: "#DC2626" },
  update_setting:      { label: "Modificare setare",    color: "#EA580C" },
  send_broadcast:      { label: "Broadcast trimis",     color: "#1877F2" },
};

const ALL_ACTIONS = Object.keys(ACTION_CONFIG);

export function AuditClient({ logs }: { logs: LogEntry[] }) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch =
      l.admin_email.toLowerCase().includes(q) ||
      (l.target_label ?? "").toLowerCase().includes(q) ||
      ACTION_CONFIG[l.actiune]?.label.toLowerCase().includes(q);
    const matchAction = actionFilter === "all" || l.actiune === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Caută după admin, acțiune sau target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2]"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:outline-none"
        >
          <option value="all">Toate acțiunile</option>
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a}>{ACTION_CONFIG[a].label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F4F6] bg-[#F9FAFB]">
                <th className="w-6 px-3 py-3" />
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Data</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Admin</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Acțiune</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Target</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-[#9CA3AF]">
                    Nicio înregistrare găsită
                  </td>
                </tr>
              )}
              {filtered.map((log) => {
                const conf = ACTION_CONFIG[log.actiune] ?? { label: log.actiune, color: "#6B7280" };
                const isExpanded = expandedId === log.id;
                const hasDetails = log.detalii && Object.keys(log.detalii).length > 0;

                return (
                  <>
                    <tr
                      className={cn(
                        "border-b border-[#F9FAFB] transition-colors",
                        hasDetails ? "cursor-pointer hover:bg-[#F9FAFB]" : ""
                      )}
                      onClick={() => hasDetails && setExpandedId(isExpanded ? null : log.id)}
                    >
                      <td className="px-3 py-3">
                        {hasDetails && (
                          isExpanded
                            ? <ChevronDown className="h-3.5 w-3.5 text-[#9CA3AF]" />
                            : <ChevronRight className="h-3.5 w-3.5 text-[#9CA3AF]" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#9CA3AF] whitespace-nowrap">
                        {format(new Date(log.created_at), "d MMM yyyy HH:mm", { locale: ro })}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#374151] truncate max-w-[140px]">
                        {log.admin_email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${conf.color}15`, color: conf.color }}
                        >
                          {conf.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs text-[#374151] truncate max-w-[160px]">{log.target_label ?? "—"}</p>
                          {log.target_type && (
                            <p className="text-[10px] text-[#9CA3AF]">{log.target_type}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && log.detalii && (
                      <tr key={`${log.id}-details`} className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                        <td />
                        <td colSpan={4} className="px-4 py-3">
                          <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                            {Object.entries(log.detalii).map(([k, v]) => (
                              <div key={k}>
                                <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">{k}</span>
                                <p className="text-xs font-medium text-[#374151]">
                                  {v === null ? "—" : String(v)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-[#9CA3AF]">{filtered.length} din {logs.length} înregistrări</p>
    </div>
  );
}
