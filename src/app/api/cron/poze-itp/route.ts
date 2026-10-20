import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { isR2Configured } from "@/lib/r2";
import { curataEvidentaPlafon, expiraPozeVechi, golesteCoadaR2 } from "@/lib/poze-itp/server";

// Cron zilnic (vercel.json): marchează pozele ITP mai vechi de 14 zile ca
// expirate (trigger-ul din migrația 013 le pune cheile în coadă), golește
// coada de obiecte R2 de șters și curăță evidența veche a plafonului zilnic de
// încărcare. Idempotent — o rulare dublă sau ratată nu strică nimic: marcarea
// filtrează sters_la IS NULL, iar ștergerea unei chei inexistente din R2 este
// un succes.

export const maxDuration = 300;

/** Buget de timp total (rămâne marjă față de maxDuration). */
const BUGET_MS = 240_000;

function autorizat(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  // Doar „Authorization: Bearer <CRON_SECRET>” (cum trimite Vercel Cron),
  // comparat în timp constant (hash-uri de lungime egală).
  const primit = createHash("sha256").update(request.headers.get("authorization") ?? "").digest();
  const asteptat = createHash("sha256").update(`Bearer ${secret}`).digest();
  return timingSafeEqual(primit, asteptat);
}

export async function GET(request: Request) {
  if (!autorizat(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const inceput = Date.now();
  const termen = inceput + BUGET_MS;

  // 1. Pozele expirate → marcate ca șterse (pe loturi). Lista le ascunde oricum
  //    imediat după expira_la, chiar dacă cron-ul întârzie.
  let expirare: { expirate: number; incompleta: boolean };
  try {
    expirare = await expiraPozeVechi(inceput + BUGET_MS / 2);
  } catch (e) {
    console.error("[CRON poze-itp] expirare:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "expirare esuata" }, { status: 500 });
  }

  // 2. Evidența plafonului zilnic de încărcare mai veche de 30 de zile. Best
  //    effort: o eroare se loghează (null în raport), rularea continuă.
  const plafonCuratat = await curataEvidentaPlafon();

  // 3. Coada → R2. Fără R2 configurat, cheile așteaptă în coadă.
  if (!isR2Configured()) {
    console.warn("[CRON poze-itp] R2 neconfigurat — coada nu a fost golita");
    return NextResponse.json({ ...expirare, plafonCuratat, coada: "r2_neconfigurat" });
  }

  try {
    const coada = await golesteCoadaR2(termen);
    const raport = {
      expirate: expirare.expirate,
      expirareIncompleta: expirare.incompleta,
      ...coada,
      plafonCuratat,
      durataMs: Date.now() - inceput,
    };
    console.log("[CRON poze-itp]", raport);
    return NextResponse.json(raport);
  } catch (e) {
    console.error("[CRON poze-itp] coada:", e instanceof Error ? e.message : e);
    return NextResponse.json({ expirate: expirare.expirate, error: "golire coada esuata" }, { status: 500 });
  }
}
