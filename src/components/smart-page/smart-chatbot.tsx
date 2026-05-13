"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import type { ChatbotQA } from "@/lib/actions/smart-page";

interface Props {
  qa: ChatbotQA[];
  accent: string;
  statieNume: string;
}

type Message = { from: "bot" | "user"; text: string };

const SALUT = "Bună ziua! Sunt asistentul virtual al stației. Cu ce vă pot ajuta?";

export function SmartChatbot({ qa, accent, statieNume }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ from: "bot", text: SALUT }]);
  const [selected, setSelected] = useState<string | null>(null);

  function handleQuestion(q: ChatbotQA) {
    if (selected === q.id) return;
    setSelected(q.id);
    setMessages((prev) => [
      ...prev,
      { from: "user", text: q.intrebare },
      { from: "bot", text: q.raspuns },
    ]);
  }

  const unanswered = qa.filter((q) => q.id !== selected);

  if (qa.length === 0) return null;

  return (
    <>
      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col"
            style={{ maxHeight: "520px" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5" style={{ backgroundColor: accent }}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{statieNume}</p>
                <p className="text-xs text-white/70">Asistent virtual · Răspunde instant</p>
              </div>
              <button type="button" onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                <X className="h-3.5 w-3.5 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: "280px" }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.from === "user"
                        ? "text-white rounded-br-sm"
                        : "bg-[#F3F4F6] text-[#111318] rounded-bl-sm"
                    }`}
                    style={msg.from === "user" ? { backgroundColor: accent } : undefined}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick questions */}
            {unanswered.length > 0 && (
              <div className="border-t border-[#E5E7EB] p-3 space-y-2">
                <p className="text-[11px] text-[#9CA3AF] font-medium uppercase tracking-wide px-1">
                  Întrebări frecvente
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {unanswered.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleQuestion(q)}
                      className="w-full text-left text-xs rounded-xl border border-[#E5E7EB] px-3 py-2.5 hover:bg-[#F9FAFB] transition-colors flex items-center gap-2 text-[#374151]"
                    >
                      <Send className="h-3 w-3 shrink-0 text-[#9CA3AF]" />
                      {q.intrebare}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-4 sm:right-6 z-50 h-14 w-14 rounded-full shadow-lg flex items-center justify-center"
        style={{ backgroundColor: accent }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="h-5 w-5 text-white" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle className="h-5 w-5 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Pulse ring */}
        {!open && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ backgroundColor: accent }} />
        )}
      </motion.button>
    </>
  );
}
