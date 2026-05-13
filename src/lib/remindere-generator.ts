import type { Database } from "@/types/database.types";

export type TipReminder = Database["public"]["Enums"]["tip_reminder"];

export const TIP_CONFIG: Record<
  TipReminder,
  { label: string; labelShort: string; colorClass: string; bgClass: string; urgency: number }
> = {
  "30_zile":             { label: "ITP · 30 zile",          labelShort: "30z",  colorClass: "text-blue-600",   bgClass: "bg-blue-50",   urgency: 1 },
  "15_zile":             { label: "ITP · 15 zile",          labelShort: "15z",  colorClass: "text-blue-600",   bgClass: "bg-blue-50",   urgency: 2 },
  "7_zile":              { label: "ITP · 7 zile",           labelShort: "7z",   colorClass: "text-amber-600",  bgClass: "bg-amber-50",  urgency: 3 },
  "1_zi":                { label: "ITP · 1 zi",             labelShort: "1z",   colorClass: "text-red-600",    bgClass: "bg-red-50",    urgency: 4 },
  "expirat":             { label: "ITP · Expirat",          labelShort: "exp",  colorClass: "text-red-700",    bgClass: "bg-red-100",   urgency: 5 },
  "confirmare_programare": { label: "Confirmare",           labelShort: "conf", colorClass: "text-green-600",  bgClass: "bg-green-50",  urgency: 0 },
  "ziua_programarii":    { label: "Ziua programării",       labelShort: "azi",  colorClass: "text-[#1877F2]",  bgClass: "bg-[#EFF6FF]", urgency: 0 },
};

export const STATUS_CONFIG: Record<
  string,
  { label: string; colorClass: string; bgClass: string }
> = {
  pending: { label: "În așteptare", colorClass: "text-[#9CA3AF]",  bgClass: "bg-[#F7F8FA]" },
  trimis:  { label: "Trimis",       colorClass: "text-[#1877F2]",  bgClass: "bg-[#EFF6FF]" },
  livrat:  { label: "Livrat ✓",     colorClass: "text-[#15803D]",  bgClass: "bg-[#DCFCE7]" },
  eroare:  { label: "Eroare",       colorClass: "text-red-600",    bgClass: "bg-red-50"     },
  anulat:  { label: "Anulat",       colorClass: "text-[#9CA3AF]",  bgClass: "bg-[#F7F8FA]" },
};

export const DEFAULT_TEMPLATES: Record<TipReminder, string> = {
  "30_zile":
    "Buna ziua, {{nume}}! ITP-ul vehiculului {{nr_inmatriculare}} expira pe {{data_expirare}}. Programati-va din timp la {{statie}}. Programari: {{telefon_statie}}",
  "15_zile":
    "Buna ziua, {{nume}}! ITP-ul vehiculului {{nr_inmatriculare}} expira pe {{data_expirare}} ({{zile_ramase}} zile). Programati-va la {{statie}}: {{telefon_statie}}",
  "7_zile":
    "URGENT: ITP-ul vehiculului {{nr_inmatriculare}} expira pe {{data_expirare}} ({{zile_ramase}} zile). Programati-va urgent la {{statie}}: {{telefon_statie}}",
  "1_zi":
    "URGENT: ITP-ul vehiculului {{nr_inmatriculare}} expira MAINE! Contactati statia {{statie}}: {{telefon_statie}}",
  "expirat":
    "ITP-ul vehiculului {{nr_inmatriculare}} a EXPIRAT! Programati-va urgent la {{statie}}: {{telefon_statie}}",
  "confirmare_programare":
    "Programare confirmata la {{statie}} pentru {{nr_inmatriculare}} pe {{data}} la ora {{ora}}. Anulare: {{telefon_statie}}",
  "ziua_programarii":
    "Reminder: aveti programare ITP astazi la ora {{ora}} la {{statie}} pentru {{nr_inmatriculare}}. Va asteptam!",
};

export const PREVIEW_VARS: Record<string, string> = {
  nume: "Ion",
  nr_inmatriculare: "B-123-ABC",
  data_expirare: "12.06.2026",
  zile_ramase: "30",
  data: "luni 12 iun. 2026",
  ora: "10:00",
  statie: "Auto Test Cluj",
  telefon_statie: "0712 345 678",
};

export const ALL_VARS = [
  "{{nume}}",
  "{{nr_inmatriculare}}",
  "{{data_expirare}}",
  "{{zile_ramase}}",
  "{{data}}",
  "{{ora}}",
  "{{statie}}",
  "{{telefon_statie}}",
];

export const ITP_TIPS: TipReminder[] = ["30_zile", "7_zile", "1_zi", "expirat"];
