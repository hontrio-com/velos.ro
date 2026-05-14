"use client";

import { useRouter, usePathname } from "next/navigation";
import { differenceInDays, parseISO } from "date-fns";
import { AlertTriangle, Clock, XCircle, ArrowRight, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SubscriptionStatus } from "@/lib/stripe";

interface TrialBannerProps {
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  plan: string;
}

export function TrialBanner({ subscriptionStatus, trialEndsAt, plan }: TrialBannerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (subscriptionStatus === "active") return null;
  // Don't show banner on the subscription page itself
  if (pathname === "/setari/abonament") return null;

  const daysLeft = trialEndsAt
    ? Math.max(0, differenceInDays(parseISO(trialEndsAt), new Date()))
    : 0;

  // past_due — payment failed
  if (subscriptionStatus === "past_due") {
    return (
      <div className="mb-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-4 py-3 flex items-center gap-3">
        <XCircle className="h-4 w-4 text-[#DC2626] shrink-0" />
        <p className="text-sm text-[#DC2626] flex-1">
          <strong>Plată eșuată.</strong> Actualizează metoda de plată pentru a păstra accesul.
        </p>
        <button
          onClick={() => router.push("/api/stripe/billing-portal")}
          className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-[#DC2626] hover:underline"
        >
          Actualizează <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // canceled
  if (subscriptionStatus === "canceled") {
    return (
      <div className="mb-4 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] px-4 py-3 flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 text-[#EA580C] shrink-0" />
        <p className="text-sm text-[#EA580C] flex-1">
          <strong>Abonament anulat.</strong> Reactivează pentru a continua să folosești platforma.
        </p>
        <button
          onClick={() => router.push("/setari/abonament")}
          className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-[#EA580C] hover:underline"
        >
          Reactivează <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // trial_expired
  if (subscriptionStatus === "trial_expired") {
    return (
      <div className="mb-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-4 py-3 flex items-center gap-3">
        <XCircle className="h-4 w-4 text-[#DC2626] shrink-0" />
        <p className="text-sm text-[#DC2626] flex-1">
          <strong>Trial expirat.</strong> Alege un plan pentru a continua să folosești platforma.
        </p>
        <button
          onClick={() => router.push("/setari/abonament")}
          className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] px-3 py-1.5 rounded-lg transition-colors"
        >
          Alege un plan <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // trial active
  if (subscriptionStatus === "trial") {
    const urgent = daysLeft <= 3;
    const warning = daysLeft <= 7;

    return (
      <div
        className={cn(
          "mb-4 rounded-xl border px-4 py-3 flex items-center gap-3",
          urgent
            ? "bg-[#FEF2F2] border-[#FECACA]"
            : warning
            ? "bg-[#FFF7ED] border-[#FED7AA]"
            : "bg-[#EFF6FF] border-[#BFDBFE]"
        )}
      >
        <Clock
          className={cn(
            "h-4 w-4 shrink-0",
            urgent ? "text-[#DC2626]" : warning ? "text-[#EA580C]" : "text-[#1877F2]"
          )}
        />
        <p
          className={cn(
            "text-sm flex-1",
            urgent ? "text-[#DC2626]" : warning ? "text-[#EA580C]" : "text-[#1E40AF]"
          )}
        >
          {daysLeft === 0 ? (
            <><strong>Ultimele ore din trial.</strong> Alege un plan ca să nu pierzi accesul.</>
          ) : daysLeft === 1 ? (
            <><strong>1 zi rămasă din trial.</strong> Alege un plan ca să nu pierzi accesul.</>
          ) : (
            <><strong>{daysLeft} zile ramase din trial.</strong> Testezi gratuit, alege un plan oricand.</>

          )}
        </p>
        <button
          onClick={() => router.push("/setari/abonament")}
          className={cn(
            "shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors",
            urgent || warning
              ? "text-white bg-[#1877F2] hover:bg-[#1565D8]"
              : "text-[#1877F2] hover:underline"
          )}
        >
          Alege un plan <ArrowRight className="h-3 w-3" />
        </button>
        {!urgent && (
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return null;
}
