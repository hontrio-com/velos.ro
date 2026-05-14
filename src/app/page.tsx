import LandingNavbar from "@/components/landing/navbar";
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
      <LandingNavbar />
      <LandingHero />
      <LandingFeatures />
      <LandingSmartPage />
      <LandingPricing />
      <LandingTestimonials />
      <LandingFaq />
      <LandingFooter />
    </div>
  );
}
