"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { activeazaContul, opresteIncarcarileContului, reiaIncarcarileSalvate } from "@/lib/poze-itp/client";

/**
 * Reia pozele ITP rămase neîncărcate după ce telefonul a închis aplicația (sau
 * pagina a fost reîncărcată după o actualizare). Montată o singură dată, în
 * DashboardShell, pentru proprietar și angajat; nu randează nimic. Toast-urile vin
 * din coada de încărcare, ca la orice încărcare terminată cu sertarul închis.
 */
export function PozeItpReluare() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let activa = true;
    let dezabonare: (() => void) | null = null;
    void (async () => {
      try {
        const supabase = createClient();
        // Deconectare sau alt cont (și dintr-un alt tab): încărcările contului anterior se opresc
        // înainte ca noua sesiune să poată trimite cereri în numele lui. Nu aruncă: o eroare aici
        // ar întrerupe deconectarea.
        const { data: abonare } = supabase.auth.onAuthStateChange((eveniment, sesiune) => {
          try {
            if (eveniment === "SIGNED_OUT") opresteIncarcarileContului(null);
            else if (sesiune) {
              opresteIncarcarileContului(sesiune.user.id);
              // Conectare fără remontare (de ex. deconectare și reconectare dintr-un alt tab): contul
              // revine tabului, iar pozele noi au din nou copie locală. La montare se ocupă getSession.
              if (activa && eveniment !== "INITIAL_SESSION") activeazaContul(sesiune.user.id, queryClient);
            }
          } catch (e) {
            console.error("[PozeITP] sesiune:", e);
          }
        });
        dezabonare = () => abonare.subscription.unsubscribe(); // setată sincron, înaintea oricărui cleanup
        // Doar id-ul contului, din sesiunea păstrată în browser: fiecare cont își reia doar pozele lui.
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user.id;
        if (activa && userId) await reiaIncarcarileSalvate(userId, queryClient);
      } catch (e) {
        console.error("[PozeITP] reluare:", e);
      }
    })();
    return () => {
      activa = false;
      dezabonare?.();
    };
  }, [queryClient]);

  return null;
}
