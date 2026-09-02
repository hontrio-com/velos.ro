import { z } from "zod";
import { esteTelefonValid, normalizeazaTelefon } from "@/lib/phone";

export const clientSchema = z.object({
  nume: z.string().min(3, "Minim 3 caractere").max(100),
  prenume: z.string().max(100).optional().or(z.literal("")),
  telefon: z
    .string()
    .refine(esteTelefonValid, "Număr invalid. Pentru alte țări folosiți prefixul, ex. +39 333 1234567")
    .transform((v) => normalizeazaTelefon(v) ?? v),
  email: z
    .string()
    .email("Email invalid")
    .optional()
    .or(z.literal("")),
  cnp: z
    .string()
    .regex(/^[1-9][0-9]{12}$/, "CNP invalid (13 cifre)")
    .optional()
    .or(z.literal("")),
  adresa: z.string().max(200).optional().or(z.literal("")),
  sms_optin: z.boolean(),
});

export type ClientForm = z.infer<typeof clientSchema>;
