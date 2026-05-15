import { createServiceClient } from "@/lib/supabase/service";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import {
  MapPin, Phone, Clock, ExternalLink, Navigation2,
  CheckCircle2, Layers, Star, Images,
} from "lucide-react";
import { SmartBookingWizard } from "@/components/smart-page/smart-booking-wizard";
import { SmartChatbot } from "@/components/smart-page/smart-chatbot";
import { SmartGallery } from "@/components/smart-page/smart-gallery";
import type { SmartPageData } from "@/lib/actions/smart-page";

interface Props {
  params: Promise<{ slug: string }>;
}

type ProgramLucru = Record<string, { start: string; end: string } | null>;

const ZILE: Record<string, string> = {
  luni: "Luni", marti: "Marți", miercuri: "Miercuri", joi: "Joi",
  vineri: "Vineri", sambata: "Sâmbătă", duminica: "Duminică",
};

const DEFAULT_SECTION_ORDER = ["programare", "program", "servicii", "galerie", "locatie", "contact"];

async function getPageData(slug: string) {
  const supabase = createServiceClient();

  const { data: statie } = await supabase
    .from("statii")
    .select("id, nume, slug, adresa, localitate, judet, telefon, email, website, logo_url, program_lucru, durata_slot_minute, nr_linii, lat, lng, booking_activ")
    .eq("slug", slug)
    .eq("activa", true)
    .single();

  if (!statie) return null;

  const { data: smartPage } = await (supabase as any)
    .from("smart_page")
    .select("*")
    .eq("statie_id", statie.id)
    .maybeSingle();

  return { statie, smartPage: smartPage as SmartPageData | null };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPageData(slug);
  if (!data) return { title: "Pagina nu a fost găsită" };

  const { statie, smartPage } = data;
  const location = [statie.localitate, statie.judet].filter(Boolean).join(", ");
  const title = `ITP ${statie.localitate ?? statie.nume} — ${statie.nume} | Programare Online`;
  const description = smartPage?.seo_description ??
    `Programare ITP online la ${statie.nume}${location ? ` din ${location}` : ""}. Slot-uri disponibile, confirmare imediată. Rapid, simplu, fără așteptare.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "ro_RO",
      ...(smartPage?.banner_url ? { images: [{ url: smartPage.banner_url }] } : {}),
    },
    robots: { index: true, follow: true },
  };
}

export default async function SmartPage({ params }: Props) {
  const { slug } = await params;
  const data = await getPageData(slug);
  if (!data) notFound();

  const { statie, smartPage } = data;

  const accent = smartPage?.culoare_primara ?? "#1877F2";
  const tagline = smartPage?.tagline ?? "Programare ITP online, rapidă și ușoară";
  const whatsappNr = smartPage?.whatsapp_nr;
  const servicii = (smartPage?.servicii ?? []) as SmartPageData["servicii"];
  const chatbotQa = (smartPage?.chatbot_qa ?? []) as SmartPageData["chatbot_qa"];
  const galerieUrls = (smartPage?.galerie_urls ?? []) as string[];
  const sectiuniOrdine = (smartPage?.sectiuni_ordine ?? DEFAULT_SECTION_ORDER) as string[];
  const logoUrl = smartPage?.logo_url ?? statie.logo_url;
  const bannerUrl = smartPage?.banner_url;

  const programLucru = statie.program_lucru as ProgramLucru | null;
  const location = [statie.adresa, statie.localitate, statie.judet].filter(Boolean).join(", ");
  const locationShort = [statie.localitate, statie.judet].filter(Boolean).join(", ");

  const openDays = programLucru
    ? Object.entries(programLucru).filter(([, v]) => !!v)
    : [];

  const mapsUrl = statie.lat && statie.lng
    ? `https://www.google.com/maps?q=${statie.lat},${statie.lng}`
    : `https://www.google.com/maps/search/${encodeURIComponent(location)}`;

  const wazeUrl = statie.lat && statie.lng
    ? `https://waze.com/ul?ll=${statie.lat},${statie.lng}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(location)}&navigate=yes`;

  const mapEmbedUrl = statie.lat && statie.lng
    ? `https://maps.google.com/maps?q=${statie.lat},${statie.lng}&z=16&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;

  // JSON-LD LocalBusiness schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: statie.nume,
    url: `https://velos.ro/${slug}`,
    telephone: statie.telefon,
    email: statie.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: statie.adresa,
      addressLocality: statie.localitate,
      addressRegion: statie.judet,
      addressCountry: "RO",
    },
    ...(statie.lat && statie.lng ? {
      geo: {
        "@type": "GeoCoordinates",
        latitude: statie.lat,
        longitude: statie.lng,
      },
    } : {}),
    openingHoursSpecification: openDays.map(([day, hours]) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${day.charAt(0).toUpperCase() + day.slice(1)}`,
      opens: (hours as { start: string })?.start,
      closes: (hours as { end: string })?.end,
    })),
    priceRange: "$$",
    hasMap: mapsUrl,
    ...(galerieUrls.length > 0 ? { image: galerieUrls } : {}),
  };

  // Section renderers map
  const sectionMap: Record<string, React.ReactNode> = {
    programare: (
      <section key="programare" id="programare" className="scroll-mt-20">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0" style={{ backgroundColor: `${accent}15` }}>
            <Clock className="h-5 w-5" style={{ color: accent }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#111318]">Programare online</h2>
            <p className="text-sm text-[#6B7280]">Alege data și ora convenabilă</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 shadow-sm">
          <SmartBookingWizard
            statieId={statie.id}
            programLucru={programLucru}
            accent={accent}
          />
        </div>
      </section>
    ),

    program: openDays.length > 0 ? (
      <section key="program">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0" style={{ backgroundColor: `${accent}15` }}>
            <Clock className="h-5 w-5" style={{ color: accent }} />
          </div>
          <h2 className="text-lg font-bold text-[#111318]">Program de lucru</h2>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-sm">
          {openDays.map(([day, hours], i) => (
            <div key={day} className={`flex items-center justify-between px-5 py-3.5 ${i > 0 ? "border-t border-[#F3F4F6]" : ""}`}>
              <span className="text-sm font-medium text-[#374151]">{ZILE[day] ?? day}</span>
              <span className="text-sm text-[#111318] font-semibold">
                {(hours as { start: string; end: string })?.start} – {(hours as { start: string; end: string })?.end}
              </span>
            </div>
          ))}
        </div>
      </section>
    ) : null,

    servicii: servicii.length > 0 ? (
      <section key="servicii">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0" style={{ backgroundColor: `${accent}15` }}>
            <Star className="h-5 w-5" style={{ color: accent }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#111318]">Serviciile noastre</h2>
            <p className="text-sm text-[#6B7280]">Prețuri clare, fără surprize</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {servicii.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-[#111318] text-sm">{s.nume}</p>
                  {s.descriere && (
                    <p className="text-xs text-[#6B7280] mt-0.5">{s.descriere}</p>
                  )}
                  {s.durata && (
                    <p className="text-xs text-[#9CA3AF] mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />~{s.durata} min
                    </p>
                  )}
                </div>
                {s.pret && (
                  <div className="shrink-0 text-right">
                    <span className="text-lg font-extrabold" style={{ color: accent }}>{s.pret}</span>
                    <span className="text-xs text-[#6B7280] ml-0.5">lei</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    ) : null,

    galerie: galerieUrls.length > 0 ? (
      <section key="galerie">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0" style={{ backgroundColor: `${accent}15` }}>
            <Images className="h-5 w-5" style={{ color: accent }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#111318]">Galerie foto</h2>
            <p className="text-sm text-[#6B7280]">Stația noastră</p>
          </div>
        </div>
        <SmartGallery urls={galerieUrls} statieName={statie.nume} accent={accent} />
      </section>
    ) : null,

    locatie: (location || statie.lat) ? (
      <section key="locatie">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0" style={{ backgroundColor: `${accent}15` }}>
            <MapPin className="h-5 w-5" style={{ color: accent }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#111318]">Cum ne găsești</h2>
            <p className="text-sm text-[#6B7280] truncate max-w-xs">{location}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-sm">
          <iframe
            title="Locatie statie ITP"
            src={mapEmbedUrl}
            width="100%"
            height="240"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2 min-w-0">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[#6B7280]" />
              <p className="text-sm text-[#374151]">{location}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <a href={wazeUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] px-3 py-2 text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors">
                <Navigation2 className="h-3.5 w-3.5 text-[#00CAFF]" />
                Waze
              </a>
              <a href={mapsUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] px-3 py-2 text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors">
                <ExternalLink className="h-3.5 w-3.5 text-[#4285F4]" />
                Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>
    ) : null,

    contact: (
      <section key="contact" className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
        <h2 className="text-base font-bold text-[#111318] mb-4">Contact</h2>
        <div className="space-y-3">
          {statie.telefon && (
            <a href={`tel:${statie.telefon}`} className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E7EB] shrink-0"
                style={{ backgroundColor: `${accent}10` }}>
                <Phone className="h-4 w-4" style={{ color: accent }} />
              </div>
              <span className="text-sm font-medium text-[#374151] group-hover:text-[#111318] transition-colors">
                {statie.telefon}
              </span>
            </a>
          )}
          {whatsappNr && (
            <a href={`https://wa.me/${whatsappNr.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
                style={{ backgroundColor: "#25D36615" }}>
                <svg className="h-4 w-4" style={{ color: "#25D366" }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.122 1.525 5.852L.057 23.99l6.305-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.373l-.36-.214-3.726.977.994-3.635-.235-.374A9.818 9.818 0 1112 21.818z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-[#374151]">WhatsApp</span>
            </a>
          )}
          {locationShort && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E7EB] shrink-0"
                style={{ backgroundColor: `${accent}10` }}>
                <MapPin className="h-4 w-4" style={{ color: accent }} />
              </div>
              <span className="text-sm text-[#374151]">{location}</span>
            </div>
          )}
        </div>
      </section>
    ),
  };

  return (
    <>
      <Script
        id="smart-page-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#F7F8FA]">

        {/* ── STICKY HEADER ── */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB]">
          <div className="max-w-3xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={statie.nume}
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl object-cover border border-[#E5E7EB] shrink-0" />
              ) : (
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm"
                  style={{ backgroundColor: accent }}>
                  {statie.nume.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#111318] truncate">{statie.nume}</p>
                {locationShort && (
                  <p className="text-[11px] text-[#9CA3AF] truncate hidden sm:block">{locationShort}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {statie.telefon && (
                <a href={`tel:${statie.telefon}`}
                  className="flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] px-3 py-2 text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors">
                  <Phone className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sună</span>
                </a>
              )}
              {whatsappNr && (
                <a href={`https://wa.me/${whatsappNr.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#25D366" }}>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.122 1.525 5.852L.057 23.99l6.305-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.373l-.36-.214-3.726.977.994-3.635-.235-.374A9.818 9.818 0 1112 21.818z" />
                  </svg>
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </header>

        {/* ── HERO ── */}
        <section className="relative overflow-hidden min-h-[260px] sm:min-h-[320px] flex items-end"
          style={bannerUrl
            ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)` }
          }>
          <div className="absolute inset-0" style={{ backgroundColor: bannerUrl ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.20)" }} />
          {!bannerUrl && (
            <>
              <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5" />
              <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5" />
            </>
          )}

          <div className="relative z-10 w-full max-w-3xl mx-auto px-4 py-10 sm:py-14">
            <div className="flex flex-col gap-3 sm:gap-4">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Stație ITP autorizată RAR
              </span>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                {statie.nume}
              </h1>

              <p className="text-sm sm:text-lg text-white/85 max-w-md">
                {tagline}
              </p>

              <div className="flex flex-wrap gap-2 mt-1">
                {locationShort && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs text-white font-medium backdrop-blur-sm">
                    <MapPin className="h-3.5 w-3.5" />{locationShort}
                  </span>
                )}
                {statie.nr_linii && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs text-white font-medium backdrop-blur-sm">
                    <Layers className="h-3.5 w-3.5" />{statie.nr_linii} {statie.nr_linii === 1 ? "linie" : "linii"} ITP
                  </span>
                )}
                {statie.durata_slot_minute && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs text-white font-medium backdrop-blur-sm">
                    <Clock className="h-3.5 w-3.5" />{statie.durata_slot_minute} min/inspecție
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3 mt-2">
                <a href="#programare"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                  style={{ color: accent }}>
                  Programează acum
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </a>
                {statie.telefon && (
                  <a href={`tel:${statie.telefon}`}
                    className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/50 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                    <Phone className="h-4 w-4" />
                    Sună acum
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTIONS (ordered) ── */}
        <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
          {sectiuniOrdine
            .map((sectionId) => sectionMap[sectionId])
            .filter(Boolean)}
        </div>

        {/* ── FOOTER ── */}
        <footer className="border-t border-[#E5E7EB] bg-white mt-4">
          <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={statie.nume}
                  className="h-7 w-7 rounded-lg object-cover border border-[#E5E7EB] shrink-0" />
              ) : (
                <div className="h-7 w-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0"
                  style={{ backgroundColor: accent }}>
                  {statie.nume.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-[#111318]">{statie.nume}</p>
                {locationShort && <p className="text-xs text-[#9CA3AF]">{locationShort}</p>}
              </div>
            </div>
            <p className="text-xs text-[#9CA3AF]">
              Powered by{" "}
              <Link href="/" className="font-semibold hover:text-[#374151] transition-colors">
                VELOS.RO
              </Link>
            </p>
          </div>
        </footer>
      </div>

      {/* Chatbot */}
      <SmartChatbot qa={chatbotQa} accent={accent} statieNume={statie.nume} />
    </>
  );
}
