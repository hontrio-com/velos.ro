import "server-only";

import { AwsClient, AwsV4Signer } from "aws4fetch";

/**
 * Cloudflare R2 (API compatibil S3), semnat cu aws4fetch — fetch + WebCrypto,
 * fără SDK-ul AWS (care adaugă checksum-uri CRC32 în URL-urile presemnate).
 *
 * Reguli de siguranță, aplicate AICI indiferent de apelant:
 *  - se lucrează DOAR cu chei de forma itp/<statie>/<programare>/<uuid>[_t].jpg;
 *    orice altă cheie aruncă eroare (fără traversări, fără alte „foldere”);
 *  - URL-urile presemnate sunt jetoane la purtător: nu se loghează, nu se
 *    salvează în baza de date, au durată scurtă;
 *  - stil path: https://<cont>[.eu].r2.cloudflarestorage.com/<bucket>/<cheie>.
 *
 * Mediu: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET,
 * R2_JURISDICTION ("eu" implicit, "default" pentru bucket fără jurisdicție).
 * Bucket-urile cu jurisdicție UE răspund DOAR pe endpoint-ul .eu.
 */

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const CHEIE_PERMISA = new RegExp(`^itp/${UUID}/${UUID}/${UUID}(_t)?\\.jpg$`);

const TIMEOUT_MS = 10_000;
/**
 * URL-urile GET se semnează pe ferestre de 5 minute: în aceeași fereastră URL-ul
 * e identic, deci browserul refolosește imaginile din cache. Dacă
 * scripts/verifica-r2.mjs raportează că R2 refuză un X-Amz-Date din trecut,
 * pune 0 aici (semnare la momentul cererii).
 */
const FEREASTRA_GET_SEC = 300;

interface ConfigR2 {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

let configCache: ConfigR2 | null | undefined;
let clientCache: AwsClient | null = null;
/** Cheile derivate SigV4 (pe zi) — refolosite între semnări. */
const cacheSemnare = new Map<string, ArrayBuffer>();

function citesteConfig(): ConfigR2 | null {
  if (configCache !== undefined) return configCache;

  const accountId = (process.env.R2_ACCOUNT_ID ?? "").trim().toLowerCase();
  const accessKeyId = (process.env.R2_ACCESS_KEY_ID ?? "").trim();
  const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY ?? "").trim();
  const bucket = (process.env.R2_BUCKET ?? "").trim();
  const jurisdictie = ((process.env.R2_JURISDICTION ?? "").trim() || "eu").toLowerCase();

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    configCache = null;
    return null;
  }

  if (
    !/^[0-9a-f]{32}$/.test(accountId) ||
    !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket) ||
    (jurisdictie !== "eu" && jurisdictie !== "default")
  ) {
    console.error("[R2] Configurație invalidă: verifică R2_ACCOUNT_ID, R2_BUCKET și R2_JURISDICTION");
    configCache = null;
    return null;
  }

  const host =
    jurisdictie === "eu"
      ? `${accountId}.eu.r2.cloudflarestorage.com`
      : `${accountId}.r2.cloudflarestorage.com`;

  configCache = { endpoint: `https://${host}`, bucket, accessKeyId, secretAccessKey };
  return configCache;
}

/** true dacă toate variabilele R2 sunt setate și valide. */
export function isR2Configured(): boolean {
  return citesteConfig() !== null;
}

function config(): ConfigR2 {
  const c = citesteConfig();
  if (!c) throw new Error("R2 nu este configurat");
  return c;
}

function client(): AwsClient {
  if (!clientCache) {
    const c = config();
    clientCache = new AwsClient({
      accessKeyId: c.accessKeyId,
      secretAccessKey: c.secretAccessKey,
      service: "s3",
      region: "auto",
      cache: cacheSemnare,
      // aws4fetch reîncearcă doar la 5xx/429; implicit ar face 10 încercări (zeci de secunde).
      retries: 2,
      initRetryMs: 200,
    });
  }
  return clientCache;
}

/** URL-ul obiectului — refuză orice cheie care nu e o poză ITP. */
function urlObiect(cheie: string): URL {
  if (!CHEIE_PERMISA.test(cheie)) throw new Error("Cheie R2 nepermisă");
  const c = config();
  return new URL(`${c.endpoint}/${c.bucket}/${cheie}`);
}

/** Formatul de dată SigV4 (yyyyMMddTHHmmssZ). */
function dataAmz(ms: number): string {
  return new Date(ms).toISOString().replace(/[:-]|\.\d{3}/g, "");
}

/**
 * URL presemnat pentru PUT direct din browser. Semnăm și Content-Type, și
 * Content-Length: R2 refuză (403) un corp de altă mărime sau alt tip decât cel
 * declarat la pregătire, deci nimeni nu poate urca 5 GB pe un URL de 1 MB
 * (de confirmat o dată cu scripts/verifica-r2.mjs).
 */
export async function presignPut(
  cheie: string,
  opt: { contentType: "image/jpeg"; contentLength: number; expiresSec?: number }
): Promise<string> {
  if (!Number.isInteger(opt.contentLength) || opt.contentLength < 1) {
    throw new Error("Mărime invalidă");
  }
  const c = config();
  const url = urlObiect(cheie);
  url.searchParams.set("X-Amz-Expires", String(opt.expiresSec ?? 600));

  const semnat = await new AwsV4Signer({
    method: "PUT",
    url: url.toString(),
    headers: {
      "content-type": opt.contentType,
      "content-length": String(opt.contentLength),
    },
    accessKeyId: c.accessKeyId,
    secretAccessKey: c.secretAccessKey,
    service: "s3",
    region: "auto",
    cache: cacheSemnare,
    signQuery: true,
    // fără allHeaders, aws4fetch NU semnează content-type / content-length
    allHeaders: true,
  }).sign();

  return semnat.url.toString();
}

/**
 * URL presemnat pentru GET (afișare / descărcare). Valabil CEL PUȚIN
 * `expiresSec` secunde (cel mult expiresSec + 5 min), pentru că momentul
 * semnării se rotunjește la fereastra de 5 minute — astfel o reîncărcare a
 * listei nu schimbă URL-urile și miniaturile nu se descarcă din nou.
 */
export async function presignGet(cheie: string, opt: { expiresSec?: number } = {}): Promise<string> {
  const c = config();
  const url = urlObiect(cheie);
  const pasMs = FEREASTRA_GET_SEC * 1000;
  const acum = Date.now();
  const inceput = pasMs > 0 ? Math.floor(acum / pasMs) * pasMs : acum;
  url.searchParams.set("X-Amz-Expires", String((opt.expiresSec ?? 900) + FEREASTRA_GET_SEC));

  const semnat = await new AwsV4Signer({
    method: "GET",
    url: url.toString(),
    accessKeyId: c.accessKeyId,
    secretAccessKey: c.secretAccessKey,
    service: "s3",
    region: "auto",
    cache: cacheSemnare,
    signQuery: true,
    datetime: dataAmz(inceput),
  }).sign();

  return semnat.url.toString();
}

export interface InfoObiect {
  marime: number;
  tip: string | null;
  /** Primii (cel mult) 16 octeți — pentru verificarea semnăturii JPEG. */
  inceput: Uint8Array;
  /** Last-Modified (ms) = momentul urcării; null dacă lipsește sau nu se poate citi. */
  modificatLa: number | null;
}

/**
 * Inspectează un obiect cu un GET parțial (Range: bytes=0-15): mărimea totală
 * (din Content-Range), Content-Type, Last-Modified și primii octeți. Același
 * cost ca un HEAD (operație clasa B), dar permite și verificarea conținutului.
 *
 * Întoarce null dacă obiectul NU există (404 NoSuchKey). Aruncă la erori
 * tranzitorii (rețea, timeout, 5xx) și la un 404 cu alt cod (ex. NoSuchBucket =
 * bucket / jurisdicție greșite) — apelantul nu trebuie să trateze asta ca
 * „obiect lipsă” sau „obiect invalid”.
 */
export async function inspecteazaObiect(cheie: string): Promise<InfoObiect | null> {
  const res = await client().fetch(urlObiect(cheie).toString(), {
    method: "GET",
    headers: { Range: "bytes=0-15" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (res.status === 404) {
    const cod = await codEroareR2(res);
    if (cod === null || cod === "NoSuchKey") return null;
    throw new Error(`R2 GET 404 ${cod}`);
  }
  const modificatLa = dataModificarii(res);
  if (res.status === 416) {
    // Range nesatisfăcut = obiect gol
    await res.body?.cancel().catch(() => {});
    return { marime: 0, tip: res.headers.get("content-type"), inceput: new Uint8Array(0), modificatLa };
  }
  if (res.status !== 206 && res.status !== 200) {
    await res.body?.cancel().catch(() => {});
    throw new Error(`R2 GET ${res.status}`);
  }

  const marime =
    res.status === 206
      ? Number(/\/(\d+)\s*$/.exec(res.headers.get("content-range") ?? "")?.[1] ?? NaN)
      : Number(res.headers.get("content-length") ?? NaN);
  const inceput = await citestePrimiiOcteti(res, 16);

  if (!Number.isFinite(marime) || marime < 0) throw new Error("R2: mărime necunoscută");
  return { marime, tip: res.headers.get("content-type"), inceput, modificatLa };
}

/** Last-Modified în ms; null dacă lipsește sau nu se poate citi (apelantul nu refuză pe baza lui). */
function dataModificarii(res: Response): number | null {
  const ms = Date.parse(res.headers.get("last-modified") ?? "");
  return Number.isFinite(ms) ? ms : null;
}

/** Codul de eroare S3 din corpul XML (<Code>NoSuchKey</Code>) sau null. Citește cel mult 4 KB. */
async function codEroareR2(res: Response): Promise<string | null> {
  const octeti = await citestePrimiiOcteti(res, 4096).catch(() => new Uint8Array(0));
  return /<Code>([^<]{1,100})<\/Code>/.exec(new TextDecoder().decode(octeti))?.[1].trim() || null;
}

async function citestePrimiiOcteti(res: Response, n: number): Promise<Uint8Array> {
  if (!res.body) return new Uint8Array(0);
  const reader = res.body.getReader();
  const rezultat = new Uint8Array(n);
  let citit = 0;
  try {
    while (citit < n) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      const bucata = value.subarray(0, n - citit);
      rezultat.set(bucata, citit);
      citit += bucata.length;
    }
  } finally {
    // Dacă serverul a ignorat Range (200), nu descărcăm restul obiectului.
    await reader.cancel().catch(() => {});
  }
  return rezultat.subarray(0, citit);
}

/**
 * Șterge un obiect. Ștergerea unei chei inexistente este un succes (idempotent):
 * R2 răspunde 204, iar un 404 NoSuchKey e tratat la fel. Orice alt răspuns
 * aruncă — inclusiv 404 NoSuchBucket (bucket / jurisdicție greșite), ca cheia să
 * rămână în coadă, cu eroarea notată, în loc să fie scoasă ca „ștearsă”.
 */
export async function deleteObject(cheie: string): Promise<void> {
  const res = await client().fetch(urlObiect(cheie).toString(), {
    method: "DELETE",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 204 || res.status === 200) {
    await res.body?.cancel().catch(() => {});
    return;
  }
  const cod = await codEroareR2(res);
  if (res.status === 404 && cod === "NoSuchKey") return;
  throw new Error(`R2 DELETE ${res.status}${cod ? ` ${cod}` : ""}`);
}

/**
 * Șterge mai multe obiecte, câte unul (DELETE simplu: gratuit, fără anteturile
 * de checksum ale DeleteObjects), cu `concurenta` cereri în paralel. Nu aruncă.
 * Cu `opreLa` (ms, ca Date.now()), nu mai începe chei noi după acest moment:
 * cheile neîncercate nu apar în niciuna dintre liste.
 */
export async function deleteObjects(
  chei: string[],
  concurenta = 8,
  opreLa?: number
): Promise<{ sterse: string[]; esuate: { cheie: string; eroare: string }[] }> {
  const unice = [...new Set(chei)];
  const sterse: string[] = [];
  const esuate: { cheie: string; eroare: string }[] = [];
  let urmator = 0;

  async function lucrator() {
    while (urmator < unice.length && (opreLa === undefined || Date.now() < opreLa)) {
      const cheie = unice[urmator++];
      try {
        await deleteObject(cheie);
        sterse.push(cheie);
      } catch (e) {
        esuate.push({ cheie, eroare: e instanceof Error ? e.message : String(e) });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurenta, unice.length) }, lucrator));
  return { sterse, esuate };
}
