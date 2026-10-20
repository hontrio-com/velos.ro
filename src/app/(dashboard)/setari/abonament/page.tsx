import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageTransition } from "@/components/layout/page-transition";
import { AbonamentClient } from "@/components/setari/abonament/abonament-client";
import type { SubscriptionStatus } from "@/lib/stripe";
import { fulfillSmsSessionAction } from "@/lib/actions/billing";
import { getInfoTrial } from "@/lib/sms-disponibil";

export const metadata: Metadata = { title: "Abonament" };

export default async function AbonamentPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; plan?: string; sms_success?: string; cantitate?: string; session_id?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { success, canceled, sms_success, session_id } = await searchParams;

  // Fallback fulfillment: credit SMS if webhook didn't fire (runs BEFORE profile fetch).
  // Bannerul de după plată se bazează pe rezultat (creditat / plată în curs), nu pe URL.
  const achizitieSms =
    sms_success && session_id
      ? await fulfillSmsSessionAction(session_id).catch((err) => {
          console.error(err);
          return null;
        })
      : null;

  // Fetch profile AFTER fulfillment so sms_credit reflects the updated value
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "plan, email, subscription_status, trial_expires_at, billing_cycle, subscription_ends_at, stripe_customer_id, sms_credit"
    )
    .eq("id", user.id)
    .single();

  const trialEndsAt = (profile as any)?.trial_expires_at as string | null;
  const subscriptionStatus = ((profile as any)?.subscription_status ?? "trial") as SubscriptionStatus;
  const currentPlan = ((profile as any)?.plan ?? "trial") as string;

  const effectiveStatus: SubscriptionStatus =
    currentPlan !== "trial" && subscriptionStatus === "trial"
      ? "active"
      : subscriptionStatus === "trial" && trialEndsAt && new Date(trialEndsAt) < new Date()
      ? "trial_expired"
      : subscriptionStatus;

  // Trial fără SMS incluse (conturi noi) — doar pentru texte; conturile vechi → false.
  const { trialFaraSms } =
    currentPlan === "trial" ? await getInfoTrial(user.id) : { trialFaraSms: false };

  return (
    <PageTransition>
      <div className="px-4 lg:px-6 py-4">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#111318]">Abonament</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Gestionează planul tău și facturarea
          </p>
        </div>
        <AbonamentClient
          currentPlan={(profile as any)?.plan ?? "trial"}
          subscriptionStatus={effectiveStatus}
          trialEndsAt={trialEndsAt}
          billingCycle={(profile as any)?.billing_cycle ?? "monthly"}
          subscriptionEndsAt={(profile as any)?.subscription_ends_at ?? null}
          hasStripeCustomer={!!((profile as any)?.stripe_customer_id)}
          email={profile?.email ?? user.email ?? ""}
          smsCredit={(profile as any)?.sms_credit ?? 0}
          successPlan={success ? ((profile as any)?.plan ?? null) : null}
          wasCanceled={!!canceled}
          smsSuccessCantitate={achizitieSms?.success ? (achizitieSms.cantitate ?? null) : null}
          smsAchizitieNeconfirmata={
            sms_success && !achizitieSms?.success
              ? achizitieSms?.pending ? "in_asteptare" : "neconfirmata"
              : null
          }
          trialFaraSms={trialFaraSms}
        />
      </div>
    </PageTransition>
  );
}
