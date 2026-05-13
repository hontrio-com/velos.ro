import { format, parseISO, differenceInDays } from "date-fns";
import { ro } from "date-fns/locale";

export function formatPhoneForSmso(telefon: string): string {
  const clean = telefon.replace(/\D/g, "");
  if (clean.startsWith("40")) return "+" + clean;
  if (clean.startsWith("0")) return "+4" + clean;
  return "+4" + clean;
}

export function interpolateTemplate(
  template: string,
  vars: Record<string, string | number | null | undefined>
): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) =>
      text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value ?? "")),
    template
  );
}

export function countSmsChars(text: string): {
  chars: number;
  smsCount: number;
  remaining: number;
} {
  const len = text.length;
  if (len === 0) return { chars: 0, smsCount: 1, remaining: 160 };
  if (len <= 160) return { chars: len, smsCount: 1, remaining: 160 - len };
  return {
    chars: len,
    smsCount: Math.ceil(len / 153),
    remaining: 153 - (len % 153 || 153),
  };
}

export function getPrenume(numeComplet: string): string {
  return numeComplet.split(" ")[0] ?? numeComplet;
}

export function buildTemplateVars(params: {
  clientNume: string;
  nrInmatriculare: string;
  expirareItp?: string | null;
  dataProgramare?: string | null;
  oraProgramare?: string | null;
  statieNume: string;
  statieTelefon?: string | null;
}): Record<string, string> {
  const today = new Date();
  const zileRamase =
    params.expirareItp
      ? differenceInDays(parseISO(params.expirareItp), today)
      : 0;

  return {
    nume: getPrenume(params.clientNume),
    nr_inmatriculare: params.nrInmatriculare,
    data_expirare: params.expirareItp
      ? format(parseISO(params.expirareItp + "T12:00:00"), "dd.MM.yyyy")
      : "",
    zile_ramase: String(zileRamase),
    data: params.dataProgramare
      ? format(
          parseISO(params.dataProgramare + "T12:00:00"),
          "EEEE dd MMM yyyy",
          { locale: ro }
        )
      : "",
    ora: params.oraProgramare
      ? params.oraProgramare.slice(0, 5)
      : "",
    statie: params.statieNume,
    telefon_statie: params.statieTelefon ?? "",
  };
}
