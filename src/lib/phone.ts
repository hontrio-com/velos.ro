import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/min";

/**
 * Numere de telefon — validare si normalizare pentru orice tara.
 *
 * Formatul de STOCARE ales:
 *   - numerele romanesti raman in forma locala `07XXXXXXXX`, ca sa fie compatibile
 *     cu cele cateva mii de randuri existente in baza si cu cautarea/deduplicarea;
 *   - orice alt numar se stocheaza in E.164 cu prefix de tara: `+447487629057`.
 *
 * La trimiterea catre SMSO se foloseste intotdeauna E.164 (`telefonE164`).
 */

export const TARA_IMPLICITA: CountryCode = "RO";

/** Tarile propuse in interfata; restul se pot introduce direct cu prefix international. */
export const TARI_UZUALE: { cod: CountryCode; nume: string; prefix: string }[] = [
  { cod: "RO", nume: "România", prefix: "+40" },
  { cod: "MD", nume: "Republica Moldova", prefix: "+373" },
  { cod: "IT", nume: "Italia", prefix: "+39" },
  { cod: "ES", nume: "Spania", prefix: "+34" },
  { cod: "DE", nume: "Germania", prefix: "+49" },
  { cod: "GB", nume: "Marea Britanie", prefix: "+44" },
  { cod: "FR", nume: "Franța", prefix: "+33" },
  { cod: "AT", nume: "Austria", prefix: "+43" },
  { cod: "BE", nume: "Belgia", prefix: "+32" },
  { cod: "NL", nume: "Olanda", prefix: "+31" },
  { cod: "HU", nume: "Ungaria", prefix: "+36" },
  { cod: "BG", nume: "Bulgaria", prefix: "+359" },
  { cod: "GR", nume: "Grecia", prefix: "+30" },
  { cod: "PT", nume: "Portugalia", prefix: "+351" },
];

function parseaza(input: string, taraImplicita: CountryCode = TARA_IMPLICITA) {
  const brut = (input ?? "").trim();
  if (!brut) return null;

  // 0040... / 00 44... -> +40... / +44...
  const curatat = brut.replace(/^00/, "+");

  // Fara prefix international: interpretam in tara implicita.
  const parsat = parsePhoneNumberFromString(curatat, taraImplicita);
  return parsat && parsat.isValid() ? parsat : null;
}

/** true daca numarul este valid (in tara implicita sau cu prefix international). */
export function esteTelefonValid(input: string, taraImplicita: CountryCode = TARA_IMPLICITA): boolean {
  return parseaza(input, taraImplicita) !== null;
}

/**
 * Forma de stocare: numerele RO ca `07XXXXXXXX`, restul E.164.
 * Returneaza null daca numarul nu este valid.
 */
export function normalizeazaTelefon(input: string, taraImplicita: CountryCode = TARA_IMPLICITA): string | null {
  const p = parseaza(input, taraImplicita);
  if (!p) return null;
  if (p.country === "RO") return p.nationalNumber.toString().replace(/^/, "0");
  return p.number; // E.164, ex. +447487629057
}

/** Forma pentru SMSO / orice gateway: intotdeauna E.164. Null daca numarul e invalid. */
export function telefonE164(input: string, taraImplicita: CountryCode = TARA_IMPLICITA): string | null {
  const p = parseaza(input, taraImplicita);
  return p ? p.number : null;
}

/** Afisare prietenoasa: national pentru RO, international pentru restul. */
export function formateazaTelefonAfisare(input: string, taraImplicita: CountryCode = TARA_IMPLICITA): string {
  const p = parseaza(input, taraImplicita);
  if (!p) return input;
  return p.country === TARA_IMPLICITA ? p.formatNational() : p.formatInternational();
}

/** Codul de tara detectat (RO, GB, IT...), sau undefined daca nu se poate determina. */
export function taraTelefon(input: string, taraImplicita: CountryCode = TARA_IMPLICITA): CountryCode | undefined {
  return parseaza(input, taraImplicita)?.country;
}

/** true daca numarul este dintr-o alta tara decat cea implicita — util pentru avertizari de cost SMS. */
export function esteInternational(input: string, taraImplicita: CountryCode = TARA_IMPLICITA): boolean {
  const tara = taraTelefon(input, taraImplicita);
  return !!tara && tara !== taraImplicita;
}
