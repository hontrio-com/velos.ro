// Tipuri, texte și formatări pentru SMS-urile disponibile și trialul nou
// (6 luni, fără SMS incluse — migrația 012). Fără importuri de server: se
// folosește și în componente client, și în src/lib/sms.ts.

/**
 * SMS-urile pe care le poate trimite ACUM contul care plătește SMS-urile unei
 * stații (mereu proprietarul — angajații consumă din contul owner-ului).
 */
export interface SmsDisponibil {
  /** SMS-uri incluse consumate în perioada curentă (get_sms_quota). 0 pentru trialul nou. */
  trimise: number;
  /** SMS-uri incluse în plan pentru perioada curentă. 0 pentru trialul nou. */
  limita: number;
  /** SMS-uri incluse rămase. 0 pentru trialul nou. */
  ramase: number;
  /** Credit SMS cumpărat (profiles.sms_credit) — nu expiră. */
  credit: number;
  /** Incluse rămase + credit: câte SMS-uri mai pot pleca acum. */
  totalDisponibil: number;
  /** Cont din trialul nou (marcaj trial_fara_sms + plan „trial") — fără SMS incluse. */
  trialFaraSms: boolean;
  /** false dacă get_sms_quota nu a întors nimic (widget-ul vechi nu se afișa atunci). */
  quotaCitita: boolean;
  plan: string;
  subscriptionStatus: string;
  trialExpiresAt: string | null;
}

/** Prețul afișat al unui SMS cumpărat (același ca în CumparaSmsModal). */
export const PRET_SMS_AFISAT = "0,05 €";

/** Sub acest credit, conturile din trialul nou văd avertismentul „credit scăzut". */
export const PRAG_CREDIT_SCAZUT = 20;

/** Eroarea întoarsă de sendSms când un cont din trialul nou nu mai are niciun SMS. */
export const MESAJ_FARA_SMS_TRIAL =
  "Nu ai SMS-uri disponibile. Perioada de probă nu include SMS-uri — cumpără credite SMS din platformă.";

/** Aceeași situație, dar contul nu mai e în perioada de probă (ex. abonament anulat). */
export const MESAJ_FARA_SMS_PLAN =
  "Nu ai SMS-uri disponibile. Planul tău actual nu include SMS-uri — cumpără credite SMS din platformă sau alege un plan.";

/** Cron (doar conturile din trialul nou): stația are „Remindere SMS" oprit din setări. */
export const MESAJ_REMINDERE_OPRITE_SETARI = "Remindere SMS oprite din setările stației.";

/** Cron (doar conturile din trialul nou): perioada de probă s-a încheiat, fără plan ales. */
export const MESAJ_REMINDERE_TRIAL_EXPIRAT =
  "Perioada de probă s-a încheiat — reminderele automate sunt oprite până alegi un plan.";

// Numeralele românești cer „de" de la 20 în sus (20 de zile, 182 de zile),
// dar nu și pentru 101–119 (101 zile).
function cuDe(n: number): boolean {
  const r = Math.abs(n) % 100;
  return n !== 0 && (r === 0 || r >= 20);
}

/** 1 reminder · 5 remindere · 20 de remindere · 1.000 de remindere */
export function numarText(n: number, singular: string, plural: string): string {
  if (n === 1) return `1 ${singular}`;
  const nr = n.toLocaleString("ro-RO");
  return cuDe(n) ? `${nr} de ${plural}` : `${nr} ${plural}`;
}

/** 1 SMS · 5 SMS-uri · 20 de SMS-uri */
export function smsText(n: number): string {
  return numarText(n, "SMS", "SMS-uri");
}

/** 1 zi · 5 zile · 182 de zile */
export function zileText(n: number): string {
  return numarText(n, "zi", "zile");
}

/** „19 aprilie 2027" — fus orar fix, ca serverul și browserul să afișeze la fel. */
export function dataLungaRo(iso: string): string {
  return new Date(iso).toLocaleDateString("ro-RO", {
    timeZone: "Europe/Bucharest",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
