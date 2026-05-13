"use client";

import { useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/lib/actions/auth";
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

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  function onSubmit(_data: LoginInput, e?: React.BaseSyntheticEvent) {
    e?.preventDefault();
    const form = e?.target as HTMLFormElement;
    startTransition(() => {
      formAction(new FormData(form));
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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

      {/* Email */}
      <motion.div {...fieldAnim(0)}>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="tu@exemplu.ro"
          autoComplete="email"
          className={cn(inputClass, errors.email && "border-[#DC2626] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.15)]")}
          {...register("email", { onChange: () => clearErrors("email") })}
        />
        {errors.email && (
          <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[#DC2626]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.email.message}
          </p>
        )}
      </motion.div>

      {/* Parolă */}
      <motion.div {...fieldAnim(1)}>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="password" className={labelClass.replace("mb-1.5", "")}>
            Parolă
          </label>
          <Link
            href="/forgot-password"
            className="text-[12px] text-[#1877F2] hover:underline transition-colors"
          >
            Ai uitat parola?
          </Link>
        </div>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          autoComplete="current-password"
          className={cn(errors.password && "border-[#DC2626] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.15)]")}
          {...register("password", { onChange: () => clearErrors("password") })}
        />
        {errors.password && (
          <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[#DC2626]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.password.message}
          </p>
        )}
      </motion.div>

      {/* Submit */}
      <motion.div {...fieldAnim(2)}>
        <button
          type="submit"
          disabled={isPending}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:shadow-[0_0_0_3px_rgba(24,119,242,0.3)] active:scale-[0.99]"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Se conectează...
            </>
          ) : (
            "Autentifică-te"
          )}
        </button>
      </motion.div>
    </form>
  );
}
