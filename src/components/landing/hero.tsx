import Link from "next/link";
import { ArrowRight } from "lucide-react";

const STATS = [
  { value: "94%", label: "rata de citire SMS" },
  { value: "15 min", label: "pentru configurare" },
  { value: "+40%", label: "clienti care revin" },
];

export default function LandingHero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16 bg-[#F7F8FA]">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='28' height='28' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='14' cy='14' r='1' fill='rgba(0%2C0%2C0%2C0.06)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Blue glow top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] opacity-20 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, #1877F2 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-24 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="animate-fade-in-up inline-flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-full px-4 py-1.5 mb-8 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] shrink-0" />
          <span className="text-xs font-medium text-[#6B7280]">
            Platforma CRM dedicata statiilor ITP din Romania
          </span>
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-in-up text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-[#0A0F1E] leading-[1.1] tracking-tight mb-6"
          style={{ animationDelay: "0.1s" }}
        >
          7 din 10 clienti ITP
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #1877F2 0%, #6366F1 100%)",
            }}
          >
            nu se mai intorc.
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="animate-fade-in-up max-w-2xl text-lg sm:text-xl text-[#6B7280] leading-relaxed mb-10"
          style={{ animationDelay: "0.2s" }}
        >
          Velos trimite automat SMS-uri de reamintire cu{" "}
          <span className="text-[#111318] font-medium">30, 15 si 7 zile</span> inainte de
          expirarea ITP-ului fiecarui client. Ei revin la tine, nu la concurenta.
        </p>

        {/* CTAs */}
        <div
          className="animate-fade-in-up flex flex-col sm:flex-row items-center gap-4 mb-20"
          style={{ animationDelay: "0.3s" }}
        >
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 bg-[#1877F2] hover:bg-[#1565D8] text-white font-semibold text-sm px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-[#1877F2]/25 hover:shadow-[#1877F2]/40"
          >
            Incearca 15 zile gratuit
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="#functii"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#6B7280] hover:text-[#111318] transition-colors py-3.5 px-4"
          >
            Vezi cum functioneaza
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Stats */}
        <div
          className="animate-fade-in-up flex flex-col sm:flex-row items-center gap-8 sm:gap-16"
          style={{ animationDelay: "0.35s" }}
        >
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-bold text-[#0A0F1E]">{s.value}</p>
              <p className="text-sm text-[#9CA3AF] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
