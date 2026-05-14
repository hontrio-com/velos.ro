import Link from "next/link";
import {
  Search,
  CalendarCheck,
  ImageIcon,
  MapPin,
  Wrench,
  Clock,
  Phone,
  Star,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

          {/* Browser mockup */}
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-xl">
              {/* Browser chrome */}
              <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-4 py-3 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#FCA5A5]" />
                <span className="h-3 w-3 rounded-full bg-[#FCD34D]" />
                <span className="h-3 w-3 rounded-full bg-[#86EFAC]" />
                <div className="flex-1 mx-3 bg-white border border-[#E5E7EB] rounded-md px-3 py-1.5 text-center">
                  <span className="text-[11px] text-[#9CA3AF] font-mono">
                    velos.ro/itp/auto-test-cluj
                  </span>
                </div>
              </div>

              {/* Page content */}
              <div className="bg-white">
                {/* Station header */}
                <div className="bg-[#1877F2] px-5 py-5 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold">Auto Test Cluj</h3>
                      <p className="text-[11px] text-blue-200 mt-0.5">Statie ITP autorizata RAR</p>
                      <div className="flex items-center gap-1 mt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                        ))}
                        <span className="text-[10px] text-blue-200 ml-1">4.9 (127 recenzii)</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-blue-200">Luni - Vineri</p>
                      <p className="text-xs font-semibold">08:00 - 18:00</p>
                      <span className="inline-block mt-1 text-[9px] font-bold bg-green-400 text-green-900 px-1.5 py-0.5 rounded-full">
                        DESCHIS ACUM
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nav tabs */}
                <div className="border-b border-[#F3F4F6] flex text-[11px] font-medium">
                  {["Programare", "Servicii", "Galerie", "Locatie"].map((tab, i) => (
                    <button
                      key={tab}
                      className={`px-4 py-2.5 transition-colors ${
                        i === 0
                          ? "text-[#1877F2] border-b-2 border-[#1877F2]"
                          : "text-[#9CA3AF]"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Booking widget */}
                <div className="px-5 py-4">
                  <p className="text-[11px] font-semibold text-[#374151] mb-3">
                    Alege data si ora dorita
                  </p>
                  <div className="grid grid-cols-4 gap-1.5 mb-3">
                    {["Lun 12", "Mar 13", "Mie 14", "Joi 15"].map((day, i) => (
                      <button
                        key={day}
                        className={`py-2 rounded-lg text-[10px] font-medium border transition-colors ${
                          i === 1
                            ? "bg-[#1877F2] border-[#1877F2] text-white"
                            : "border-[#E5E7EB] text-[#6B7280] hover:border-[#1877F2]"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 mb-4">
                    {["08:00", "09:00", "10:30", "14:00"].map((time, i) => (
                      <button
                        key={time}
                        className={`py-1.5 rounded-lg text-[10px] font-medium border transition-colors ${
                          i === 2
                            ? "bg-[#1877F2] border-[#1877F2] text-white"
                            : "border-[#E5E7EB] text-[#6B7280]"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                  <button className="w-full bg-[#1877F2] text-white text-[11px] font-semibold py-2.5 rounded-lg">
                    Confirma programarea
                  </button>
                </div>

                {/* Footer info */}
                <div className="border-t border-[#F3F4F6] px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-[#9CA3AF]" />
                    <span className="text-[10px] text-[#9CA3AF]">Str. Fabricii 12, Cluj-Napoca</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-[#9CA3AF]" />
                    <span className="text-[10px] text-[#9CA3AF]">0740 000 000</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-[#9CA3AF] mt-3">
              Pagina ta va arata similar cu aceasta, personalizata cu datele statiei tale.
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
