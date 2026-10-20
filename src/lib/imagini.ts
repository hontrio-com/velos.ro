import {
  POZA_CALITATE,
  POZA_LATURA_MAX,
  POZA_MAX_BYTES,
  THUMB_CALITATE,
  THUMB_LATURA_MAX,
} from "@/lib/poze-itp/shared";

/**
 * Comprimarea pozelor în browser, înainte de upload (doar client — folosește
 * document / canvas; apelează din handler-e, nu la randare). Orice intrare
 * (JPEG, PNG, HEIC pe Safari…) devine JPEG:
 *  - poza mare: latura maximă 2000 px, calitate 0.8;
 *  - miniatura: latura maximă 480 px, calitate 0.7, desenată din poza mare
 *    (micșorare în doi pași = miniatură mai clară). Miniatura e opțională.
 * Reencodarea prin canvas elimină metadatele EXIF, inclusiv GPS-ul (data
 * fotografierii se citește înainte, din fișierul original).
 * Comprimările rulează pe rând (coadă globală): două poze de 12 MP decodate
 * simultan pot epuiza memoria pe telefoanele modeste.
 */

const MESAJ_HEIC =
  "Formatul HEIC nu poate fi citit pe acest dispozitiv. Fă poza direct din aplicație sau setează camera pe „Cel mai compatibil” (JPG).";
/** Cât citim din fișier ca să găsim EXIF-ul: segmentul APP1 are cel mult 64 KB și stă la început. */
const EXIF_MAX_OCTETI = 128 * 1024;

export class EroareImagine extends Error {
  /**
   * Se repetă la orice nouă încercare pe acest dispozitiv (format, fișier gol / corupt, prea mare).
   * false = poate dispărea după o repornire a aplicației (memorie, canvas, decodare).
   */
  readonly definitiva: boolean;
  constructor(mesaj: string, definitiva = false) {
    super(mesaj);
    this.name = "EroareImagine";
    this.definitiva = definitiva;
  }
}

export interface PozaComprimata {
  full: Blob;
  thumb: Blob | null;
  latime: number;
  inaltime: number;
  /**
   * Momentul fotografierii (ms): data EXIF a pozei (JPEG), altfel file.lastModified
   * (pe iOS, pentru pozele din cameră, ≈ momentul capturii).
   */
  facutaLa: number | null;
}

interface SursaDecodata {
  sursa: CanvasImageSource;
  latime: number;
  inaltime: number;
  elibereaza: () => void;
}

function esteHeic(fisier: File): boolean {
  return /hei[cf]/i.test(fisier.type) || /\.hei[cf]$/i.test(fisier.name);
}

// ── Data fotografierii din EXIF (doar JPEG) ─────────────────────────────────────

function textAscii(dv: DataView, start: number, lungime: number): string {
  let s = "";
  for (let i = 0; i < lungime && start + i < dv.byteLength; i++) {
    const c = dv.getUint8(start + i);
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s;
}

/** Etichetele ASCII și LONG ale unui IFD TIFF (doar cele care încap în segment). */
function citesteIfd(dv: DataView, tiff: number, ifd: number, le: boolean, sfarsit: number) {
  const etichete = new Map<number, string | number>();
  const start = tiff + ifd;
  if (start + 2 > sfarsit) return etichete;
  const n = dv.getUint16(start, le);
  for (let i = 0; i < n; i++) {
    const e = start + 2 + i * 12;
    if (e + 12 > sfarsit) break;
    const eticheta = dv.getUint16(e, le);
    const tip = dv.getUint16(e + 2, le);
    const numar = dv.getUint32(e + 4, le);
    if (tip === 2) {
      // ASCII: în intrare dacă are cel mult 4 octeți, altfel la un offset față de antetul TIFF.
      const poz = numar <= 4 ? e + 8 : tiff + dv.getUint32(e + 8, le);
      if (poz + numar <= sfarsit) etichete.set(eticheta, textAscii(dv, poz, numar));
    } else if (tip === 4 || tip === 13) {
      etichete.set(eticheta, dv.getUint32(e + 8, le));
    }
  }
  return etichete;
}

/** „2026:10:19 09:10:00” (+ decalaj „+03:00”) → ms. Fără decalaj: ora locală a telefonului. */
function dataExifLaMs(data: unknown, decalaj: unknown): number | null {
  const m = typeof data === "string" ? /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(data) : null;
  if (!m) return null;
  const [an, luna, zi, ora, minut, secunda] = m.slice(1).map(Number);
  if (an < 2000 || luna < 1 || luna > 12 || zi < 1 || zi > 31 || ora > 23 || minut > 59 || secunda > 60) return null;
  const utc = Date.UTC(an, luna - 1, zi, ora, minut, secunda);
  if (new Date(utc).getUTCDate() !== zi) return null; // ex. 31 februarie
  const o = typeof decalaj === "string" ? /^([+-])(\d{2}):?(\d{2})$/.exec(decalaj.trim()) : null;
  if (o && Number(o[2]) <= 14 && Number(o[3]) <= 59) {
    return utc - (o[1] === "-" ? -1 : 1) * (Number(o[2]) * 60 + Number(o[3])) * 60_000;
  }
  return new Date(an, luna - 1, zi, ora, minut, secunda).getTime();
}

/**
 * DateTimeOriginal (0x9003), altfel DateTimeDigitized (0x9004), din IFD-ul Exif al
 * unui JPEG, cu OffsetTimeOriginal / OffsetTimeDigitized (0x9011 / 0x9012) dacă
 * există. NU folosim DateTime din IFD0 (0x0132): acela e momentul ultimei editări.
 * Orice structură neașteptată → null; nu aruncă niciodată.
 */
async function citesteDataExif(fisier: Blob): Promise<number | null> {
  try {
    const dv = new DataView(await fisier.slice(0, EXIF_MAX_OCTETI).arrayBuffer());
    if (dv.byteLength < 4 || dv.getUint16(0) !== 0xffd8) return null; // nu e JPEG
    let poz = 2;
    while (poz + 4 <= dv.byteLength) {
      const marker = dv.getUint16(poz);
      if (marker === 0xffff) {
        poz++; // octet de umplere
        continue;
      }
      // Începutul imaginii (SOS / EOI) sau un octet care nu e marker: fără EXIF.
      if ((marker & 0xff00) !== 0xff00 || marker === 0xffda || marker === 0xffd9) return null;
      const lungime = dv.getUint16(poz + 2);
      if (lungime < 2) return null;
      // APP1 cu semnătura „Exif\0\0”, urmată de antetul TIFF (II = little endian, MM = big endian).
      if (marker === 0xffe1 && poz + 10 <= dv.byteLength && dv.getUint32(poz + 4) === 0x45786966 && dv.getUint16(poz + 8) === 0) {
        const tiff = poz + 10;
        const sfarsit = Math.min(dv.byteLength, poz + 2 + lungime);
        if (tiff + 8 > sfarsit) return null;
        const ordine = dv.getUint16(tiff);
        if (ordine !== 0x4949 && ordine !== 0x4d4d) return null;
        const le = ordine === 0x4949;
        if (dv.getUint16(tiff + 2, le) !== 42) return null;
        const ifdExif = citesteIfd(dv, tiff, dv.getUint32(tiff + 4, le), le, sfarsit).get(0x8769);
        if (typeof ifdExif !== "number") return null;
        const exif = citesteIfd(dv, tiff, ifdExif, le, sfarsit);
        return dataExifLaMs(exif.get(0x9003), exif.get(0x9011)) ?? dataExifLaMs(exif.get(0x9004), exif.get(0x9012));
      }
      poz += 2 + lungime;
    }
    return null;
  } catch {
    return null;
  }
}

async function cuBitmap(fisier: File, optiuni?: ImageBitmapOptions): Promise<SursaDecodata> {
  const bmp = optiuni ? await createImageBitmap(fisier, optiuni) : await createImageBitmap(fisier);
  return { sursa: bmp, latime: bmp.width, inaltime: bmp.height, elibereaza: () => bmp.close() };
}

async function cuImg(fisier: File): Promise<SursaDecodata> {
  const url = URL.createObjectURL(fisier);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  try {
    await img.decode();
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
  return {
    sursa: img,
    latime: img.naturalWidth,
    inaltime: img.naturalHeight,
    elibereaza: () => URL.revokeObjectURL(url),
  };
}

/**
 * 1) createImageBitmap cu imageOrientation „from-image” (Safari 16+, Chrome 112+, Firefox 111+);
 * 2) <img> — aplică orientarea EXIF în toate browserele moderne, decodează HEIC pe Safari 17+;
 * 3) createImageBitmap fără opțiuni (ultima variantă; orientarea poate lipsi).
 */
async function decodeaza(fisier: File): Promise<SursaDecodata> {
  const areBitmap = typeof createImageBitmap === "function";
  if (areBitmap) {
    try {
      return await cuBitmap(fisier, { imageOrientation: "from-image" });
    } catch {
      /* încercăm varianta următoare */
    }
  }
  try {
    return await cuImg(fisier);
  } catch {
    /* încercăm varianta următoare */
  }
  if (areBitmap) {
    try {
      return await cuBitmap(fisier);
    } catch {
      /* cădem pe mesajul de eroare */
    }
  }
  // Un HEIC necitit nu devine citibil; altă decodare eșuată poate fi lipsă de memorie.
  throw new EroareImagine(esteHeic(fisier) ? MESAJ_HEIC : "Poza nu a putut fi citită.", esteHeic(fisier));
}

function deseneaza(sursa: CanvasImageSource, latime: number, inaltime: number, laturaMax: number) {
  const scara = Math.min(1, laturaMax / Math.max(latime, inaltime));
  const w = Math.max(1, Math.round(latime * scara));
  const h = Math.max(1, Math.round(inaltime * scara));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new EroareImagine("Poza nu a putut fi procesată pe acest dispozitiv.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff"; // PNG transparent → fundal alb, nu negru
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(sursa, 0, 0, w, h);
  return { canvas, latime: w, inaltime: h };
}

async function laJpeg(canvas: HTMLCanvasElement, calitate: number): Promise<Blob> {
  const blob = await new Promise<Blob | null>((rezolva) => canvas.toBlob(rezolva, "image/jpeg", calitate));
  // toBlob poate întoarce PNG dacă JPEG nu e suportat — refuzăm, serverul acceptă doar JPEG.
  if (!blob || blob.type !== "image/jpeg") {
    throw new EroareImagine("Poza nu a putut fi comprimată pe acest dispozitiv.");
  }
  return blob;
}

/** Eliberează memoria canvas-ului imediat (important pe iPhone). */
function elibereazaCanvas(canvas: HTMLCanvasElement | null | undefined) {
  if (!canvas) return;
  canvas.width = 0;
  canvas.height = 0;
}

async function comprima(fisier: File): Promise<PozaComprimata> {
  if (fisier.type && !fisier.type.startsWith("image/")) throw new EroareImagine("Fișierul ales nu este o imagine.", true);
  if (fisier.size === 0) throw new EroareImagine("Fișierul este gol.", true);

  // Data fotografierii, înainte de reencodare (canvas-ul elimină EXIF-ul).
  const dataExif = await citesteDataExif(fisier);

  // Lăsăm interfața să afișeze „Se procesează” înainte de decodarea (blocantă) a pozei.
  await new Promise((rezolva) => setTimeout(rezolva, 0));

  const dec = await decodeaza(fisier);
  let mare: ReturnType<typeof deseneaza> | null = null;
  let mica: ReturnType<typeof deseneaza> | null = null;
  try {
    if (!dec.latime || !dec.inaltime) throw new EroareImagine("Poza este goală sau coruptă.", true);

    mare = deseneaza(dec.sursa, dec.latime, dec.inaltime, POZA_LATURA_MAX);
    dec.elibereaza(); // bitmap-ul de 12 MP nu mai e necesar (apelul repetat din finally nu are efect)

    const full = await laJpeg(mare.canvas, POZA_CALITATE);
    if (full.size > POZA_MAX_BYTES) throw new EroareImagine("Poza este prea mare chiar și după comprimare.", true);

    let thumb: Blob | null = null;
    try {
      mica = deseneaza(mare.canvas, mare.latime, mare.inaltime, THUMB_LATURA_MAX);
      thumb = await laJpeg(mica.canvas, THUMB_CALITATE);
    } catch {
      thumb = null; // fără miniatură: interfața afișează poza mare
    }

    return {
      full,
      thumb,
      latime: mare.latime,
      inaltime: mare.inaltime,
      facutaLa:
        dataExif ?? (Number.isFinite(fisier.lastModified) && fisier.lastModified > 0 ? fisier.lastModified : null),
    };
  } finally {
    elibereazaCanvas(mica?.canvas);
    elibereazaCanvas(mare?.canvas);
    dec.elibereaza();
  }
}

let coadaComprimare: Promise<unknown> = Promise.resolve();

/** Comprimă o poză. Apelurile se execută pe rând, în ordinea în care au fost făcute. */
export function comprimaPoza(fisier: File): Promise<PozaComprimata> {
  const rezultat = coadaComprimare.then(() => comprima(fisier));
  coadaComprimare = rezultat.catch(() => undefined);
  return rezultat;
}
