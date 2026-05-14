const TESTIMONIALS = [
  {
    quote:
      "Inainte trimiteam SMS-uri manual din Excel, o data la cateva luni cand imi aminteam. Acum Velos face totul automat. In prima luna am recuperat 34 de clienti pe care altfel nu i-as mai fi contactat niciodata.",
    name: "Mihai Dobrinescu",
    role: "Director",
    company: "AutoITP Prahova",
    city: "Ploiesti",
    initials: "MD",
    color: "#1877F2",
  },
  {
    quote:
      "Setup in 20 de minute si de atunci nu am mai pierdut niciun client care voia sa revina. Rata de revenire a crescut cu 40% in primele 3 luni. Cel mai bun lucru pe care l-am facut pentru statie.",
    name: "Sorina Marinescu",
    role: "Proprietar",
    company: "ITP Cluj-Centru",
    city: "Cluj-Napoca",
    initials: "SM",
    color: "#7C3AED",
  },
  {
    quote:
      "Am doua statii si Velos le gestioneaza pe amandoua dintr-un singur ecran. Clientii primesc SMS de la noi, nu de la concurenta din fata. Diferenta e clara de la prima luna.",
    name: "Bogdan Tanase",
    role: "Manager",
    company: "Statia ITP Bacau",
    city: "Bacau",
    initials: "BT",
    color: "#059669",
  },
  {
    quote:
      "La inceput eram sceptica daca merita. Acum nu mai pot concepe sa lucrez fara Velos. Clientii ma suna sa ma intrebe daca au primit bine SMS-ul si vin direct la noi, nu mai cauta altundeva.",
    name: "Adriana Popa",
    role: "Proprietar",
    company: "AutoTest Sibiu",
    city: "Sibiu",
    initials: "AP",
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
        {/* Header */}
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

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl p-8 flex flex-col"
            >
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
