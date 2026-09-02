"use client";

import { useEffect } from "react";

/**
 * Plasa de siguranta pentru link-urile de resetare a parolei.
 *
 * Supabase accepta ca destinatie doar URL-urile din lista de "Redirect URLs" a
 * proiectului. Daca link-ul cere o adresa care nu e in lista (de exemplu
 * https://www.velos.ro/reset-password, cand doar https://velos.ro/... e permis),
 * Supabase ignora calea si trimite utilizatorul in radacina site-ului, cu
 * tokenurile in fragmentul de URL. Fara componenta asta, omul ajunge pe pagina
 * de prezentare si nu-si poate schimba parola.
 *
 * Aici detectam fragmentul de recuperare si il ducem pe pagina corecta,
 * pastrand tokenurile.
 */
export function RecoveryHashRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    const parametri = new URLSearchParams(hash.replace(/^#/, ""));
    const tip = parametri.get("type");
    const areToken = parametri.has("access_token") || parametri.has("token_hash");

    if (tip === "recovery" && areToken) {
      window.location.replace(`/reset-password${hash}`);
    }
  }, []);

  return null;
}
