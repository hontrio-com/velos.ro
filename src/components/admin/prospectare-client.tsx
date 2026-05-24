"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Search, Phone, Mail, MapPin, ChevronRight, X, CheckCircle2,
  Clock, Star, UserCheck, XCircle, Monitor, Wrench, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateCrmStatus } from "@/lib/actions/prospectare";
import type { StatusCrm, CanalContact } from "@/lib/actions/prospectare";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

// ─── Config ───────────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<
  StatusCrm,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  necontactat:      { label: "Necontactat",        color: "#9CA3AF", bg: "#F3F4F6", icon: Clock },
  contactat:        { label: "Contactat",           color: "#1877F2", bg: "#EFF6FF", icon: CheckCircle2 },
  interesat:        { label: "Interesat",           color: "#D97706", bg: "#FFFBEB", icon: Star },
  client:           { label: "Client",              color: "#059669", bg: "#ECFDF5", icon: UserCheck },
  refuzat:          { label: "Refuzat",             color: "#DC2626", bg: "#FEF2F2", icon: XCircle },
  foloseste_alt_soft: { label: "Alt soft",          color: "#7C3AED", bg: "#F5F3FF", icon: Monitor },
  are_soft_custom:  { label: "Soft custom",         color: "#0891B2", bg: "#ECFEFF", icon: Wrench },
};

const CANAL_CONFIG: Record<CanalContact, string> = {
  telefon:  "Telefon",
  email:    "Email",
  whatsapp: "WhatsApp",
  vizita:   "Vizită",
};

const STATUS_ORDER: StatusCrm[] = [
  "necontactat", "contactat", "interesat", "client",
  "refuzat", "foloseste_alt_soft", "are_soft_custom",
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StatieRar {
  id: string;
  cod_statie: string;
  denumire: string;
  localitate: string | null;
  judet: string | null;
  adresa: string | null;
  telefon: string | null;
  email: string | null;
  persoana_contact: string | null;
  clase_autorizare: string | null;
  nr_linii: number | null;
  data_valabilitate_sfarsit: string | null;
  status_autorizare: string | null;
  crm: {
    status: StatusCrm;
    canal_contact: CanalContact | null;
    note: string | null;
    data_contact: string | null;
    updated_at: string | null;
  } | null;
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

function CrmDrawer({
  statie,
  onClose,
  onSaved,
}: {
  statie: StatieRar;
  onClose: () => void;
  onSaved: (id: string, status: StatusCrm, canal: CanalContact | null, note: string | null) => void;
}) {
  const crm = statie.crm;
  const [status, setStatus] = useState<StatusCrm>(crm?.status ?? "necontactat");
  const [canal, setCanal] = useState<CanalContact | "">(crm?.canal_contact ?? "");
  const [note, setNote] = useState(crm?.note ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    startTransition(async () => {
      await updateCrmStatus({
        statieRarId: statie.id,
        status,
        canal: canal || null,
        note: note.trim() || null,
      });
      onSaved(statie.id, status, canal || null, note.trim() || null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#F3F4F6]">
          <div className="min-w-0 flex-1 pr-4">
            <p className="text-xs font-mono text-[#9CA3AF]">{statie.cod_statie}</p>
            <h2 className="text-base font-bold text-[#111318] leading-snug mt-0.5 line-clamp-2">
              {statie.denumire}
            </h2>
            {(statie.localitate || statie.judet) && (
              <p className="text-xs text-[#6B7280] mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {[statie.localitate, statie.judet].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contact info */}
        <div className="px-5 py-3 border-b border-[#F3F4F6] space-y-1.5">
          {statie.telefon && (
            <a
              href={`tel:${statie.telefon}`}
              className="flex items-center gap-2 text-sm text-[#1877F2] hover:underline"
            >
              <Phone className="h-3.5 w-3.5 shrink-0" />
              {statie.telefon}
            </a>
          )}
          {statie.email && (
            <a
              href={`mailto:${statie.email}`}
              className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111318]"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {statie.email}
            </a>
          )}
          {statie.clase_autorizare && (
            <p className="text-xs text-[#9CA3AF]">
              Clase: {statie.clase_autorizare} • {statie.nr_linii ?? "?"} {statie.nr_linii === 1 ? "linie" : "linii"}
            </p>
          )}
          {statie.data_valabilitate_sfarsit && (
            <p className="text-xs text-[#9CA3AF]">
              Autorizație valabilă până: <span className="font-medium text-[#374151]">{statie.data_valabilitate_sfarsit}</span>
            </p>
          )}
        </div>

        {/* CRM Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-2">
              Status contact
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_ORDER.map((s) => {
                const c = STATUS_CONFIG[s];
                const Ic = c.icon;
                const active = status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all text-left",
                      active
                        ? "border-transparent text-white"
                        : "border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB] hover:text-[#374151]"
                    )}
                    style={active ? { background: c.color, borderColor: c.color } : {}}
                  >
                    <Ic className="h-3.5 w-3.5 shrink-0" />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Canal */}
          {status !== "necontactat" && (
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-2">
                Canal contact
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CANAL_CONFIG) as CanalContact[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCanal(canal === c ? "" : c)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      canal === c
                        ? "bg-[#111318] text-white border-[#111318]"
                        : "border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]"
                    )}
                  >
                    {CANAL_CONFIG[c]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-2">
              Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Adaugă observații despre această stație..."
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2] resize-none"
            />
          </div>

          {/* Last contact */}
          {crm?.data_contact && (
            <p className="text-xs text-[#9CA3AF]">
              Ultimul contact:{" "}
              <span className="text-[#6B7280]">
                {format(new Date(crm.data_contact), "d MMMM yyyy", { locale: ro })}
              </span>
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#F3F4F6]">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#1565D8] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {saved ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Salvat!
              </>
            ) : isPending ? (
              "Se salvează..."
            ) : (
              "Salvează"
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProspectareClient({
  statii: initialStatii,
  stats: initialStats,
  judete,
}: {
  statii: StatieRar[];
  stats: Record<StatusCrm, number>;
  judete: string[];
}) {
  const [statii, setStatii] = useState(initialStatii);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusCrm | "toate">("toate");
  const [filterJudet, setFilterJudet] = useState("toate");
  const [selected, setSelected] = useState<StatieRar | null>(null);
  const [stats, setStats] = useState(initialStats);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return statii.filter((s) => {
      const matchSearch =
        !q ||
        s.denumire.toLowerCase().includes(q) ||
        (s.localitate ?? "").toLowerCase().includes(q) ||
        (s.cod_statie ?? "").toLowerCase().includes(q) ||
        (s.telefon ?? "").includes(q);
      const matchStatus =
        filterStatus === "toate" ||
        (s.crm?.status ?? "necontactat") === filterStatus;
      const matchJudet =
        filterJudet === "toate" || s.judet === filterJudet;
      return matchSearch && matchStatus && matchJudet;
    });
  }, [statii, search, filterStatus, filterJudet]);

  function handleSaved(
    id: string,
    status: StatusCrm,
    canal: CanalContact | null,
    note: string | null
  ) {
    setStatii((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const oldStatus = s.crm?.status ?? "necontactat";
        // update stats
        setStats((st) => ({
          ...st,
          [oldStatus]: Math.max(0, (st[oldStatus] ?? 0) - 1),
          [status]: (st[status] ?? 0) + 1,
        }));
        return {
          ...s,
          crm: {
            status,
            canal_contact: canal,
            note,
            data_contact: status !== "necontactat" ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
        };
      })
    );
  }

  const totalContactate =
    (stats.contactat ?? 0) +
    (stats.interesat ?? 0) +
    (stats.client ?? 0) +
    (stats.refuzat ?? 0) +
    (stats.foloseste_alt_soft ?? 0) +
    (stats.are_soft_custom ?? 0);

  const totalStatii = statii.length;
  const pctContactate =
    totalStatii > 0 ? Math.round((totalContactate / totalStatii) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {STATUS_ORDER.map((s) => {
          const c = STATUS_CONFIG[s];
          const Ic = c.icon;
          const count = stats[s] ?? 0;
          const active = filterStatus === s;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(active ? "toate" : s)}
              className={cn(
                "rounded-xl p-3 text-left border transition-all",
                active
                  ? "border-transparent shadow-sm"
                  : "border-[#F3F4F6] bg-white hover:shadow-sm"
              )}
              style={active ? { background: c.bg, borderColor: c.color } : {}}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Ic className="h-3.5 w-3.5" style={{ color: c.color }} />
                <span className="text-[10px] font-semibold" style={{ color: c.color }}>
                  {c.label}
                </span>
              </div>
              <p className="text-xl font-bold text-[#111318]">{count.toLocaleString("ro-RO")}</p>
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#374151]">
            Progres prospectare
          </span>
          <span className="text-xs text-[#6B7280]">
            {totalContactate.toLocaleString("ro-RO")} / {totalStatii.toLocaleString("ro-RO")} contactate ({pctContactate}%)
          </span>
        </div>
        <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1877F2] rounded-full transition-all"
            style={{ width: `${pctContactate}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Caută după denumire, localitate, cod sau telefon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2]"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterJudet}
            onChange={(e) => setFilterJudet(e.target.value)}
            className="px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 min-w-[140px]"
          >
            <option value="toate">Toate județele</option>
            {judete.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
          {(filterStatus !== "toate" || filterJudet !== "toate" || search) && (
            <button
              onClick={() => { setFilterStatus("toate"); setFilterJudet("toate"); setSearch(""); }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-[#6B7280] border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
            >
              <Filter className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F4F6] bg-[#F9FAFB]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Stație</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Localitate</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Telefon</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Clase</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Status CRM</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Note</th>
                <th className="w-8 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#9CA3AF]">
                    Nicio stație găsită
                  </td>
                </tr>
              )}
              {filtered.map((statie) => {
                const crmStatus = statie.crm?.status ?? "necontactat";
                const cfg = STATUS_CONFIG[crmStatus];
                const StatusIcon = cfg.icon;
                return (
                  <tr
                    key={statie.id}
                    className="border-b border-[#F9FAFB] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                    onClick={() => setSelected(statie)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#111318] leading-snug line-clamp-1">
                        {statie.denumire}
                      </p>
                      <p className="text-[10px] font-mono text-[#9CA3AF]">{statie.cod_statie}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#374151]">
                      {[statie.localitate, statie.judet].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {statie.telefon ? (
                        <a
                          href={`tel:${statie.telefon}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-[#1877F2] hover:underline flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3 shrink-0" />
                          {statie.telefon}
                        </a>
                      ) : (
                        <span className="text-xs text-[#9CA3AF]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6B7280]">
                      {statie.nr_linii ? `${statie.nr_linii} ${statie.nr_linii === 1 ? "linie" : "linii"}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full"
                        style={{ color: cfg.color, background: cfg.bg }}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <p className="text-xs text-[#6B7280] truncate">
                        {statie.crm?.note || "—"}
                      </p>
                    </td>
                    <td className="px-2 py-3">
                      <ChevronRight className="h-4 w-4 text-[#9CA3AF]" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-[#F9FAFB]">
          <p className="text-xs text-[#9CA3AF]">
            {filtered.length.toLocaleString("ro-RO")} din {totalStatii.toLocaleString("ro-RO")} stații
          </p>
        </div>
      </div>

      {/* Drawer */}
      {selected && (
        <CrmDrawer
          statie={selected}
          onClose={() => setSelected(null)}
          onSaved={(id, status, canal, note) => {
            handleSaved(id, status, canal, note);
            setSelected((prev) =>
              prev?.id === id
                ? {
                    ...prev,
                    crm: {
                      status,
                      canal_contact: canal,
                      note,
                      data_contact:
                        status !== "necontactat" ? new Date().toISOString() : null,
                      updated_at: new Date().toISOString(),
                    },
                  }
                : prev
            );
          }}
        />
      )}
    </div>
  );
}
