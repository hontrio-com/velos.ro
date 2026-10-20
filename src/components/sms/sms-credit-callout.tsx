"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSmsDisponibil } from "@/hooks/use-sms-disponibil";
import { useCumparaSmsStore } from "@/stores/cumpara-sms-store";
import { getRemindereOpriteAction } from "@/lib/actions/sms-disponibil";
import {
  MESAJ_REMINDERE_TRIAL_EXPIRAT,
  PRAG_CREDIT_SCAZUT,
  PRET_SMS_AFISAT,
  smsText,
} from "@/lib/sms-disponibil-shared";

/**
 * Pagina Remindere, doar pentru conturile fără SMS incluse (trialul nou): explică
 * de ce reminderele nu pleacă fără credit și duce direct la cumpărare. Când cron-ul
 * le oprește oricât credit ar fi (perioada de probă s-a încheiat sau „Remindere SMS"
 * e oprit din setările stației), spune doar asta, fără buton de cumpărare.
 * Conturile existente nu văd nimic.
 * `statieId` = stația afișată de pagină (comutatorul „Remindere SMS" e al ei).
 * Obligatoriu: fără el comutatorul nu s-ar citi, iar pagina ar promite „cumpără
 * și pleacă" unei stații cu reminderele oprite.
 */
export function SmsCreditCallout({ statieId }: { statieId: string }) {
  const { data: sms } = useSmsDisponibil();
  const poateCumpara = useCumparaSmsStore((s) => s.disponibil);
  const deschide = useCumparaSmsStore((s) => s.deschide);

  // Aceeași regulă ca în cron: perioada de probă s-a încheiat fără plan ales =>
  // reminderele automate sunt oprite, oricât credit ar avea stația.
  const trialIncheiat =
    sms?.trialFaraSms === true &&
    (sms.subscriptionStatus === "trial_expired" ||
      (sms.subscriptionStatus === "trial" && !!sms.trialExpiresAt && new Date(sms.trialExpiresAt) < new Date()));

  // „Remindere SMS" e o setare a stației afișate, nu a contului: cerere proprie,
  // cu id-ul stației în cheie (obiectul SMS e același pentru toate stațiile
  // owner-ului și nu se reîncarcă la schimbarea stației din bara laterală).
  // Doar pentru trialul nou — conturile existente nu fac nicio cerere în plus.
  const { data: remindereOprite, isLoading: seCitesteComutatorul } = useQuery({
    queryKey: ["remindere-oprite", statieId],
    queryFn: () => getRemindereOpriteAction(statieId),
    enabled: !!statieId && sms?.trialFaraSms === true && !trialIncheiat,
    // Comutatorul se schimbă din Setări (adesea din alt tab): nu se păstrează după
    // ce pagina se închide și se recitește la revenirea în tab.
    gcTime: 0,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  if (!sms?.trialFaraSms) return null;

  if (trialIncheiat) {
    return (
      <div className="rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 bg-[#FEF2F2] border-[#FECACA]">
        <AlertCircle className="h-4 w-4 shrink-0 hidden sm:block text-[#DC2626]" />
        <p className="flex-1 min-w-0 text-sm font-semibold text-[#991B1B]">
          {poateCumpara
            ? MESAJ_REMINDERE_TRIAL_EXPIRAT
            : "Perioada de probă s-a încheiat — reminderele automate sunt oprite până când proprietarul stației alege un plan."}
        </p>
      </div>
    );
  }

  // Până se știe comutatorul stației nu afișăm nimic, ca să nu promitem „cumpără
  // și pleacă" unei stații cu reminderele oprite.
  if (seCitesteComutatorul) return null;

  // „Remindere SMS" oprit din setările stației: cron-ul anulează reminderele automate.
  if (remindereOprite) {
    return (
      <div className="rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 bg-[#FFF7ED] border-[#FED7AA]">
        <AlertCircle className="h-4 w-4 shrink-0 hidden sm:block text-[#EA580C]" />
        <p className="flex-1 min-w-0 text-sm font-semibold text-[#9A3412]">
          {poateCumpara
            ? "Reminderele automate sunt oprite din setările stației („Remindere SMS”)."
            : "Reminderele automate sunt oprite din setările stației („Remindere SMS”). Roagă proprietarul stației să le pornească."}
        </p>
      </div>
    );
  }

  if (sms.credit >= PRAG_CREDIT_SCAZUT) return null;

  const faraCredit = sms.credit <= 0;
  const motiv =
    sms.subscriptionStatus === "trial"
      ? "Perioada de probă nu include SMS-uri."
      : "Planul actual nu include SMS-uri.";

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3",
        faraCredit ? "bg-[#FEF2F2] border-[#FECACA]" : "bg-[#FFF7ED] border-[#FED7AA]"
      )}
    >
      <AlertCircle
        className={cn("h-4 w-4 shrink-0 hidden sm:block", faraCredit ? "text-[#DC2626]" : "text-[#EA580C]")}
      />
      <div className="flex-1 min-w-0 text-sm">
        {faraCredit ? (
          <>
            <p className="font-semibold text-[#991B1B]">
              {poateCumpara
                ? "Reminderele SMS nu pot fi trimise: nu ai credit SMS."
                : "Reminderele SMS nu pot fi trimise: stația nu are credit SMS."}
            </p>
            <p className="text-[#B91C1C] mt-0.5">
              {motiv}{" "}
              {poateCumpara
                ? `Cumpără un pachet și reminderele pleacă automat către clienți (${PRET_SMS_AFISAT}/SMS, creditul nu expiră).`
                : "Roagă proprietarul stației să cumpere SMS-uri din platformă."}
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-[#9A3412]">
              {poateCumpara ? "Mai ai doar" : "Stația mai are doar"} {smsText(sms.credit)} în credit.
            </p>
            <p className="text-[#C2410C] mt-0.5">
              Când creditul ajunge la zero, reminderele nu mai pot fi trimise. {motiv}
            </p>
          </>
        )}
      </div>
      {poateCumpara && (
        <Button size="sm" onClick={deschide} className="gap-1.5 shrink-0 self-start sm:self-auto">
          <ShoppingCart className="h-3.5 w-3.5" />
          Cumpără SMS-uri
        </Button>
      )}
    </div>
  );
}
