import { z } from "zod";
import { esteTelefonValid, normalizeazaTelefon } from "@/lib/phone";

export const statieBaseSchema = z.object({
  nume: z.string().min(3, "Minim 3 caractere").max(100),
  slug: z
    .string()
    .min(3, "Minim 3 caractere")
    .max(60, "Maxim 60 caractere")
    .regex(/^[a-z0-9-]+$/, "Doar litere mici, cifre și cratime"),
  nr_autorizatie_rar: z.string().optional(),
  cui: z
    .string()
    .regex(/^(RO)?[0-9]{6,10}$/, "CUI invalid")
    .optional()
    .or(z.literal("")),
  telefon: z
    .string()
    .refine(esteTelefonValid, "Număr invalid (ex: 0712345678 sau +39 333 1234567)")
    .transform((v) => normalizeazaTelefon(v) ?? v),
  email: z
    .string()
    .email("Email invalid")
    .optional()
    .or(z.literal("")),
  website: z
    .string()
    .url("URL invalid")
    .optional()
    .or(z.literal("")),
});

export const locatieSchema = z.object({
  judet: z.string().min(2, "Selectează județul"),
  localitate: z.string().min(2, "Completează localitatea"),
  adresa: z.string().min(5, "Completează adresa"),
  cod_postal: z
    .string()
    .regex(/^[0-9]{6}$/, "Cod poștal invalid")
    .optional()
    .or(z.literal("")),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const programSchema = z.object({
  program_lucru: z.record(
    z.string(),
    z.union([
      z.object({ start: z.string(), end: z.string() }),
      z.null(),
    ])
  ),
  durata_slot_minute: z.number().min(15).max(120),
  nr_linii: z.number().min(1).max(20),
});

export const statieCompletaSchema = statieBaseSchema
  .merge(locatieSchema)
  .merge(programSchema);

export type StatieBaseForm = z.infer<typeof statieBaseSchema>;
export type LocatieForm = z.infer<typeof locatieSchema>;
export type ProgramForm = z.infer<typeof programSchema>;
export type StatieCompletaForm = z.infer<typeof statieCompletaSchema>;
