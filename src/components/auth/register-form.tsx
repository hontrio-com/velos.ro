"use client";

import { useActionState, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { AlertCircle, Loader2, Check } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { registerAction } from "@/lib/actions/auth";
import { PasswordInput } from "./password-input";
import { cn } from "@/lib/utils";

const inputClass = cn(
  "flex h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111318] placeholder:text-[#9CA3AF]",
  "transition-all duration-150 outline-none",
  "hover:border-[#D1D5DB]",
  "focus:border-[#1877F2] focus:shadow-[0_0_0_3px_rgba(24,119,242,0.15)]",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

const labelClass = "block text-[13px] font-medium text-[#374151] mb-1.5";

function fieldAnim(i: number) {
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay: 0.14 + i * 0.04, ease: "easeOut" as const },
  };
}

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "Slabă", color: "#DC2626" },
    { label: "Medie", color: "#F97316" },
    { label: "Bună", color: "#EAB308" },
    { label: "Puternică", color: "#16A34A" },
  ];

  return { score, ...(levels[score - 1] ?? { label: "", color: "#E5E7EB" }) };
}

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, null);
  const [isPending, startTransition] = useTransition();
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const strength = passwordValue ? getPasswordStrength(passwordValue) : null;

  function onSubmit(_data: RegisterInput, e?: React.BaseSyntheticEvent) {
    e?.preventDefault();
    const form = e?.target as HTMLFormElement;
    startTransition(() => {
      formAction(new FormData(form));
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Server error */}
      <AnimatePresence>
        {state?.error && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-[#FEF2F2] border-l-[3px] border-[#DC2626]"
          >
            <AlertCircle className="h-4 w-4 text-[#DC2626] mt-0.5 shrink-0" />
            <p className="text-sm text-[#DC2626]">{state.error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nume */}
      <motion.div {...fieldAnim(0)}>
        <label htmlFor="full_name" className={labelClass}>
          Nume complet
        </label>
        <input
          id="full_name"
          type="text"
          placeholder="Ion Popescu"
          autoComplete="name"
          className={cn(inputClass, errors.full_name && "border-[#DC2626]")}
          {...register("full_name", { onChange: () => clearErrors("full_name") })}
        />
        {errors.full_name && (
          <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[#DC2626]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.full_name.message}
          </p>
        )}
      </motion.div>

      {/* Email */}
      <motion.div {...fieldAnim(1)}>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="tu@exemplu.ro"
          autoComplete="email"
          className={cn(inputClass, errors.email && "border-[#DC2626]")}
          {...register("email", { onChange: () => clearErrors("email") })}
        />
        {errors.email && (
          <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[#DC2626]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.email.message}
          </p>
        )}
      </motion.div>

      {/* Parolă + strength */}
      <motion.div {...fieldAnim(2)}>
        <label htmlFor="password" className={labelClass}>
          Parolă
        </label>
        <PasswordInput
          id="password"
          placeholder="Minim 8 caractere"
          autoComplete="new-password"
          className={cn(errors.password && "border-[#DC2626]")}
          {...register("password", {
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              setPasswordValue(e.target.value);
              clearErrors("password");
            },
          })}
        />
        {/* Password strength bar */}
        {passwordValue && strength && (
          <div className="mt-2">
            <div className="flex gap-1 mb-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className="h-1 flex-1 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor:
                      level <= strength.score ? strength.color : "#E5E7EB",
                  }}
                />
              ))}
            </div>
            {strength.label && (
              <p className="text-[11px]" style={{ color: strength.color }}>
                {strength.label}
              </p>
            )}
          </div>
        )}
        {errors.password && (
          <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[#DC2626]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.password.message}
          </p>
        )}
      </motion.div>

      {/* Confirmă parola */}
      <motion.div {...fieldAnim(3)}>
        <label htmlFor="confirm_password" className={labelClass}>
          Confirmă parola
        </label>
        <PasswordInput
          id="confirm_password"
          placeholder="Repetă parola"
          autoComplete="new-password"
          className={cn(errors.confirm_password && "border-[#DC2626]")}
          {...register("confirm_password", {
            onChange: () => clearErrors("confirm_password"),
          })}
        />
        {errors.confirm_password && (
          <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[#DC2626]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.confirm_password.message}
          </p>
        )}
      </motion.div>

      {/* Terms */}
      <motion.div {...fieldAnim(4)}>
        <label className="flex items-start gap-2.5 cursor-pointer group">
          <div className="relative mt-0.5 shrink-0">
            <input
              type="checkbox"
              className="sr-only peer"
              {...register("terms")}
            />
            <div className="h-4 w-4 rounded border border-[#E5E7EB] bg-white peer-checked:bg-[#1877F2] peer-checked:border-[#1877F2] transition-all duration-150 group-hover:border-[#D1D5DB]" />
            <Check className="absolute inset-0 h-4 w-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-150" />
          </div>
          <span className="text-[13px] text-[#6B7280]">
            Accept{" "}
            <Link
              href="/termeni"
              className="text-[#1877F2] hover:underline"
            >
              Termenii și Condițiile
            </Link>
          </span>
        </label>
        {errors.terms && (
          <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[#DC2626]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.terms.message}
          </p>
        )}
      </motion.div>

      {/* Submit */}
      <motion.div {...fieldAnim(5)}>
        <button
          type="submit"
          disabled={isPending}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:shadow-[0_0_0_3px_rgba(24,119,242,0.3)] active:scale-[0.99]"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Se creează contul...
            </>
          ) : (
            "Creează cont gratuit"
          )}
        </button>
      </motion.div>
    </form>
  );
}
