"use client";

import { useState, useTransition, useMemo, useRef } from "react";
import {
  Search, Phone, Mail, MapPin, ChevronRight, X, CheckCircle2,
  Clock, Star, UserCheck, XCircle, Monitor, Wrench, Filter,
  ChevronLeft, MessageSquare, Send, AlertTriangle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateCrmStatus, sendProspectareBulkSms } from "@/lib/actions/prospectare";
import type { StatusCrm, CanalContact } from "@/lib/actions/prospectare";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

// ─── Config ───────────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<
  StatusCrm,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  necontactat:        { label: "Necontactat",   color: "#9CA3AF", bg: "#F3F4F6", icon: Clock },
  contactat:          { label: "Contactat",      color: "#1877F2", bg: "#EFF6FF", icon: CheckCircle2 },
  interesat:          { label: "Interesat",      color: "#D97706", bg: "#FFFBEB", icon: Star },
  client:             { label: "Client",         color: "#059669", bg: "#ECFDF5", icon: UserCheck },
  refuzat:            { label: "Refuzat",        color: "#DC2626", bg: "#FEF2F2", icon: XCircle },
  foloseste_alt_soft: { label: "Alt soft",       color: "#7C3AED", bg: "#F5F3FF", icon: Monitor },
  are_soft_custom:    { label: "Soft custom",    color: "#0891B2", bg: "#ECFEFF", icon: Wrench },
};

const CANAL_CONFIG: Record<CanalContact, string> = {
  sms:      "Mesaj SMS",
  whatsapp: "Mesaj WhatsApp",
  apel:     "Apel telefon",
  email:    "Email",
  vizita:   "Vizită",
  telefon:  "Telefon",
};

const STATUS_ORDER: StatusCrm[] = [
  "necontactat", "contactat", "interesat", "client",
  "refuzat", "foloseste_alt_soft", "are_soft_custom",
];

const CANAL_ORDER: CanalContact[] = ["sms", "whatsapp", "apel", "email", "vizita"];

const DEFAULT_SMS = `Buna ziua! ITPBASE.RO va ofera: programari online, reminder-uri SMS automate, gestiune clienti & vehicule, rapoarte detaliate si pagina web proprie. Incercati GRATUIT 30 zile: itpbase.ro`;

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

// ─── SMS Modal ────────────────────────────────────────────────────────────────

function SmsModal({
  selectedIds,
  statii,
  onClose,
  onSent,
}: {
  selectedIds: Set<string>;
  statii: StatieRar[];
  onClose: () => void;
  onSent: (ids: string[]) => void;
}) {
  const [mesaj, setMesaj] = useState(DEFAULT_SMS);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ trimise: number; erori: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const targets = statii.filter((s) => selectedIds.has(s.id) && s.telefon);
  const charCount = mesaj.length;
  const smsCount = charCount <= 160 ? 1 : charCount <= 306 ? 2 : 3;
  const charLeft = smsCount === 1 ? 160 - charCount : smsCount === 2 ? 306 - charCount : 459 - charCount;

  function handleSend() {
    startTransition(async () => {
      const res = await sendProspectareBulkSms(targets.map((s) => s.id), mesaj);
      setResult({ trimise: res.trimise, erori: res.erori });
      onSent(res.results.filter((r) => r.success).map((r) => r.statieRarId));
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#F3F4F6]">
            <div>
              <h2 className="text-base font-bold text-[#111318] flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#1877F2]" />
                Trimite SMS în masă
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {targets.length} stații selectate cu nr. de telefon
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#F3F4F6] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {result ? (
            /* Result screen */
            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4 text-center">
              <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-[#059669]" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#111318]">Trimitere finalizată</p>
                <p className="text-sm text-[#6B7280] mt-1">
                  <span className="text-[#059669] font-semibold">{result.trimise} SMS-uri trimise</span>
                  {result.erori > 0 && (
                    <span className="text-red-500 ml-2 font-semibold">{result.erori} erori</span>
                  )}
                </p>
                <p className="text-xs text-[#9CA3AF] mt-2">
                  Stațiile contactate au fost marcate automat cu statusul „Contactat".
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-[#1877F2] text-white text-sm font-semibold rounded-xl hover:bg-[#1565D8] transition-colors"
              >
                Închide
              </button>
            </div>
          ) : (
            <>
              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Message editor */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#374151]">
                      Mesaj SMS
                    </label>
                    <span className={cn(
                      "text-[10px] font-medium",
                      charLeft < 10 ? "text-red-500" : "text-[#9CA3AF]"
                    )}>
                      {charCount} caractere · {smsCount} SMS{smsCount > 1 ? "-uri" : ""} · {charLeft} rămas{charLeft === 1 ? "" : "e"}
                    </span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={mesaj}
                    onChange={(e) => setMesaj(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2] resize-none"
                  />
                  {/* Progress bar chars */}
                  <div className="mt-1.5 h-1 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        smsCount === 1 ? "bg-[#059669]" : smsCount === 2 ? "bg-[#D97706]" : "bg-red-500"
                      )}
                      style={{ width: `${Math.min(100, (charCount / (smsCount === 1 ? 160 : smsCount === 2 ? 306 : 459)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Warning >1 SMS */}
                {smsCount > 1 && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      Mesajul are {smsCount} SMS-uri — costul per destinatar se dublează.
                    </p>
                  </div>
                )}

                {/* Preview targets */}
                <div>
                  <p className="text-xs font-semibold text-[#374151] mb-2">
                    Destinatari ({targets.length})
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1 border border-[#F3F4F6] rounded-lg p-2">
                    {targets.map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-xs">
                        <span className="text-[#374151] truncate max-w-[60%]">{s.denumire}</span>
                        <span className="text-[#9CA3AF] font-mono">{s.telefon}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-[#F3F4F6] flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 text-sm text-[#6B7280] border border-[#E5E7EB] rounded-xl hover:bg-[#F9FAFB] transition-colors"
                >
                  Anulează
                </button>
                <button
                  onClick={handleSend}
                  disabled={isPending || !mesaj.trim() || targets.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#1565D8] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Se trimite...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Trimite {targets.length} SMS-uri
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── CRM Drawer ───────────────────────────────────────────────────────────────

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

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
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
            <a href={`tel:${statie.telefon}`} className="flex items-center gap-2 text-sm text-[#1877F2] hover:underline">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              {statie.telefon}
            </a>
          )}
          {statie.email && (
            <a href={`mailto:${statie.email}`} className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111318]">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {statie.email}
            </a>
          )}
          {statie.clase_autorizare && (
            <p className="text-xs text-[#9CA3AF]">
              Clase: {statie.clase_autorizare} · {statie.nr_linii ?? "?"} {statie.nr_linii === 1 ? "linie" : "linii"}
            </p>
          )}
          {statie.data_valabilitate_sfarsit && (
            <p className="text-xs text-[#9CA3AF]">
              Autorizație valabilă până:{" "}
              <span className="font-medium text-[#374151]">{statie.data_valabilitate_sfarsit}</span>
            </p>
          )}
        </div>

        {/* CRM Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-2">Status contact</label>
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
                      active ? "border-transparent text-white" : "border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]"
                    )}
                    style={active ? { background: c.color } : {}}
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
              <label className="block text-xs font-semibold text-[#374151] mb-2">Canal contact</label>
              <div className="flex flex-wrap gap-2">
                {CANAL_ORDER.map((c) => (
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
            <label className="block text-xs font-semibold text-[#374151] mb-2">Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Adaugă observații..."
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2] resize-none"
            />
          </div>

          {crm?.data_contact && (
            <p className="text-xs text-[#9CA3AF]">
              Ultimul contact:{" "}
              <span className="text-[#6B7280]">
                {format(new Date(crm.data_contact), "d MMMM yyyy", { locale: ro })}
              </span>
            </p>
          )}
        </div>

        <div className="p-5 border-t border-[#F3F4F6]">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#1565D8] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {saved ? (
              <><CheckCircle2 className="h-4 w-4" />Salvat!</>
            ) : isPending ? "Se salvează..." : "Salvează"}
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
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(100);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSmsModal, setShowSmsModal] = useState(false);

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
        filterStatus === "toate" || (s.crm?.status ?? "necontactat") === filterStatus;
      const matchJudet =
        filterJudet === "toate" || s.judet === filterJudet;
      return matchSearch && matchStatus && matchJudet;
    });
  }, [statii, search, filterStatus, filterJudet]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  function resetPage() { setPage(1); }

  // Selection helpers
  const allPageSelected = paginated.length > 0 && paginated.every((s) => selectedIds.has(s.id));
  const somePageSelected = paginated.some((s) => selectedIds.has(s.id));

  function toggleSelectAll() {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((s) => next.delete(s.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((s) => next.add(s.id));
        return next;
      });
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelectedIds(new Set(filtered.map((s) => s.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleSaved(id: string, status: StatusCrm, canal: CanalContact | null, note: string | null) {
    setStatii((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const oldStatus = s.crm?.status ?? "necontactat";
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

  function handleSmsSent(sentIds: string[]) {
    sentIds.forEach((id) => {
      handleSaved(id, "contactat", "sms", null);
    });
    clearSelection();
  }

  const totalContactate =
    (stats.contactat ?? 0) + (stats.interesat ?? 0) + (stats.client ?? 0) +
    (stats.refuzat ?? 0) + (stats.foloseste_alt_soft ?? 0) + (stats.are_soft_custom ?? 0);
  const totalStatii = statii.length;
  const pctContactate = totalStatii > 0 ? Math.round((totalContactate / totalStatii) * 100) : 0;

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
              onClick={() => { setFilterStatus(active ? "toate" : s); resetPage(); }}
              className={cn(
                "rounded-xl p-3 text-left border transition-all",
                active ? "border-transparent shadow-sm" : "border-[#F3F4F6] bg-white hover:shadow-sm"
              )}
              style={active ? { background: c.bg, borderColor: c.color } : {}}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Ic className="h-3.5 w-3.5" style={{ color: c.color }} />
                <span className="text-[10px] font-semibold" style={{ color: c.color }}>{c.label}</span>
              </div>
              <p className="text-xl font-bold text-[#111318]">{count.toLocaleString("ro-RO")}</p>
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#374151]">Progres prospectare</span>
          <span className="text-xs text-[#6B7280]">
            {totalContactate.toLocaleString("ro-RO")} / {totalStatii.toLocaleString("ro-RO")} contactate ({pctContactate}%)
          </span>
        </div>
        <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
          <div className="h-full bg-[#1877F2] rounded-full transition-all" style={{ width: `${pctContactate}%` }} />
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
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2]"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterJudet}
            onChange={(e) => { setFilterJudet(e.target.value); resetPage(); }}
            className="px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 min-w-[140px]"
          >
            <option value="toate">Toate județele</option>
            {judete.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
          {(filterStatus !== "toate" || filterJudet !== "toate" || search) && (
            <button
              onClick={() => { setFilterStatus("toate"); setFilterJudet("toate"); setSearch(""); resetPage(); }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-[#6B7280] border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
            >
              <Filter className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Selection banner */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-[#1877F2] text-white px-4 py-3 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">
              {selectedIds.size.toLocaleString("ro-RO")} stații selectate
            </span>
            {selectedIds.size < filtered.length && (
              <button
                onClick={selectAllFiltered}
                className="text-xs underline opacity-80 hover:opacity-100"
              >
                Selectează toate {filtered.length.toLocaleString("ro-RO")} din filtre
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSmsModal(true)}
              className="flex items-center gap-1.5 bg-white text-[#1877F2] text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Trimite SMS
            </button>
            <button
              onClick={clearSelection}
              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F4F6] bg-[#F9FAFB]">
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={(el) => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-[#D1D5DB] text-[#1877F2] cursor-pointer"
                  />
                </th>
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
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[#9CA3AF]">
                    Nicio stație găsită
                  </td>
                </tr>
              )}
              {paginated.map((statie) => {
                const crmStatus = statie.crm?.status ?? "necontactat";
                const cfg = STATUS_CONFIG[crmStatus];
                const StatusIcon = cfg.icon;
                const isChecked = selectedIds.has(statie.id);
                return (
                  <tr
                    key={statie.id}
                    className={cn(
                      "border-b border-[#F9FAFB] hover:bg-[#F9FAFB] transition-colors",
                      isChecked && "bg-blue-50/50"
                    )}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOne(statie.id)}
                        className="h-4 w-4 rounded border-[#D1D5DB] text-[#1877F2] cursor-pointer"
                      />
                    </td>
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => setSelected(statie)}
                    >
                      <p className="font-medium text-[#111318] leading-snug line-clamp-1">{statie.denumire}</p>
                      <p className="text-[10px] font-mono text-[#9CA3AF]">{statie.cod_statie}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#374151] cursor-pointer" onClick={() => setSelected(statie)}>
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
                    <td className="px-4 py-3 text-xs text-[#6B7280] cursor-pointer" onClick={() => setSelected(statie)}>
                      {statie.nr_linii ? `${statie.nr_linii} ${statie.nr_linii === 1 ? "linie" : "linii"}` : "—"}
                    </td>
                    <td className="px-4 py-3 cursor-pointer" onClick={() => setSelected(statie)}>
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full"
                        style={{ color: cfg.color, background: cfg.bg }}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[160px] cursor-pointer" onClick={() => setSelected(statie)}>
                      <p className="text-xs text-[#6B7280] truncate">{statie.crm?.note || "—"}</p>
                    </td>
                    <td className="px-2 py-3 cursor-pointer" onClick={() => setSelected(statie)}>
                      <ChevronRight className="h-4 w-4 text-[#9CA3AF]" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="px-4 py-3 border-t border-[#F3F4F6] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-[#6B7280]">
            <span>
              {filtered.length === 0
                ? "0 stații"
                : `${((safePage - 1) * perPage + 1).toLocaleString("ro-RO")}–${Math.min(safePage * perPage, filtered.length).toLocaleString("ro-RO")} din ${filtered.length.toLocaleString("ro-RO")} stații`}
            </span>
            <div className="flex items-center gap-1.5">
              <span>Afișează</span>
              <select
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); resetPage(); }}
                className="px-2 py-1 border border-[#E5E7EB] rounded-md bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20"
              >
                {[25, 50, 100, 250, 500].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span>pe pagină</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              className="px-2 py-1 text-xs rounded-md border border-[#E5E7EB] disabled:opacity-40 hover:bg-[#F3F4F6] transition-colors"
            >«</button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-2 py-1 rounded-md border border-[#E5E7EB] disabled:opacity-40 hover:bg-[#F3F4F6] transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || (p >= safePage - 2 && p <= safePage + 2))
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`e-${i}`} className="px-2 py-1 text-xs text-[#9CA3AF]">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={cn(
                      "min-w-[28px] px-2 py-1 text-xs rounded-md border transition-colors",
                      safePage === p ? "bg-[#1877F2] text-white border-[#1877F2]" : "border-[#E5E7EB] hover:bg-[#F3F4F6]"
                    )}
                  >{p}</button>
                )
              )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-2 py-1 rounded-md border border-[#E5E7EB] disabled:opacity-40 hover:bg-[#F3F4F6] transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              className="px-2 py-1 text-xs rounded-md border border-[#E5E7EB] disabled:opacity-40 hover:bg-[#F3F4F6] transition-colors"
            >»</button>
          </div>
        </div>
      </div>

      {/* CRM Drawer */}
      {selected && (
        <CrmDrawer
          statie={selected}
          onClose={() => setSelected(null)}
          onSaved={(id, status, canal, note) => {
            handleSaved(id, status, canal, note);
            setSelected((prev) =>
              prev?.id === id
                ? { ...prev, crm: { status, canal_contact: canal, note, data_contact: status !== "necontactat" ? new Date().toISOString() : null, updated_at: new Date().toISOString() } }
                : prev
            );
          }}
        />
      )}

      {/* SMS Modal */}
      {showSmsModal && (
        <SmsModal
          selectedIds={selectedIds}
          statii={statii}
          onClose={() => setShowSmsModal(false)}
          onSent={handleSmsSent}
        />
      )}
    </div>
  );
}
