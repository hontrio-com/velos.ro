import { z } from "zod";

export const vehiculSchema = z.object({
  client_id: z.string().uuid("ID client invalid"),
  nr_inmatriculare: z
    .string()
    .min(4, "Minim 4 caractere")
    .max(12, "Maxim 12 caractere")
    .transform((v) => v.toUpperCase().trim()),
  serie_sasiu: z
    .string()
    .max(17)
    .optional()
    .or(z.literal("")),
  marca: z.string().min(2, "Minim 2 caractere").max(50),
  model: z.string().min(1, "Completează modelul").max(50),
  an_fabricatie: z
    .number()
    .min(1970, "An minim: 1970")
    .max(new Date().getFullYear() + 1)
    .optional(),
  culoare: z.string().max(50).optional().or(z.literal("")),
  tip_vehicul: z
    .enum(["autoturism", "autoutilitara", "motocicleta", "remorca", "autobuz", "autocamion"])
    .optional(),
  combustibil: z.string().optional().or(z.literal("")),
  capacitate_cilindrica: z
    .number()
    .min(50)
    .max(10000)
    .optional(),
  expirare_itp: z.string().optional().or(z.literal("")),
  expirare_rca: z.string().optional().or(z.literal("")),
  expirare_rovinieta: z.string().optional().or(z.literal("")),
  observatii: z.string().max(500).optional().or(z.literal("")),
});

export type VehiculForm = z.infer<typeof vehiculSchema>;
