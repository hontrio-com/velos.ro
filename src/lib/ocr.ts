"use client";

// Runs entirely in-browser via Tesseract.js — no API key, no cost.

export interface OcrResult {
  dataExpirare: string | null; // YYYY-MM-DD
  dataDocument: string | null; // YYYY-MM-DD
  rawText: string;
  confidence: number;
}

// Romanian month names → number
const RO_MONTHS: Record<string, string> = {
  ianuarie: "01", februar: "02", martie: "03", aprilie: "04",
  mai: "05", iunie: "06", iulie: "07", august: "08",
  septembrie: "09", octombrie: "10", noiembrie: "11", decembrie: "12",
  ian: "01", feb: "02", mar: "03", apr: "04",
  iun: "06", iul: "07", aug: "08", sep: "09", oct: "10", noi: "11", dec: "12",
};

function parseDate(raw: string): string | null {
  raw = raw.trim();

  // dd.MM.yyyy or dd/MM/yyyy or dd-MM-yyyy
  const numeric = raw.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/);
  if (numeric) {
    const [, d, m, y] = numeric;
    const mm = m.padStart(2, "0");
    const dd = d.padStart(2, "0");
    const year = parseInt(y);
    if (year >= 2000 && year <= 2100 && parseInt(mm) >= 1 && parseInt(mm) <= 12) {
      return `${y}-${mm}-${dd}`;
    }
  }

  // dd MonthName yyyy (e.g. "15 martie 2025")
  const textual = raw.match(/(\d{1,2})\s+([a-zăâîșț]+)\s+(\d{4})/i);
  if (textual) {
    const [, d, monthRaw, y] = textual;
    const m = RO_MONTHS[monthRaw.toLowerCase()];
    if (m) {
      return `${y}-${m}-${d.padStart(2, "0")}`;
    }
  }

  return null;
}

// Keywords that appear near expiry dates in Romanian documents
const EXPIRY_KEYWORDS = [
  "valabil până la", "valabila pana la", "valabil pana la",
  "data expirarii", "data expirării", "expira la", "expiră la",
  "valabilitate:", "valabil:", "valabilă până", "valabila pana",
  "data scadentei", "data scadenței",
];

// Keywords that appear near document issuance dates
const ISSUE_KEYWORDS = [
  "data emiterii", "data eliberarii", "data eliberării",
  "emis la", "emis:", "data:", "eliberat la", "data inspectiei",
  "data inspecției",
];

function findDateNear(text: string, keywords: string[]): string | null {
  const lower = text.toLowerCase();

  for (const kw of keywords) {
    const idx = lower.indexOf(kw);
    if (idx === -1) continue;

    // Look in a window of 60 chars after the keyword
    const window = text.slice(idx, idx + 80);

    // Try to find date pattern in window
    const numeric = window.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/);
    if (numeric) {
      const parsed = parseDate(numeric[0]);
      if (parsed) return parsed;
    }

    const textual = window.match(/(\d{1,2})\s+([a-zăâîșț]+)\s+(\d{4})/i);
    if (textual) {
      const parsed = parseDate(textual[0]);
      if (parsed) return parsed;
    }
  }

  return null;
}

function extractAllDates(text: string): string[] {
  const results: string[] = [];
  const lower = text.toLowerCase();

  // Find all numeric dates
  const numericRegex = /(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/g;
  let m;
  while ((m = numericRegex.exec(text)) !== null) {
    const parsed = parseDate(m[0]);
    if (parsed && !results.includes(parsed)) results.push(parsed);
  }

  // Find all textual dates
  const textualRegex = /(\d{1,2})\s+([a-zăâîșț]+)\s+(\d{4})/gi;
  while ((m = textualRegex.exec(text)) !== null) {
    const parsed = parseDate(m[0]);
    if (parsed && !results.includes(parsed)) results.push(parsed);
  }

  return results.sort();
}

// ── License plate OCR ────────────────────────────────────────────────────────

export interface PlateOcrResult {
  plate: string | null;
  rawText: string;
}

function extractPlateFromText(text: string): string | null {
  // Romanian plate patterns:
  //  B 123 ABC   (Bucharest — 1 letter + 3 digits + 3 letters)
  //  CJ 12 ABC   (county — 2 letters + 2-3 digits + 2-3 letters)
  //  B 1234      (old format, rare)
  const pattern = /\b([A-Z]{1,2})\s*[-–]?\s*(\d{2,3})\s*[-–]?\s*([A-Z]{2,3})\b/gi;
  const matches = [...text.matchAll(pattern)];
  if (matches.length === 0) return null;

  // Take the first valid match and format it
  const [, county, digits, letters] = matches[0];
  return `${county.toUpperCase()} ${digits} ${letters.toUpperCase()}`;
}

export async function runLicensePlateOcr(file: File): Promise<PlateOcrResult> {
  const { createWorker } = await import("tesseract.js");

  const worker = await createWorker("ron+eng", 1, {
    workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@7/dist/worker.min.js",
    langPath: "https://tessdata.projectnaptha.com/4.0.0",
    corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@6/tesseract-core-simd-lstm.wasm.js",
    logger: () => {},
  });

  const { data } = await worker.recognize(file);
  await worker.terminate();

  const plate = extractPlateFromText(data.text);
  return { plate, rawText: data.text };
}

export async function runOcr(file: File): Promise<OcrResult> {
  // Dynamic import to avoid SSR issues
  const { createWorker } = await import("tesseract.js");

  const worker = await createWorker("ron+eng", 1, {
    workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@7/dist/worker.min.js",
    langPath: "https://tessdata.projectnaptha.com/4.0.0",
    corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@6/tesseract-core-simd-lstm.wasm.js",
    logger: () => {}, // suppress logs
  });

  const { data } = await worker.recognize(file);
  await worker.terminate();

  const text = data.text;
  const confidence = data.confidence;

  const dataExpirare = findDateNear(text, EXPIRY_KEYWORDS);
  const dataDocument = findDateNear(text, ISSUE_KEYWORDS);

  // Fallback: if we have 2+ dates and no keyword match,
  // assume the largest (latest) date is expiry, smallest is issue
  if (!dataExpirare || !dataDocument) {
    const all = extractAllDates(text);
    if (all.length >= 2) {
      return {
        dataExpirare: dataExpirare ?? all[all.length - 1],
        dataDocument: dataDocument ?? all[0],
        rawText: text,
        confidence,
      };
    }
    if (all.length === 1) {
      return {
        dataExpirare: dataExpirare ?? all[0],
        dataDocument: dataDocument ?? null,
        rawText: text,
        confidence,
      };
    }
  }

  return { dataExpirare, dataDocument, rawText: text, confidence };
}
