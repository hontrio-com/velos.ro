import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalid"),
  password: z.string().min(6, "Minim 6 caractere"),
});

export const registerSchema = z
  .object({
    full_name: z.string().min(3, "Minim 3 caractere"),
    email: z.string().email("Email invalid"),
    password: z
      .string()
      .min(8, "Minim 8 caractere")
      .regex(/[A-Z]/, "Cel puțin o literă mare")
      .regex(/[0-9]/, "Cel puțin o cifră"),
    confirm_password: z.string(),
    terms: z.boolean().refine((v) => v === true, "Acceptă termenii"),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Parolele nu coincid",
    path: ["confirm_password"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalid"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
