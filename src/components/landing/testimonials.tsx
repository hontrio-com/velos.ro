import { Card, CardContent } from "@/components/ui/card";

const TESTIMONIALS = [
  {
    quote:
      "Sincer, am luat abonamentul mai mult sa incerc. Dupa vreo luna si jumatate mi-a sunat un client sa zica ca a primit SMS-ul si vrea sa vina. Nu il mai vazusem de doi ani. Aia m-a convins.",
    name: "Relu Cojocaru",
    role: "Proprietar",
    company: "Statie ITP Buzau",
    city: "Buzau",
    initials: "RC",
    color: "#1877F2",
  },
  {
    quote:
      "Eu nu prea ma pricep la calculatoare dar baiatul meu mi-a zis sa incerc. L-a setat el in vreo ora si de atunci merge singur. Clientii primesc mesaj, unii suna inapoi sa faca programare. Nu ma asteptam sa functioneze asa.",
    name: "Gheorghe Vlaicu",
    role: "Proprietar",
    company: "ITP Vlaicu",
    city: "Craiova",
    initials: "GV",
    color: "#059669",
  },
  {
    quote:
      "Am stat vreo saptamana sa ma gandesc daca merita banii. Pana la urma am zis sa incerc trial-ul. In trial deja mi-au venit doi clienti vechi care nu mai venisera de ceva vreme. Asa ca am ramas.",
    name: "Daniela Stoica",
    role: "Proprietar",
    company: "AutoITP Ploiesti",
    city: "Ploiesti",
    initials: "DS",
    color: "#7C3AED",
  },
  {
    quote:
      "Aveam impresia ca clientii oricum stiu cand le expira ITP-ul. Dar nu e asa. Acum cand le trimitem mesaj, multi zic ca uitasera complet. Si vin la noi ca i-am anuntat noi, nu se duc sa caute altundeva.",
    name: "Ionut Badea",
    role: "Proprietar",
    company: "Statie ITP Sector 4",
    city: "Bucuresti",
    initials: "IB",
    color: "#EA580C",
  },
];

function Stars() {
  return (
    <div className="flex items-center gap-0.5 mb-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="h-4 w-4 text-[#F59E0B]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.952 2.878c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.064 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
        </svg>
      ))}
    </div>
  );
}

export default function LandingTestimonials() {
  return (
    <section id="testimoniale" className="bg-white py-24 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[#1877F2] uppercase tracking-widest mb-3">
            Testimoniale
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A0F1E] leading-tight mb-5">
            Ce spun statiile
            <br />
            <span className="text-[#6B7280]">care folosesc Velos.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <Card key={i} className="bg-[#F9FAFB]">
              <CardContent className="pt-6 flex flex-col h-full">
                <Stars />
                <blockquote className="text-[#374151] text-[15px] leading-relaxed flex-1 mb-6">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3 pt-4 border-t border-[#E5E7EB]">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111318]">{t.name}</p>
                    <p className="text-xs text-[#9CA3AF]">
                      {t.role}, {t.company} &middot; {t.city}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
