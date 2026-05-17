"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import {
  ArrowLeft, Plus, Send, Loader2, HelpCircle, Bug, Lightbulb,
  MoreHorizontal, CheckCircle2, Clock, AlertCircle, XCircle, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  createTichetAction, addMesajAction, getTichetDetailAction,
} from "@/lib/actions/ajutor";
import type { Tichet, TichetMesaj, TichetCategorie } from "@/lib/actions/ajutor";

const CATEGORIE_CONFIG: Record<TichetCategorie, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  ajutor:   { label: "Ajutor tehnic", icon: HelpCircle,  color: "#1877F2", bg: "#EFF6FF" },
  bug:      { label: "Bug report",    icon: Bug,         color: "#DC2626", bg: "#FEF2F2" },
  sugestie: { label: "Sugestie",      icon: Lightbulb,   color: "#7C3AED", bg: "#EDE9FE" },
  altele:   { label: "Altele",        icon: MoreHorizontal, color: "#6B7280", bg: "#F3F4F6" },
};

const STATUS_CONFIG = {
  deschis:  { label: "Deschis",   icon: Clock,         color: "#1877F2", bg: "#EFF6FF" },
  in_lucru: { label: "În lucru",  icon: AlertCircle,   color: "#D97706", bg: "#FEF3C7" },
  rezolvat: { label: "Rezolvat",  icon: CheckCircle2,  color: "#059669", bg: "#D1FAE5" },
  inchis:   { label: "Închis",    icon: XCircle,       color: "#6B7280", bg: "#F3F4F6" },
};

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function CategorieBadge({ categorie }: { categorie: TichetCategorie }) {
  const cfg = CATEGORIE_CONFIG[categorie];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ── New Ticket Form ────────────────────────────────────────────────────────────
function NewTichetForm({ onSuccess, onCancel }: { onSuccess: (id: string) => void; onCancel: () => void }) {
  const [titlu, setTitlu] = useState("");
  const [categorie, setCategorie] = useState<TichetCategorie>("ajutor");
  const [mesaj, setMesaj] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!titlu.trim() || !mesaj.trim()) {
      toast.error("Completează titlul și descrierea");
      return;
    }
    startTransition(async () => {
      const res = await createTichetAction({ titlu, categorie, mesaj });
      if ("error" in res) { toast.error(res.error); return; }
      toast.success("Tichet creat! Îți vom răspunde în curând.");
      onSuccess(res.id);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <button type="button" onClick={onCancel}
          className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111318] transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Înapoi
        </button>
      </div>

      <div>
        <h2 className="text-lg font-bold text-[#111318]">Tichet nou</h2>
        <p className="text-sm text-[#6B7280] mt-0.5">Descrie problema sau sugestia ta</p>
      </div>

      {/* Categorie */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#374151]">Categorie</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.entries(CATEGORIE_CONFIG) as [TichetCategorie, typeof CATEGORIE_CONFIG[TichetCategorie]][]).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const isSelected = categorie === key;
            return (
              <button key={key} type="button"
                onClick={() => setCategorie(key)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all",
                  isSelected
                    ? "border-[#1877F2] bg-[#EFF6FF] text-[#1877F2]"
                    : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB]"
                )}>
                <Icon className="h-5 w-5" style={isSelected ? { color: cfg.color } : {}} />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Titlu */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#374151]">Titlu <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={titlu}
          onChange={(e) => setTitlu(e.target.value)}
          placeholder="ex: Nu pot adăuga un angajat nou"
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-sm outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 text-[#111318]"
        />
      </div>

      {/* Descriere */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#374151]">Descriere <span className="text-red-500">*</span></label>
        <Textarea
          value={mesaj}
          onChange={(e) => setMesaj(e.target.value)}
          placeholder="Descrie cât mai detaliat problema, pașii urmați, și ce rezultat ai primit..."
          rows={5}
        />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1" disabled={isPending}>
          Anulează
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isPending || !titlu.trim() || !mesaj.trim()}
          className="flex-1 bg-[#1877F2] hover:bg-[#1565D8] gap-2"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Trimite tichetul
        </Button>
      </div>
    </div>
  );
}

// ── Ticket Thread ──────────────────────────────────────────────────────────────
function TichetThread({
  tichet,
  mesaje: initialMesaje,
  userName,
  onBack,
}: {
  tichet: Tichet;
  mesaje: TichetMesaj[];
  userName: string;
  onBack: () => void;
}) {
  const [mesaje, setMesaje] = useState(initialMesaje);
  const [reply, setReply] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Realtime subscription — mesaje noi apar instant
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`tichet-user-${tichet.id}`)
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
    if (!reply.trim() || tichet.status === "inchis") return;
    const text = reply.trim();
    setReply("");
    // Optimistic update
    const optimistic: TichetMesaj = {
      id: crypto.randomUUID(),
      tichet_id: tichet.id,
      profile_id: null,
      mesaj: text,
      is_admin: false,
      created_at: new Date().toISOString(),
    };
    setMesaje((prev) => [...prev, optimistic]);

    startTransition(async () => {
      const res = await addMesajAction({ tichetId: tichet.id, mesaj: text });
      if ("error" in res) {
        toast.error(res.error);
        setMesaje((prev) => prev.filter((m) => m.id !== optimistic.id));
        setReply(text);
      }
    });
  }

  const isClosed = tichet.status === "inchis";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111318] transition-colors mb-3">
          <ArrowLeft className="h-4 w-4" />
          Toate tichetele
        </button>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#111318] leading-tight">{tichet.titlu}</h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              #{tichet.id.slice(0, 8)} · {format(parseISO(tichet.created_at), "d MMM yyyy", { locale: ro })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CategorieBadge categorie={tichet.categorie} />
            <StatusBadge status={tichet.status} />
          </div>
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1 pb-2">
        {mesaje.map((m) => (
          <div key={m.id} className={cn("flex gap-2.5", m.is_admin ? "flex-row" : "flex-row-reverse")}>
            {/* Avatar */}
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
              m.is_admin ? "bg-[#1877F2]" : "bg-[#6B7280]"
            )}>
              {m.is_admin ? "S" : userName.slice(0, 1).toUpperCase()}
            </div>
            {/* Bubble */}
            <div className={cn(
              "max-w-[80%] space-y-1",
              m.is_admin ? "items-start" : "items-end flex flex-col"
            )}>
              <div className={cn(
                "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                m.is_admin
                  ? "bg-white border border-[#E5E7EB] text-[#111318] rounded-tl-sm"
                  : "bg-[#1877F2] text-white rounded-tr-sm"
              )}>
                {m.is_admin && (
                  <p className="text-[10px] font-semibold text-[#1877F2] mb-1 flex items-center gap-1">
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
      {isClosed ? (
        <div className="mt-4 rounded-xl bg-[#F3F4F6] px-4 py-3 text-sm text-[#6B7280] text-center">
          Tichetul este închis. Deschide unul nou dacă mai ai nevoie de ajutor.
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Scrie un mesaj..."
            rows={2}
            className="flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend();
            }}
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

// ── Main Client Component ──────────────────────────────────────────────────────
export function AjutorClient({
  ticheteInitiale,
  userName,
}: {
  ticheteInitiale: Tichet[];
  userName: string;
}) {
  const [tichete, setTichete] = useState(ticheteInitiale);
  const [view, setView] = useState<"list" | "new" | "detail">("list");
  const [detail, setDetail] = useState<{ tichet: Tichet; mesaje: TichetMesaj[] } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function openTichet(id: string) {
    setLoadingDetail(true);
    const res = await getTichetDetailAction(id);
    setLoadingDetail(false);
    if (res) { setDetail(res); setView("detail"); }
  }

  function handleTichetCreated(id: string) {
    getTichetDetailAction(id).then((res) => {
      if (res) {
        setTichete((prev) => [res.tichet, ...prev]);
        setDetail(res);
        setView("detail");
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      {view === "list" && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#111318]">Ajutor & Suport</h1>
            <p className="text-sm text-[#9CA3AF] mt-0.5">Trimite un tichet și îți răspundem în cel mai scurt timp</p>
          </div>
          <Button
            onClick={() => setView("new")}
            className="bg-[#1877F2] hover:bg-[#1565D8] gap-1.5"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Tichet nou
          </Button>
        </div>
      )}

      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 min-h-[500px] flex flex-col">
        {/* New ticket form */}
        {view === "new" && (
          <NewTichetForm
            onSuccess={handleTichetCreated}
            onCancel={() => setView("list")}
          />
        )}

        {/* Thread detail */}
        {view === "detail" && detail && (
          <TichetThread
            tichet={detail.tichet}
            mesaje={detail.mesaje}
            userName={userName}
            onBack={() => setView("list")}
          />
        )}

        {/* Loading */}
        {loadingDetail && (
          <div className="flex-1 flex items-center justify-center text-[#9CA3AF]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {/* Ticket list */}
        {view === "list" && !loadingDetail && (
          <>
            {tichete.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-12">
                <div className="h-16 w-16 rounded-2xl bg-[#EFF6FF] flex items-center justify-center">
                  <HelpCircle className="h-8 w-8 text-[#1877F2]" />
                </div>
                <div>
                  <p className="font-semibold text-[#111318]">Niciun tichet încă</p>
                  <p className="text-sm text-[#9CA3AF] mt-1">Ai o întrebare sau o problemă? Deschide primul tichet.</p>
                </div>
                <Button
                  onClick={() => setView("new")}
                  className="bg-[#1877F2] hover:bg-[#1565D8] gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Deschide un tichet
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {tichete.map((t) => {
                  const catCfg = CATEGORIE_CONFIG[t.categorie];
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => openTichet(t.id)}
                      className="w-full text-left flex items-start gap-3 p-4 rounded-xl border border-[#E5E7EB] hover:border-[#BFDBFE] hover:bg-[#FAFAFA] transition-all group"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: catCfg.bg }}>
                        <catCfg.icon className="h-4 w-4" style={{ color: catCfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-[#111318] truncate">{t.titlu}</p>
                          {t.prioritate === "urgenta" && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">URGENT</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <CategorieBadge categorie={t.categorie} />
                          <StatusBadge status={t.status} />
                          <span className="text-[11px] text-[#9CA3AF]">
                            {format(parseISO(t.updated_at), "d MMM yyyy", { locale: ro })}
                          </span>
                        </div>
                      </div>
                      <div className="text-[#9CA3AF] group-hover:text-[#1877F2] transition-colors shrink-0">
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
