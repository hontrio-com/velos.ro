import { z } from "zod";

export const clientSchema = z.object({
  nume: z.string().min(3, "Minim 3 caractere").max(100),
  prenume: z.string().max(100).optional().or(z.literal("")),
  telefon: z
    .string()
    .regex(/^(\+40|0)[0-9]{9}$/, "Format: 07XX XXX XXX sau +40XXXXXXXXX"),
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
