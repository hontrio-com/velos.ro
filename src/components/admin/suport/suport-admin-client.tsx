"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import {
  Search, HelpCircle, Bug, Lightbulb, MoreHorizontal,
  CheckCircle2, Clock, AlertCircle, XCircle, Send, Loader2,
  Sparkles, ArrowLeft, AlertTriangle, Wifi,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  adminGetTichetDetailAction,
  adminAddMesajAction,
  adminUpdateTichetAction,
} from "@/lib/actions/ajutor";
import type { Tichet, TichetMesaj, TichetStatus, TichetPrioritate, TichetCategorie } from "@/lib/actions/ajutor";

const CATEGORIE_CONFIG: Record<TichetCategorie, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  ajutor:   { label: "Ajutor tehnic", icon: HelpCircle,     color: "#1877F2", bg: "#EFF6FF" },
  bug:      { label: "Bug report",    icon: Bug,            color: "#DC2626", bg: "#FEF2F2" },
  sugestie: { label: "Sugestie",      icon: Lightbulb,      color: "#7C3AED", bg: "#EDE9FE" },
  altele:   { label: "Altele",        icon: MoreHorizontal, color: "#6B7280", bg: "#F3F4F6" },
};

const STATUS_CONFIG: Record<TichetStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  deschis:  { label: "Deschis",  icon: Clock,        color: "#1877F2", bg: "#EFF6FF" },
  in_lucru: { label: "În lucru", icon: AlertCircle,  color: "#D97706", bg: "#FEF3C7" },
  rezolvat: { label: "Rezolvat", icon: CheckCircle2, color: "#059669", bg: "#D1FAE5" },
  inchis:   { label: "Închis",   icon: XCircle,      color: "#6B7280", bg: "#F3F4F6" },
};

function StatusBadge({ status }: { status: TichetStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      <Icon className="h-3 w-3" />{cfg.label}
    </span>
  );
}

function CategorieBadge({ categorie }: { categorie: TichetCategorie }) {
  const cfg = CATEGORIE_CONFIG[categorie];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      <Icon className="h-3 w-3" />{cfg.label}
    </span>
  );
}

// ── Admin Ticket Detail Panel ──────────────────────────────────────────────────
function TichetDetailPanel({
  tichet: initialTichet,
  mesaje: initialMesaje,
  onBack,
  onStatusChange,
}: {
  tichet: Tichet;
  mesaje: TichetMesaj[];
  onBack: () => void;
  onStatusChange: (id: string, status: TichetStatus, prioritate: TichetPrioritate) => void;
}) {
  const [tichet, setTichet] = useState(initialTichet);
  const [mesaje, setMesaje] = useState(initialMesaje);
  const [reply, setReply] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const userInitial = (tichet.profiles?.full_name ?? tichet.profiles?.email ?? "?").slice(0, 1).toUpperCase();

  // Realtime: mesaje noi în threadul deschis
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`tichet-admin-thread-${tichet.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tichete_mesaje", filter: `tichet_id=eq.${tichet.id}` },
        (payload) => {
          const msg = payload.new as TichetMesaj;
          setMesaje((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tichet.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mesaje]);

  function handleSend() {
    if (!reply.trim()) return;
    const text = reply.trim();
    setReply("");
    const optimistic: TichetMesaj = {
      id: crypto.randomUUID(),
      tichet_id: tichet.id,
      profile_id: null,
      mesaj: text,
      is_admin: true,
      created_at: new Date().toISOString(),
    };
    setMesaje((prev) => [...prev, optimistic]);

    startTransition(async () => {
      const res = await adminAddMesajAction({ tichetId: tichet.id, mesaj: text });
      if ("error" in res) {
        toast.error(res.error);
        setMesaje((prev) => prev.filter((m) => m.id !== optimistic.id));
        setReply(text);
      } else if (tichet.status === "deschis") {
        const updated = { ...tichet, status: "in_lucru" as TichetStatus };
        setTichet(updated);
        onStatusChange(tichet.id, "in_lucru", tichet.prioritate);
      }
    });
  }

  function handleStatus(status: TichetStatus) {
    startTransition(async () => {
      const res = await adminUpdateTichetAction({ tichetId: tichet.id, status });
      if ("error" in res) { toast.error(res.error); return; }
      const updated = { ...tichet, status };
      setTichet(updated);
      onStatusChange(tichet.id, status, tichet.prioritate);
      toast.success("Status actualizat");
    });
  }

  function handlePrioritate(prioritate: TichetPrioritate) {
    startTransition(async () => {
      const res = await adminUpdateTichetAction({ tichetId: tichet.id, prioritate });
      if ("error" in res) { toast.error(res.error); return; }
      const updated = { ...tichet, prioritate };
      setTichet(updated);
      onStatusChange(tichet.id, tichet.status, prioritate);
      toast.success("Prioritate actualizată");
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E5E7EB] shrink-0">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#111318] mb-2 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />Înapoi la listă
        </button>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#111318] leading-tight">{tichet.titlu}</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              {tichet.profiles?.full_name ?? tichet.profiles?.email} ·{" "}
              {format(parseISO(tichet.created_at), "d MMM yyyy, HH:mm", { locale: ro })}
            </p>
          </div>
          {tichet.prioritate === "urgenta" && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 shrink-0">
              <AlertTriangle className="h-3 w-3" />URGENT
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <CategorieBadge categorie={tichet.categorie} />
          <StatusBadge status={tichet.status} />
        </div>
      </div>

      {/* Controls */}
      <div className="px-5 py-3 border-b border-[#E5E7EB] bg-[#F9FAFB] shrink-0">
        <div className="flex flex-wrap gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Status</p>
            <div className="flex gap-1">
              {(["deschis", "in_lucru", "rezolvat", "inchis"] as TichetStatus[]).map((s) => (
                <button key={s} type="button"
                  disabled={isPending || tichet.status === s}
                  onClick={() => handleStatus(s)}
                  className={cn(
                    "text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors",
                    tichet.status === s
                      ? "bg-[#1877F2] text-white border-[#1877F2]"
                      : "bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#1877F2] hover:text-[#1877F2]"
                  )}>
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Prioritate</p>
            <div className="flex gap-1">
              {(["normala", "urgenta"] as TichetPrioritate[]).map((p) => (
                <button key={p} type="button"
                  disabled={isPending || tichet.prioritate === p}
                  onClick={() => handlePrioritate(p)}
                  className={cn(
                    "text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors",
                    tichet.prioritate === p
                      ? p === "urgenta" ? "bg-red-500 text-white border-red-500" : "bg-[#1877F2] text-white border-[#1877F2]"
                      : "bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#1877F2] hover:text-[#1877F2]"
                  )}>
                  {p === "urgenta" ? "Urgentă" : "Normală"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {mesaje.map((m) => (
          <div key={m.id} className={cn("flex gap-2.5", m.is_admin ? "flex-row-reverse" : "flex-row")}>
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
              m.is_admin ? "bg-[#1877F2]" : "bg-[#6B7280]"
            )}>
              {m.is_admin ? "S" : userInitial}
            </div>
            <div className={cn("max-w-[80%] space-y-1", m.is_admin ? "items-end flex flex-col" : "items-start")}>
              <div className={cn(
                "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                m.is_admin
                  ? "bg-[#1877F2] text-white rounded-tr-sm"
                  : "bg-white border border-[#E5E7EB] text-[#111318] rounded-tl-sm"
              )}>
                {m.is_admin && (
                  <p className="text-[10px] font-semibold text-white/70 mb-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />SUPORT VELOS
                  </p>
                )}
                <p className="whitespace-pre-wrap">{m.mesaj}</p>
              </div>
              <p className="text-[10px] text-[#9CA3AF] px-1">
                {format(parseISO(m.created_at), "d MMM, HH:mm", { locale: ro })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply */}
      {tichet.status !== "inchis" && (
        <div className="px-5 py-4 border-t border-[#E5E7EB] shrink-0 flex gap-2">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Scrie răspunsul tău..."
            rows={2}
            className="flex-1 resize-none text-sm"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend(); }}
          />
          <Button
            onClick={handleSend}
            disabled={isPending || !reply.trim()}
            className="bg-[#1877F2] hover:bg-[#1565D8] self-end"
            size="sm"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Main Admin Client ──────────────────────────────────────────────────────────
export function SuportAdminClient({ rows }: { rows: Tichet[] }) {
  const [tichete, setTichete] = useState(rows);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | TichetStatus>("all");
  const [filterCategorie, setFilterCategorie] = useState<"all" | TichetCategorie>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ tichet: Tichet; mesaje: TichetMesaj[] } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [isLive, setIsLive] = useState(false);

  // Ref to track currently open ticket (avoids stale closure in realtime callbacks)
  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // ── Realtime: lista tichete (INSERT + UPDATE) ──────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-tichete-list")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tichete" },
        (payload) => {
          const t = payload.new as Tichet;
          setTichete((prev) => prev.some((x) => x.id === t.id) ? prev : [t, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tichete" },
        (payload) => {
          const t = payload.new as Tichet;
          // Preserve profiles join data (not included in realtime payload)
          setTichete((prev) => prev.map((x) => x.id === t.id ? { ...x, ...t, profiles: x.profiles } : x));
          // Sync open detail panel
          setDetail((prev) =>
            prev && prev.tichet.id === t.id
              ? { ...prev, tichet: { ...prev.tichet, ...t, profiles: prev.tichet.profiles } }
              : prev
          );
        }
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Realtime: mesaje noi → indicator unread pe lista ──────────────────────
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-mesaje-unread")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tichete_mesaje" },
        (payload) => {
          const msg = payload.new as TichetMesaj;
          // Mark unread only if: message is from user (not admin) AND not the currently open ticket
          if (!msg.is_admin && msg.tichet_id !== selectedIdRef.current) {
            setUnreadIds((prev) => new Set([...prev, msg.tichet_id]));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = tichete.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterCategorie !== "all" && t.categorie !== filterCategorie) return false;
    if (search) {
      const q = search.toLowerCase();
      const email = t.profiles?.email?.toLowerCase() ?? "";
      const name = t.profiles?.full_name?.toLowerCase() ?? "";
      const titlu = t.titlu.toLowerCase();
      if (!email.includes(q) && !name.includes(q) && !titlu.includes(q)) return false;
    }
    return true;
  });

  async function openTichet(id: string) {
    setSelectedId(id);
    selectedIdRef.current = id;
    // Clear unread indicator for this ticket
    setUnreadIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    setLoadingDetail(true);
    const res = await adminGetTichetDetailAction(id);
    setLoadingDetail(false);
    if (res) setDetail(res);
  }

  function handleBack() {
    setSelectedId(null);
    selectedIdRef.current = null;
    setDetail(null);
  }

  function handleStatusChange(id: string, status: TichetStatus, prioritate: TichetPrioritate) {
    setTichete((prev) => prev.map((t) => t.id === id ? { ...t, status, prioritate } : t));
    if (detail && detail.tichet.id === id) {
      setDetail((prev) => prev ? { ...prev, tichet: { ...prev.tichet, status, prioritate } } : prev);
    }
  }

  const showDetail = selectedId && (detail || loadingDetail);

  return (
    <div className={cn("bg-white border border-[#E5E7EB] rounded-xl overflow-hidden", showDetail && "grid md:grid-cols-[1fr_420px]")}>
      {/* Left: list */}
      <div className={cn("flex flex-col", showDetail && "border-r border-[#E5E7EB]")}>
        {/* Filters */}
        <div className="p-4 border-b border-[#E5E7EB] space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input
                placeholder="Caută utilizator, titlu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            {/* LIVE indicator */}
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold shrink-0 transition-colors",
              isLive ? "bg-emerald-50 text-emerald-600" : "bg-[#F3F4F6] text-[#9CA3AF]"
            )}>
              <Wifi className="h-3 w-3" />
              {isLive ? "LIVE" : "..."}
            </div>
          </div>
          <div className="flex gap-1 flex-wrap">
            {(["all", "deschis", "in_lucru", "rezolvat", "inchis"] as const).map((s) => (
              <button key={s} type="button"
                onClick={() => setFilterStatus(s)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                  filterStatus === s ? "bg-[#1877F2] text-white" : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
                )}>
                {s === "all" ? "Toate" : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            {(["all", "ajutor", "bug", "sugestie", "altele"] as const).map((c) => (
              <button key={c} type="button"
                onClick={() => setFilterCategorie(c)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                  filterCategorie === c ? "bg-[#1877F2] text-white" : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
                )}>
                {c === "all" ? "Toate" : CATEGORIE_CONFIG[c].label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-2 bg-[#F9FAFB] border-b border-[#E5E7EB]">
          <p className="text-xs text-[#6B7280]">{filtered.length} tichete</p>
        </div>

        {/* Ticket list */}
        <div className="overflow-y-auto divide-y divide-[#F3F4F6]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#9CA3AF]">Niciun tichet găsit</div>
          ) : (
            filtered.map((t) => {
              const catCfg = CATEGORIE_CONFIG[t.categorie];
              const isSelected = t.id === selectedId;
              const hasUnread = unreadIds.has(t.id);
              return (
                <button key={t.id} type="button"
                  onClick={() => openTichet(t.id)}
                  className={cn(
                    "w-full text-left flex items-start gap-3 px-4 py-3.5 transition-colors",
                    isSelected ? "bg-[#EFF6FF]" : "hover:bg-[#FAFAFA]"
                  )}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: catCfg.bg }}>
                    <catCfg.icon className="h-4 w-4" style={{ color: catCfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {t.prioritate === "urgenta" && (
                        <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                      )}
                      <p className="text-sm font-semibold text-[#111318] truncate">{t.titlu}</p>
                    </div>
                    <p className="text-xs text-[#6B7280] truncate">
                      {t.profiles?.full_name ?? t.profiles?.email ?? "Utilizator nou"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <StatusBadge status={t.status} />
                      <span className="text-[10px] text-[#9CA3AF]">
                        {format(parseISO(t.updated_at), "d MMM yyyy", { locale: ro })}
                      </span>
                    </div>
                  </div>
                  {/* Unread indicator */}
                  {hasUnread && (
                    <span className="h-2.5 w-2.5 rounded-full bg-[#1877F2] shrink-0 mt-1.5" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right: detail panel */}
      {showDetail && (
        <div className="flex flex-col min-h-[600px]">
          {loadingDetail ? (
            <div className="flex-1 flex items-center justify-center text-[#9CA3AF]">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : detail ? (
            <TichetDetailPanel
              tichet={detail.tichet}
              mesaje={detail.mesaje}
              onBack={handleBack}
              onStatusChange={handleStatusChange}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
