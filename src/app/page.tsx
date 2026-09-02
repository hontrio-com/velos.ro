import LandingNavbar from "@/components/landing/navbar";
import { RecoveryHashRedirect } from "@/components/auth/recovery-hash-redirect";
import LandingHero from "@/components/landing/hero";
import LandingFeatures from "@/components/landing/features";
import LandingSmartPage from "@/components/landing/smart-page-section";
import LandingPricing from "@/components/landing/pricing";
import LandingTestimonials from "@/components/landing/testimonials";
import LandingFaq from "@/components/landing/faq";
import LandingFooter from "@/components/landing/footer";

export const metadata = {
  title: "Velos - Platforma CRM pentru stații ITP din România",
  description:
    "Trimite automat SMS-uri de reamintire clienților tăi înainte de expirarea ITP-ului. Programări online, CRM complet, rapoarte detaliate. Încearcă 15 zile gratuit.",
};

export default function LandingPage() {
  return (
    <div className="bg-white">
      <RecoveryHashRedirect />
      <LandingNavbar />
      <LandingHero />
      <LandingFeatures />
      <LandingSmartPage />
      <LandingPricing />
      <LandingTestimonials />
      <LandingFaq />
      <LandingFooter />

      {/* Sticky CTA bar — mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white/90 backdrop-blur-md border-t border-[#E5E7EB] sm:hidden">
        <a
          href="https://wa.me/40757941553"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-sm"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.862L.057 23.387a.75.75 0 0 0 .916.948l5.656-1.453A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.717 9.717 0 0 1-4.952-1.355l-.355-.213-3.682.946.98-3.579-.233-.368A9.715 9.715 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
          </svg>
          WhatsApp
        </a>
        <a
          href="tel:0757941553"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-4 py-3 text-sm font-semibold text-white shadow-sm"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0">
            <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
          Sună acum
        </a>
      </div>
    </div>
  );
}
