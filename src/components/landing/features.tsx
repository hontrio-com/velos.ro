import { MessageSquare, CalendarCheck, Users, BarChart3, Building2, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  {
    icon: MessageSquare,
    color: "#1877F2",
    bg: "#EFF6FF",
    title: "SMS Remindere Automate",
    description:
      "Platforma genereaza si trimite SMS-uri personalizate cu 30, 15, 7 si 1 zi inainte de expirarea ITP-ului. Niciodata nu uiti un client, niciodata nu trimiți manual.",
    tag: "Cel mai folosit",
  },
  {
    icon: CalendarCheck,
    color: "#059669",
    bg: "#ECFDF5",
    title: "Programari Online",
    description:
      "Fiecare statie primeste o pagina de rezervari cu URL unic. Clientii se programeaza de pe telefon in 30 de secunde, tu primesti notificare instantanee.",
    tag: "Fara costuri extra",
  },
  {
    icon: Users,
    color: "#7C3AED",
    bg: "#F5F3FF",
    title: "CRM Complet",
    description:
      "Istoricul fiecarui client: vehicule, toate programarile, conversatii SMS, note. Tot ce ai nevoie sa stii despre un client este la un click distanta.",
    tag: "Import CSV inclus",
  },
  {
    icon: BarChart3,
    color: "#EA580C",
    bg: "#FFF7ED",
    title: "Rapoarte si Statistici",
    description:
      "Venituri per angajat, rata de revenire a clientilor, SMS-uri trimise. Decizii de business bazate pe date reale, nu pe estimari.",
    tag: "Export PDF si CSV",
  },
  {
    icon: Building2,
    color: "#0891B2",
    bg: "#ECFEFF",
    title: "Gestionare Multi-Statii",
    description:
      "Ai mai multe locatii? Controlezi toate statiile dintr-un singur cont. Echipe si date separate pentru fiecare locatie, dashboard centralizat pentru tine.",
    tag: "Dashboard centralizat",
  },
  {
    icon: Zap,
    color: "#D97706",
    bg: "#FFFBEB",
    title: "Automatizare Totala",
    description:
      "Configurezi o singura data: template-uri SMS, orele de trimitere, planul de remindere. De atunci, platforma lucreaza autonom. Zero efort zilnic.",
    tag: "Setup o singura data",
  },
];

export default function LandingFeatures() {
  return (
    <section id="functii" className="bg-[#F7F8FA] py-24 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[#1877F2] uppercase tracking-widest mb-3">
            Functii
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A0F1E] leading-tight mb-5">
            Tot ce ai nevoie
            <br />
            <span className="text-[#6B7280]">intr-un singur loc.</span>
          </h2>
          <p className="text-lg text-[#6B7280] leading-relaxed">
            Velos nu este un simplu tool de SMS-uri. Este platforma completa care
            transforma modul in care iti gestionezi statia ITP.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Card key={i} className="bg-white hover:shadow-md transition-shadow duration-200">
                <CardContent className="pt-6 flex flex-col gap-4">
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: f.bg }}
                  >
                    <Icon className="h-5 w-5" style={{ color: f.color }} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#111318] mb-2">{f.title}</h3>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{f.description}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="w-fit text-xs"
                    style={{ backgroundColor: f.bg, color: f.color }}
                  >
                    {f.tag}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
