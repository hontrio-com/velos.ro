import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const STATS = [
  { value: "94%", label: "rata de citire SMS" },
  { value: "15 min", label: "pentru configurare" },
  { value: "+40%", label: "clienti care revin" },
];

const MOCK_REMINDERS = [
  { name: "Ion Popescu", plate: "B 123 ABC", days: 6, sent: true },
  { name: "Maria Ionescu", plate: "CJ 45 BDF", days: 14, sent: false },
  { name: "Alexandru Rusu", plate: "IS 78 GHI", days: 22, sent: false },
  { name: "Elena Constantin", plate: "PH 21 JKL", days: 29, sent: false },
];

export default function LandingHero() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 50% -10%, rgba(24,119,242,0.22) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 85% 15%, rgba(99,102,241,0.12) 0%, transparent 50%),
          #060A14
        `,
      }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='28' height='28' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='14' cy='14' r='1' fill='rgba(255%2C255%2C255%2C0.06)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="animate-fade-in-up inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.1] rounded-full px-4 py-1.5 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] shrink-0" />
          <span className="text-xs font-medium text-[#94A3B8]">
            Platforma CRM dedicata statiilor ITP din Romania
          </span>
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-in-up text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-6"
          style={{ animationDelay: "0.1s" }}
        >
          7 din 10 clienti ITP
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #60A5FA 0%, #818CF8 50%, #A78BFA 100%)",
            }}
          >
            nu se mai intorc.
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="animate-fade-in-up max-w-2xl text-lg sm:text-xl text-[#94A3B8] leading-relaxed mb-10"
          style={{ animationDelay: "0.2s" }}
        >
          Velos trimite automat SMS-uri de reamintire cu{" "}
          <span className="text-white font-medium">30, 15 si 7 zile</span> inainte de expirarea
          ITP-ului fiecarui client. Ei revin la tine, nu la concurenta.
        </p>

        {/* CTAs */}
        <div
          className="animate-fade-in-up flex flex-col sm:flex-row items-center gap-4 mb-16"
          style={{ animationDelay: "0.3s" }}
        >
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 bg-[#1877F2] hover:bg-[#1565D8] text-white font-semibold text-sm px-7 py-3.5 rounded-xl transition-all duration-150 shadow-lg shadow-[#1877F2]/25 hover:shadow-[#1877F2]/40"
          >
            Incearca 15 zile gratuit
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="#functii"
            className="inline-flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white transition-colors py-3.5 px-4"
          >
            Vezi cum functioneaza
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Stats */}
        <div
          className="animate-fade-in-up flex flex-col sm:flex-row items-center gap-8 sm:gap-12 mb-20"
          style={{ animationDelay: "0.35s" }}
        >
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-bold text-white">{s.value}</p>
              <p className="text-sm text-[#64748B] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Browser mockup */}
        <div
          className="animate-fade-in-up animate-float w-full max-w-3xl"
          style={{ animationDelay: "0.45s" }}
        >
          <div className="rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl shadow-black/60">
            {/* Browser chrome */}
            <div className="bg-[#0D1520] px-4 py-3 flex items-center gap-2 border-b border-white/[0.06]">
              <span className="h-3 w-3 rounded-full bg-[#FF5F56]" />
              <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
              <span className="h-3 w-3 rounded-full bg-[#27C93F]" />
              <div className="flex-1 mx-4">
                <div className="bg-[#1A2332] rounded-md px-3 py-1.5 text-center">
                  <span className="text-xs text-[#4B5563] font-mono">velos.ro/dashboard/remindere</span>
                </div>
              </div>
            </div>

            {/* App content */}
            <div className="bg-[#0A1628] px-6 py-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-white">Remindere SMS</h3>
                  <span className="text-xs font-semibold bg-[#1877F2]/20 text-[#60A5FA] px-2.5 py-0.5 rounded-full">
                    4 de trimis azi
                  </span>
                </div>
                <button className="text-xs font-medium text-[#1877F2] bg-[#1877F2]/10 hover:bg-[#1877F2]/20 px-3 py-1.5 rounded-lg transition-colors">
                  Trimite tot
                </button>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-12 gap-3 pb-2 mb-1 border-b border-white/[0.05]">
                <span className="col-span-4 text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Client</span>
                <span className="col-span-3 text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Vehicul</span>
                <span className="col-span-3 text-[10px] font-semibold text-[#475569] uppercase tracking-wider">ITP expira</span>
                <span className="col-span-2 text-[10px] font-semibold text-[#475569] uppercase tracking-wider text-right">Status</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-white/[0.04]">
                {MOCK_REMINDERS.map((r, i) => (
                  <div key={i} className="grid grid-cols-12 gap-3 py-3 items-center">
                    <div className="col-span-4 flex items-center gap-2.5">
                      <div
                        className="h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                        style={{
                          background: ["#1877F2","#7C3AED","#059669","#EA580C"][i],
                        }}
                      >
                        {r.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="text-xs font-medium text-[#CBD5E1] truncate">{r.name}</span>
                    </div>
                    <span className="col-span-3 text-xs font-mono text-[#64748B]">{r.plate}</span>
                    <div className="col-span-3 flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          r.days <= 7 ? "bg-red-400" : r.days <= 15 ? "bg-orange-400" : "bg-yellow-400"
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          r.days <= 7 ? "text-red-400" : r.days <= 15 ? "text-orange-400" : "text-[#94A3B8]"
                        }`}
                      >
                        {r.days} zile
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-end">
                      {r.sent ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" />
                          Trimis
                        </span>
                      ) : (
                        <button className="text-[10px] font-semibold text-[#1877F2] bg-[#1877F2]/10 hover:bg-[#1877F2]/20 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap">
                          Trimite
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer action */}
              <div className="mt-4 pt-4 border-t border-white/[0.05]">
                <button className="w-full text-xs font-semibold text-white bg-[#1877F2] hover:bg-[#1565D8] py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                  Trimite 3 SMS-uri acum
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
