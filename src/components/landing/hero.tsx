import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATS = [
  { value: "+40%", label: "mai mulți clienți care revin" },
  { value: "-30%", label: "pierderi din expirări uitate" },
  { value: "+ venit lunar", label: "prin automatizare și retenție" },
];

export default function LandingHero() {
  return (
    <section
      className="relative bg-white min-h-[88vh] flex flex-col items-center justify-center py-24"
      style={{
        backgroundImage: `radial-gradient(circle, #CBD5E1 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
      }}
    >
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 flex flex-col items-center text-center">

        {/* Badge */}
        <div className="animate-fade-in-up mb-10">
          <Badge variant="outline" className="text-[#1877F2] border-[#BFDBFE] bg-[#EFF6FF] px-4 py-1 rounded-full text-xs font-semibold tracking-wide h-auto">
            Crește numărul de clienți care revin
          </Badge>
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-in-up text-4xl sm:text-5xl lg:text-6xl xl:text-[72px] font-bold text-[#0A0F1E] leading-[1.1] tracking-tight mb-6"
          style={{ animationDelay: "0.1s" }}
        >
          Clienții uită de ITP.
          <br />
          <span className="text-[#1877F2]">Velos îi aduce înapoi.</span>
        </h1>

        {/* Subheadline */}
        <p
          className="animate-fade-in-up max-w-xl text-lg sm:text-xl text-[#6B7280] leading-relaxed mb-10"
          style={{ animationDelay: "0.15s" }}
        >
          Tot ce ai nevoie pentru administrarea unei stații ITP moderne: reminder-e automate prin SMS, management vehicule, programări online, administrare angajați și evidență completă într-un singur loc.
        </p>

        {/* CTAs */}
        <div
          className="animate-fade-in-up flex flex-col sm:flex-row items-center gap-3 mb-20 w-full sm:w-auto"
          style={{ animationDelay: "0.2s" }}
        >
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "lg" }),
              "gap-2 px-8 h-12 text-sm w-full sm:w-auto justify-center"
            )}
          >
            Incearca 15 zile gratuit
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#functii"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "px-8 h-12 text-sm w-full sm:w-auto justify-center"
            )}
          >
            Cum functioneaza
          </Link>
        </div>

        {/* Stats card */}
        <div
          className="animate-fade-in-up w-full max-w-lg border border-[#E5E7EB] rounded-2xl bg-[#F9FAFB] px-6 py-6 grid grid-cols-3 gap-4"
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
