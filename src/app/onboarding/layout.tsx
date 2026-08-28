import type { Metadata } from "next";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { getImpersonare } from "@/lib/impersonation";

export const metadata: Metadata = { title: "Configurare cont — ITP CRM" };

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const impersonare = await getImpersonare();

  return (
    <>
      {impersonare && (
        <ImpersonationBanner
          targetEmail={impersonare.target_email}
          targetName={impersonare.target_name}
          adminEmail={impersonare.admin_email}
          expiresAt={impersonare.expires_at}
        />
      )}
      {children}
    </>
  );
}
