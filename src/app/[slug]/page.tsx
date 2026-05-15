import { createServiceClient } from "@/lib/supabase/service";
import { notFound } from "next/navigation";
import { MapPin, Phone, Mail, Zap, MessageCircle, Clock, CheckCircle } from "lucide-react";
import type { Metadata } from "next";
import { SmartBookingWizard } from "@/components/smart-page/smart-booking-wizard";
import { SmartChatbot } from "@/components/smart-page/smart-chatbot";
import { SmartGallery } from "@/components/smart-page/smart-gallery";
import type { SmartPageData, SmartServicii, ChatbotQA } from "@/lib/actions/smart-page";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: statie } = await supabase
    .from("statii")
    .select("id, nume")
    .eq("slug", slug)
    .eq("activa", true)
    .single();

  if (!statie) return { title: "Programare ITP" };

  const { data: sp } = await (supabase as any)
    .from("smart_page")
    .select("seo_description, tagline")
    .eq("statie_id", statie.id)
    .maybeSingle();

  return {
    title: `Programare ITP — ${statie.nume}`,
    description: sp?.seo_description ?? sp?.tagline ?? undefined,
  };
}

type ProgramLucru = Record<string, { start: string; end: string } | null>;

const ZILE_FULL: Record<string, string> = {
  luni: "Luni", marti: "Marți", miercuri: "Miercuri", joi: "Joi",
  vineri: "Vineri", sambata: "Sâmbătă", duminica: "Duminică",
};

const ZILE_ORDER = ["luni", "marti", "miercuri", "joi", "vineri", "sambata", "duminica"];

const DEFAULT_ACCENT = "#1877F2";
const DEFAULT_SECTIONS = ["programare", "program", "servicii", "galerie", "locatie", "contact"];

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data: statie } = await supabase
    .from("statii")
    .select("id, nume, adresa, oras, judet, telefon, email, program_lucru, localitate")
    .eq("slug", slug)
    .eq("activa", true)
    .single();

  if (!statie) notFound();

  const { data: smartPageRaw } = await (supabase as any)
    .from("smart_page")
    .select("*")
    .eq("statie_id", statie.id)
    .maybeSingle();

  const sp = smartPageRaw as SmartPageData | null;

  const accent = sp?.culoare_primara ?? DEFAULT_ACCENT;
  const programLucru = statie.program_lucru as ProgramLucru | null;
  const sectiuni = sp?.sectiuni_ordine?.length ? sp.sectiuni_ordine : DEFAULT_SECTIONS;
  const servicii: SmartServicii[] = sp?.servicii ?? [];
  const chatbotQa: ChatbotQA[] = sp?.chatbot_qa ?? [];
  const galerieUrls: string[] = sp?.galerie_urls ?? [];

  // If smart page is not configured or inactive, show simple fallback
  if (!sp || !sp.activa) {
    return <SimpleFallback statie={statie} accent={accent} programLucru={programLucru} />;
  }

  const location = [statie.adresa, statie.oras ?? statie.localitate, statie.judet]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Hero / Banner */}
      <header
        className="relative overflow-hidden"
        style={{ background: sp.banner_url ? undefined : `linear-gradient(135deg, ${accent}CC, ${accent})` }}
      >
        {sp.banner_url && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${sp.banner_url})` }}
          >
            <div className="absolute inset-0 bg-black/50" />
          </div>
        )}
        <div className="relative max-w-3xl mx-auto px-6 py-10 flex items-center gap-5">
          {sp.logo_url ? (
            <img
              src={sp.logo_url}
              alt={statie.nume}
              className="h-16 w-16 rounded-2xl object-cover shrink-0 border-2 border-white/30 shadow-lg"
            />
          ) : (
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl shrink-0 shadow-lg"
              style={{ background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.3)" }}
            >
              <Zap className="h-7 w-7 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white leading-tight">{statie.nume}</h1>
            {sp.tagline && (
              <p className="text-sm text-white/80 mt-1">{sp.tagline}</p>
            )}
            {location && (
              <p className="text-xs text-white/60 mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />{location}
              </p>
            )}
          </div>
          {sp.whatsapp_nr && (
            <a
              href={`https://wa.me/${sp.whatsapp_nr.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
              style={{ background: "#25D366" }}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}
        </div>
      </header>

      {/* Sections */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {sectiuni.map((sectiune) => {
          switch (sectiune) {
            case "programare":
              return (
                <section key="programare" className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-[#111318] mb-5 flex items-center gap-2">
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white"
                      style={{ background: accent }}
                    >
                      <Zap className="h-4 w-4" />
                    </span>
                    Fă o programare
                  </h2>
                  <SmartBookingWizard
                    statieId={statie.id}
                    programLucru={programLucru}
                    accent={accent}
                  />
                </section>
              );

            case "program":
              if (!programLucru) return null;
              return (
                <section key="program" className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-[#111318] mb-4 flex items-center gap-2">
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white"
                      style={{ background: accent }}
                    >
                      <Clock className="h-4 w-4" />
                    </span>
                    Program de lucru
                  </h2>
                  <div className="space-y-1.5">
                    {ZILE_ORDER.map((zi) => {
                      const interval = programLucru[zi];
                      return (
                        <div key={zi} className="flex items-center justify-between text-sm py-1.5 border-b border-[#F3F4F6] last:border-0">
                          <span className="text-[#374151] font-medium w-28">{ZILE_FULL[zi]}</span>
                          {interval ? (
                            <span className="text-[#111318] font-semibold" style={{ color: accent }}>
                              {interval.start.slice(0, 5)} – {interval.end.slice(0, 5)}
                            </span>
                          ) : (
                            <span className="text-[#9CA3AF]">Închis</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );

            case "servicii":
              if (!servicii.length) return null;
              return (
                <section key="servicii" className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-[#111318] mb-4 flex items-center gap-2">
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white"
                      style={{ background: accent }}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </span>
                    Servicii
                  </h2>
                  <div className="space-y-3">
                    {servicii.map((s) => (
                      <div key={s.id} className="flex items-start justify-between gap-4 py-2 border-b border-[#F3F4F6] last:border-0">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#111318]">{s.nume}</p>
                          {s.descriere && (
                            <p className="text-xs text-[#6B7280] mt-0.5">{s.descriere}</p>
                          )}
                          {s.durata && (
                            <p className="text-xs text-[#9CA3AF] mt-0.5">{s.durata} min</p>
                          )}
                        </div>
                        {s.pret != null && (
                          <span className="shrink-0 text-sm font-bold" style={{ color: accent }}>
                            {s.pret} Lei
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );

            case "galerie":
              if (!galerieUrls.length) return null;
              return (
                <section key="galerie" className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-[#111318] mb-4">Galerie foto</h2>
                  <SmartGallery urls={galerieUrls} statieName={statie.nume} accent={accent} />
                </section>
              );

            case "locatie":
              if (!location) return null;
              return (
                <section key="locatie" className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-[#111318] mb-4 flex items-center gap-2">
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white"
                      style={{ background: accent }}
                    >
                      <MapPin className="h-4 w-4" />
                    </span>
                    Locație
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-sm text-[#374151]">
                      <MapPin className="h-4 w-4 text-[#6B7280] shrink-0 mt-0.5" />
                      <span>{location}</span>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
                      style={{ color: accent }}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Deschide în Google Maps
                    </a>
                  </div>
                </section>
              );

            case "contact":
              if (!statie.telefon && !statie.email) return null;
              return (
                <section key="contact" className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-[#111318] mb-4 flex items-center gap-2">
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white"
                      style={{ background: accent }}
                    >
                      <Phone className="h-4 w-4" />
                    </span>
                    Contact
                  </h2>
                  <div className="space-y-3">
                    {statie.telefon && (
                      <a href={`tel:${statie.telefon}`} className="flex items-center gap-2 text-sm hover:underline" style={{ color: accent }}>
                        <Phone className="h-4 w-4 shrink-0 text-[#6B7280]" />
                        {statie.telefon}
                      </a>
                    )}
                    {statie.email && (
                      <a href={`mailto:${statie.email}`} className="flex items-center gap-2 text-sm hover:underline" style={{ color: accent }}>
                        <Mail className="h-4 w-4 shrink-0 text-[#6B7280]" />
                        {statie.email}
                      </a>
                    )}
                  </div>
                </section>
              );

            default:
              return null;
          }
        })}
      </main>

      <footer className="py-6 text-center">
        <p className="text-[11px] text-[#9CA3AF]">
          Powered by <span className="font-semibold">ITPBASE.RO</span>
        </p>
      </footer>

      {/* Floating chatbot */}
      {chatbotQa.length > 0 && (
        <SmartChatbot qa={chatbotQa} accent={accent} statieNume={statie.nume} />
      )}
    </div>
  );
}

// Fallback for stations without smart page configured or inactive
function SimpleFallback({
  statie,
  accent,
  programLucru,
}: {
  statie: { id: string; nume: string; adresa?: string | null; oras?: string | null; judet?: string | null; telefon?: string | null; email?: string | null; localitate?: string | null };
  accent: string;
  programLucru: ProgramLucru | null;
}) {
  const location = [statie.adresa, statie.oras ?? statie.localitate, statie.judet]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[#E5E7EB] py-4 px-6" style={{ borderTopWidth: 3, borderTopColor: accent }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
            style={{ background: accent }}
          >
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-[#111318]">{statie.nume}</h1>
            <p className="text-xs text-[#9CA3AF]">Programare ITP online</p>
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
        {(location || statie.telefon || statie.email) && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-2">
            {location && (
              <div className="flex items-center gap-2 text-sm text-[#374151]">
                <MapPin className="h-4 w-4 text-[#6B7280] shrink-0" />
                <span>{location}</span>
              </div>
            )}
            {statie.telefon && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-[#6B7280] shrink-0" />
                <a href={`tel:${statie.telefon}`} className="hover:underline" style={{ color: accent }}>
                  {statie.telefon}
                </a>
              </div>
            )}
            {statie.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-[#6B7280] shrink-0" />
                <a href={`mailto:${statie.email}`} className="hover:underline" style={{ color: accent }}>
                  {statie.email}
                </a>
              </div>
            )}
          </div>
        )}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-[#111318] mb-4">Fă o programare</h2>
          <SmartBookingWizard statieId={statie.id} programLucru={programLucru} accent={accent} />
        </div>
        <p className="text-center text-[11px] text-[#9CA3AF] pb-4">
          Powered by <span className="font-semibold">ITPBASE.RO</span>
        </p>
      </main>
    </div>
  );
}
