"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import { MessageSquare, Send, Loader2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { sendMesajAction } from "@/lib/actions/mesaje";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Mesaj {
  id: string;
  mesaj: string;
  tip: string;
  directie: string;
  status: string;
  created_at: string;
  telefon: string;
}

interface ClientTabMesajeProps {
  clientId: string;
  telefon: string;
  mesaje: Mesaj[];
}

export function ClientTabMesaje({
  clientId,
  telefon,
  mesaje,
}: ClientTabMesajeProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);
    const result = await sendMesajAction({
      client_id: clientId,
      telefon,
      mesaj: text.trim(),
    });
    setSending(false);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Mesaj trimis");
      setText("");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {/* Send box */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl p-4 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
          Trimite SMS manual
        </p>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Mesaj pentru ${telefon}...`}
          rows={3}
          maxLength={500}
          className="border-[#E5E7EB] text-sm resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#9CA3AF]">
            {text.length}/500 caractere
          </span>
          <Button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            size="sm"
            className="bg-[#1877F2] hover:bg-[#1565D8] text-white gap-1.5"
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Trimite
          </Button>
        </div>
      </div>

      {/* Feed */}
      {mesaje.length === 0 ? (
        <div className="bg-white border border-[#F3F4F6] rounded-xl py-14 flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6] mb-3">
            <MessageSquare className="h-5 w-5 text-[#9CA3AF]" />
          </div>
          <p className="text-sm font-medium text-[#374151]">
            Niciun mesaj în istoric
          </p>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Mesajele SMS trimise/primite vor apărea aici
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#F3F4F6] rounded-xl overflow-hidden divide-y divide-[#F9FAFB]">
          {mesaje.map((m) => {
            const isOutbound = m.directie === "outbound";
            return (
              <div key={m.id} className="flex items-start gap-3 px-4 py-3.5">
                <div
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    isOutbound
                      ? "bg-[#EFF6FF] text-[#1877F2]"
                      : "bg-[#F3F4F6] text-[#6B7280]"
                  )}
                >
                  {isOutbound ? (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownLeft className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#111318] leading-relaxed">
                    {m.mesaj}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#9CA3AF]">
                      {format(parseISO(m.created_at), "d MMM yyyy, HH:mm", {
                        locale: ro,
                      })}
                    </span>
                    <span className="text-[#E5E7EB]">·</span>
                    <span
                      className={cn(
                        "text-[11px] font-medium",
                        m.status === "trimis" || m.status === "livrat"
                          ? "text-[#15803D]"
                          : m.status === "eroare"
                          ? "text-red-500"
                          : "text-[#9CA3AF]"
                      )}
                    >
                      {m.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
