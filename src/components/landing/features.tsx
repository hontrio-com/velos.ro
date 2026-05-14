import {
  MessageSquare,
  CalendarCheck,
  Users,
  BarChart3,
  Building2,
  Zap,
} from "lucide-react";

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
      "Venituri per angajat, rata de revenire a clientilor, SMS-uri trimise si deschise, programari pe intervale. Decizii de business bazate pe date reale.",
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
    <section id="functii" className="bg-white py-24 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
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

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="group relative bg-white border border-[#F3F4F6] rounded-2xl p-7 hover:border-[#E5E7EB] hover:shadow-lg hover:shadow-black/[0.04] transition-all duration-200"
              >
                {/* Icon */}
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: f.bg }}
                >
                  <Icon className="h-5 w-5" style={{ color: f.color }} />
                </div>

                {/* Content */}
                <h3 className="text-base font-bold text-[#111318] mb-2.5">
                  {f.title}
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed mb-5">
                  {f.description}
                </p>

                {/* Tag */}
                <span
                  className="inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: f.bg, color: f.color }}
                >
                  {f.tag}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
