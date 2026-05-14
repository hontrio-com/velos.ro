"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Search, CheckCircle2, XCircle, Globe, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleStation, deleteStation } from "@/lib/actions/admin";

interface Statie {
  id: string;
  nume: string;
  slug: string;
  oras: string | null;
  judet: string | null;
  activa: boolean;
  booking_activ: boolean;
  created_at: string;
  owner: { id: string; email: string; full_name: string | null } | null;
}

export function StatiiAdminClient({ statii: initialStatii }: { statii: Statie[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  const filtered = initialStatii.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.nume.toLowerCase().includes(q) ||
      (s.oras ?? "").toLowerCase().includes(q) ||
      (s.owner?.email ?? "").toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ||
      (filter === "active" && s.activa) ||
      (filter === "inactive" && !s.activa);
    return matchSearch && matchFilter;
  });

  function showMsg(id: string, text: string, ok: boolean) {
    setMessage({ id, text, ok });
    setTimeout(() => setMessage(null), 3000);
  }

  function handleToggle(id: string, activa: boolean) {
    startTransition(async () => {
      try {
        await toggleStation(id, !activa);
        showMsg(id, !activa ? "Stație activată" : "Stație dezactivată", true);
      } catch {
        showMsg(id, "Eroare", false);
      }
    });
  }

  function handleDelete(id: string, name: string) {
    if (!window.confirm(`Ștergi stația "${name}"? Această acțiune este ireversibilă și va șterge toate datele asociate.`)) return;
    startTransition(async () => {
      try {
        await deleteStation(id);
      } catch (e) {
        showMsg(id, "Eroare la ștergere", false);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Caută după nume, oraș sau proprietar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2]"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20"
        >
          <option value="all">Toate</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-white border border-[#F3F4F6] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F4F6] bg-[#F9FAFB]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Stație</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Proprietar</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Localitate</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Booking</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Creat</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#9CA3AF]">
                    Nicio stație găsită
                  </td>
                </tr>
              )}
              {filtered.map((statie) => {
                const msg = message?.id === statie.id ? message : null;
                return (
                  <tr key={statie.id} className="border-b border-[#F9FAFB] hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#111318]">{statie.nume}</p>
                      <p className="text-xs text-[#9CA3AF]">/itp/{statie.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-[#374151] truncate max-w-[160px]">
                        {statie.owner?.full_name || statie.owner?.email || "—"}
                      </p>
                      {statie.owner?.full_name && (
                        <p className="text-xs text-[#9CA3AF] truncate max-w-[160px]">{statie.owner.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#374151]">
                      {[statie.oras, statie.judet].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "flex items-center gap-1 text-xs font-medium w-fit",
                        statie.activa ? "text-[#059669]" : "text-[#9CA3AF]"
                      )}>
                        {statie.activa
                          ? <CheckCircle2 className="h-3.5 w-3.5" />
                          : <XCircle className="h-3.5 w-3.5" />}
                        {statie.activa ? "Activă" : "Inactivă"}
                      </span>
                      {msg && (
                        <p className={cn("text-[10px] mt-0.5", msg.ok ? "text-[#059669]" : "text-red-500")}>
                          {msg.text}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {statie.booking_activ
                        ? <Globe className="h-3.5 w-3.5 text-[#1877F2]" />
                        : <span className="text-xs text-[#9CA3AF]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#9CA3AF]">
                      {format(new Date(statie.created_at), "d MMM yyyy", { locale: ro })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggle(statie.id, statie.activa)}
                          disabled={isPending}
                          className={cn(
                            "text-[10px] font-medium px-2 py-1 rounded-md transition-colors",
                            statie.activa
                              ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                              : "bg-green-50 text-[#059669] hover:bg-green-100"
                          )}
                        >
                          {statie.activa ? "Dezactivează" : "Activează"}
                        </button>
                        <button
                          onClick={() => handleDelete(statie.id, statie.nume)}
                          disabled={isPending}
                          title="Șterge stația"
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-[#9CA3AF]">{filtered.length} din {initialStatii.length} stații</p>
    </div>
  );
}
