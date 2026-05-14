import Link from "next/link";
import { ArrowRight } from "lucide-react";

const STATS = [
  { value: "94%", label: "rata de citire SMS" },
  { value: "15 min", label: "pentru configurare" },
  { value: "+40%", label: "clienti care revin" },
];

export default function LandingHero() {
  return (
    <section className="bg-white min-h-[90vh] flex flex-col items-center justify-center py-24">
      <div className="w-full max-w-4xl mx-auto px-6 flex flex-col items-center text-center">

        {/* Badge */}
        <div className="animate-fade-in-up inline-flex items-center gap-2 bg-[#EFF6FF] border border-[#BFDBFE] rounded-full px-4 py-1.5 mb-10">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1877F2] shrink-0" />
          <span className="text-xs font-semibold text-[#1877F2] tracking-wide">
            Platforma CRM pentru statii ITP
          </span>
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-in-up text-4xl sm:text-5xl lg:text-6xl xl:text-[72px] font-bold text-[#0A0F1E] leading-[1.1] tracking-tight mb-6"
          style={{ animationDelay: "0.1s" }}
        >
          7 din 10 clienti ITP
          <br />
          <span className="text-[#1877F2]">nu se mai intorc.</span>
        </h1>

        {/* Subheadline */}
        <p
          className="animate-fade-in-up max-w-xl text-lg sm:text-xl text-[#6B7280] leading-relaxed mb-10"
          style={{ animationDelay: "0.15s" }}
        >
          Velos trimite automat SMS-uri de reamintire cu{" "}
          <span className="text-[#374151] font-semibold">30, 15 si 7 zile</span> inainte de
          expirarea ITP-ului fiecarui client. Ei revin la tine, nu la concurenta.
        </p>

        {/* CTAs */}
        <div
          className="animate-fade-in-up flex flex-col sm:flex-row items-center gap-3 mb-20"
          style={{ animationDelay: "0.2s" }}
        >
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-[#1877F2] hover:bg-[#1565D8] text-white font-semibold text-sm px-7 py-3.5 rounded-lg transition-colors"
          >
            Incearca 15 zile gratuit
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#functii"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#6B7280] hover:text-[#111318] border border-[#E5E7EB] hover:border-[#D1D5DB] bg-white px-7 py-3.5 rounded-lg transition-colors"
          >
            Cum functioneaza
          </a>
        </div>

        {/* Stats */}
        <div
          className="animate-fade-in-up w-full max-w-lg border border-[#F3F4F6] rounded-2xl bg-[#F9FAFB] px-6 py-6 grid grid-cols-3 gap-4"
          style={{ animationDelay: "0.25s" }}
        >
          {STATS.map((s, i) => (
            <div key={i} className={`text-center ${i < STATS.length - 1 ? "border-r border-[#E5E7EB]" : ""}`}>
              <p className="text-2xl font-bold text-[#0A0F1E]">{s.value}</p>
              <p className="text-xs text-[#9CA3AF] mt-1 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
