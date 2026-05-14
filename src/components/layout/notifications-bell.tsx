"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Info, AlertTriangle, CheckCircle2, Zap, X, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Notificare {
  id: string;
  titlu: string;
  mesaj: string;
  tip: "info" | "warning" | "success" | "update";
  citita: boolean;
  created_at: string;
}

const TIP_CONFIG = {
  info:    { icon: Info,          color: "#1877F2", bg: "#EFF6FF" },
  warning: { icon: AlertTriangle, color: "#EA580C", bg: "#FFF7ED" },
  success: { icon: CheckCircle2,  color: "#059669", bg: "#ECFDF5" },
  update:  { icon: Zap,           color: "#7C3AED", bg: "#F5F3FF" },
};

export function NotificationsBell() {
  const [notificari, setNotificari] = useState<Notificare[]>([]);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unread = notificari.filter((n) => !n.citita).length;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("notificari")
        .select("*")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (data) setNotificari(data as Notificare[]);
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function markRead(id: string) {
    const supabase = createClient();
    await supabase.from("notificari").update({ citita: true }).eq("id", id);
    setNotificari((prev) => prev.map((n) => (n.id === id ? { ...n, citita: true } : n)));
  }

  async function markAllRead() {
    if (!userId) return;
    const supabase = createClient();
    await supabase.from("notificari").update({ citita: true })
      .eq("profile_id", userId).eq("citita", false);
    setNotificari((prev) => prev.map((n) => ({ ...n, citita: true })));
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#F9FAFB] transition-colors"
      >
        <Bell className="h-4 w-4 text-[#374151]" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-4 min-w-4 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#111318]">Notificări</h3>
              {unread > 0 && (
                <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                  {unread} noi
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  title="Marchează toate ca citite"
                  className="flex items-center gap-1 text-[10px] text-[#1877F2] hover:underline"
                >
                  <CheckCheck className="h-3 w-3" />
                  Toate citite
                </button>
              )}
              <button onClick={() => setOpen(false)} className="ml-2 text-[#9CA3AF] hover:text-[#374151]">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#F9FAFB]">
            {notificari.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Bell className="h-8 w-8 text-[#E5E7EB] mx-auto mb-2" />
                <p className="text-sm text-[#9CA3AF]">Nicio notificare</p>
              </div>
            )}
            {notificari.map((n) => {
              const conf = TIP_CONFIG[n.tip] ?? TIP_CONFIG.info;
              const Icon = conf.icon;
              return (
                <div
                  key={n.id}
                  onClick={() => !n.citita && markRead(n.id)}
                  className={cn(
                    "flex gap-3 px-4 py-3 cursor-pointer transition-colors",
                    n.citita ? "bg-white hover:bg-[#F9FAFB]" : "bg-blue-50/30 hover:bg-blue-50/60"
                  )}
                >
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: conf.bg }}
                  >
                    <Icon className="h-4 w-4" style={{ color: conf.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "text-xs leading-tight",
                        n.citita ? "font-normal text-[#374151]" : "font-semibold text-[#111318]"
                      )}>
                        {n.titlu}
                      </p>
                      {!n.citita && (
                        <span className="shrink-0 h-2 w-2 rounded-full bg-[#1877F2] mt-0.5" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-0.5 line-clamp-2">{n.mesaj}</p>
                    <p className="text-[10px] text-[#9CA3AF] mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ro })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
