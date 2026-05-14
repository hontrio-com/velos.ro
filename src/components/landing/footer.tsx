import Image from "next/image";
import Link from "next/link";

const LINKS = {
  Produs: [
    { label: "Functii", href: "#functii" },
    { label: "ITP Smart Page", href: "#functii" },
    { label: "Preturi", href: "#preturi" },
    { label: "Testimoniale", href: "#testimoniale" },
    { label: "FAQ", href: "#faq" },
  ],
  Companie: [
    { label: "Despre noi", href: "/despre" },
    { label: "Blog", href: "/blog" },
    { label: "Cariere", href: "/cariere" },
    { label: "Parteneri", href: "/parteneri" },
  ],
  Contact: [
    { label: "contact@itpbase.ro", href: "mailto:contact@itpbase.ro" },
    { label: "0800 000 000 (gratuit)", href: "tel:0800000000" },
    { label: "Luni - Vineri, 09:00 - 18:00", href: "#" },
    { label: "Trimite un mesaj", href: "/contact" },
  ],
  Legal: [
    { label: "Termeni si conditii", href: "/termeni" },
    { label: "Politica de confidentialitate", href: "/confidentialitate" },
    { label: "Politica cookies", href: "/cookies" },
    { label: "GDPR", href: "/gdpr" },
  ],
};

export default function LandingFooter() {
  return (
    <footer className="bg-[#F7F8FA] border-t border-[#E5E7EB]">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-8">

        {/* Top: Brand + Links */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-14">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Image
              src="/logo441x245.png"
              alt="Velos"
              width={176}
              height={98}
              quality={100}
              className="h-9 w-auto mb-5"
            />
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Platforma CRM dedicata statiilor ITP din Romania. SMS-uri automate, programari online si CRM complet.
            </p>
          </div>

          {/* Link columns — 2 columns on mobile, 4 on desktop */}
          <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-8">
            {Object.entries(LINKS).map(([title, links]) => (
              <div key={title}>
                <h4 className="text-xs font-semibold text-[#111318] uppercase tracking-widest mb-4">
                  {title}
                </h4>
                <ul className="space-y-2.5">
                  {links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-[#6B7280] hover:text-[#111318] transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ANPC badges */}
        <div className="flex items-center gap-4 mb-10">
          <a
            href="https://anpc.ro/ce-este-sal/"
            target="_blank"
            rel="noopener noreferrer"
            title="Solutionarea Alternativa a Litigiilor"
          >
            <Image
              src="/SAL.png"
              alt="SAL - Solutionarea Alternativa a Litigiilor"
              width={200}
              height={50}
              quality={100}
              className="h-10 w-auto"
            />
          </a>
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
            title="Solutionarea Online a Litigiilor"
          >
            <Image
              src="/SOL.png"
              alt="SOL - Solutionarea Online a Litigiilor"
              width={200}
              height={50}
              quality={100}
              className="h-10 w-auto"
            />
          </a>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#9CA3AF]">
            &copy; {new Date().getFullYear()} Velos SRL. Toate drepturile rezervate.
          </p>
          <p className="text-xs text-[#9CA3AF]">
            Made in Romania by{" "}
            <a
              href="https://inovex.ro"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#6B7280] transition-colors"
            >
              Inovex.ro
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
