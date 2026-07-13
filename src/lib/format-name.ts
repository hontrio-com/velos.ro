/**
 * Normalizează un nume de persoană la „Title Case” românesc:
 * fiecare cuvânt începe cu majusculă, restul litere mici.
 * Tratează spații multiple, cratime și apostrofuri.
 *
 *   capitalizeName("robert alexandru")  => "Robert Alexandru"
 *   capitalizeName("ROBERT")            => "Robert"
 *   capitalizeName("ana-maria pop")     => "Ana-Maria Pop"
 */
export function capitalizeName(input?: string | null): string {
  if (!input) return "";
  return input
    .trim()
    .replace(/\s+/g, " ")
    // fiecare secvență de litere (cu diacritice/apostrof) devine Majusculă + rest minuscule
    .replace(
      /[\p{L}\p{M}'’]+/gu,
      (word) =>
        word.charAt(0).toLocaleUpperCase("ro-RO") +
        word.slice(1).toLocaleLowerCase("ro-RO")
    );
}

/** La fel ca `capitalizeName`, dar întoarce `null` pentru valori goale (util pentru coloane nullable). */
export function capitalizeNameOrNull(input?: string | null): string | null {
  const v = capitalizeName(input);
  return v.length > 0 ? v : null;
}
