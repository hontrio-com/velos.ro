import Link from "next/link";
import {
  Search,
  CalendarCheck,
  ImageIcon,
  MapPin,
  Wrench,
  Clock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookingMockup } from "@/components/landing/booking-mockup";

const FEATURES = [
  {
    icon: Search,
    title: "Optimizat SEO",
    description:
      "Pagina ta apare pe Google cand cineva cauta \"ITP\" + orasul tau. Clienti noi, fara publicitate platita.",
  },
  {
    icon: CalendarCheck,
    title: "Calendar sincronizat",
    description:
      "Clientii se programeaza direct din pagina. Rezervarile apar instant in platforma, fara dubluri.",
  },
  {
    icon: ImageIcon,
    title: "Galerie foto",
    description:
      "Prezinta statia ta cu imagini. Clientii vad spatiul inainte sa vina si capata incredere.",
  },
  {
    icon: Wrench,
    title: "Servicii si preturi",
    description:
      "Lista completa: ITP auto, ITP moto, service, inlocuire piese. Fiecare cu pretul afisat.",
  },
  {
    icon: MapPin,
    title: "Locatie interactiva",
    description:
      "Un click deschide direct Google Maps sau Waze cu ruta catre tine. Fara sa caute adresa manual.",
  },
  {
    icon: Clock,
    title: "Program de lucru",
    description:
      "Clientii stiu exact cand esti deschis, inclusiv sambata si duminica. Fara apeluri inutile.",
  },
];

export default function LandingSmartPage() {
  return (
    <section className="bg-white py-24">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge
            variant="outline"
            className="text-[#0891B2] border-[#A5F3FC] bg-[#ECFEFF] px-4 py-1 rounded-full text-xs font-semibold tracking-wide h-auto mb-4"
          >
            Functie exclusiva
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A0F1E] leading-tight mb-5">
            Mini-site-ul tau ITP,
            <br />
            <span className="text-[#0891B2]">gata in 5 minute.</span>
          </h2>
          <p className="text-lg text-[#6B7280] leading-relaxed">
            Fiecare statie primeste automat o pagina de prezentare completa, cu URL propriu
            si optimizata pentru Google. Clientii te gasesc, citesc, si se programeaza direct.
            Tu nu faci nimic.
          </p>
        </div>

        {/* Main content: mockup + features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">

          {/* Interactive booking mockup */}
          <div className="order-2 lg:order-1">
            <BookingMockup />
            <p className="text-xs text-center text-[#9CA3AF] mt-3">
              Demo interactiv. Pagina ta va arata similar, personalizata cu datele statiei tale.
            </p>
          </div>

          {/* Feature list */}
          <div className="order-1 lg:order-2 space-y-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex items-start gap-4">
                  <div className="h-9 w-9 rounded-xl bg-[#ECFEFF] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-[#0891B2]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#111318] mb-1">{f.title}</h4>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{f.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom proof bar */}
        <div className="border border-[#E5E7EB] rounded-2xl bg-[#F9FAFB] px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-sm">
            {[
              "URL propriu: velos.ro/itp/numele-statiei",
              "Optimizat pentru mobile",
              "Fara costuri suplimentare",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#059669] shrink-0" />
                <span className="text-[#374151] font-medium text-sm">{item}</span>
              </div>
            ))}
          </div>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "lg" }),
              "gap-2 px-7 h-11 shrink-0"
            )}
          >
            Creeaza pagina ta
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
