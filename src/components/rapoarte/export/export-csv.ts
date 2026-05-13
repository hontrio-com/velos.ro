import Papa from "papaparse";
import { format, parseISO, isValid } from "date-fns";

export interface CsvRange {
  from: string;
  to: string;
}

function fmtDate(d: string): string {
  try {
    const p = parseISO(d);
    return isValid(p) ? format(p, "yyyy-MM-dd") : d;
  } catch {
    return d;
  }
}

function downloadCsv(data: Record<string, unknown>[], filename: string) {
  const csv = Papa.unparse(data, {
    header: true,
    delimiter: ";",
  });
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportCsvFinanciar(data: any[], statie: string, range: CsvRange) {
  const rows = data.map((r) => ({
    Data: fmtDate(r.data),
    "Total programari": r.total,
    Finalizate: r.finalizate,
    "Venit RON": r.venit,
  }));
  downloadCsv(rows, `financiar-${statie}-${range.from}-${range.to}.csv`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportCsvProgramari(data: any[], statie: string, range: CsvRange) {
  const rows = data.map((r) => ({
    Data: fmtDate(r.data),
    Total: r.total,
    Finalizate: r.finalizate,
    Neprezent: r.neprezent,
    Anulate: r.anulate,
    "Venit RON": r.venit,
    "Rata %": r.rata,
  }));
  downloadCsv(rows, `programari-${statie}-${range.from}-${range.to}.csv`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportCsvItp(data: any[], statie: string, range: CsvRange) {
  const rows = data.map((r) => ({
    "Data ITP": fmtDate(r.data_inspectie),
    Vehicul: r.vehicul,
    Client: r.client,
    Rezultat: r.rezultat,
    Inspector: r.inspector ?? "",
  }));
  downloadCsv(rows, `itp-${statie}-${range.from}-${range.to}.csv`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportCsvSms(data: any[], statie: string, range: CsvRange) {
  const rows = data.map((r) => ({
    "Data trimitere": r.created_at ? fmtDate(r.created_at.split("T")[0]) : "",
    Client: r.client,
    Telefon: r.telefon,
    "Mesaj (primele 80 char)": (r.mesaj ?? "").slice(0, 80),
    Status: r.status,
  }));
  downloadCsv(rows, `sms-${statie}-${range.from}-${range.to}.csv`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportCsvAngajati(data: any[], statie: string, range: CsvRange) {
  const rows = data.map((r) => ({
    Angajat: r.nume,
    Functie: r.functie ?? "",
    Email: r.email ?? "",
    Telefon: r.telefon ?? "",
    Activ: r.activ ? "Da" : "Nu",
  }));
  downloadCsv(rows, `angajati-${statie}-${range.from}-${range.to}.csv`);
}
