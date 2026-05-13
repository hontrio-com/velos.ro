"use client";

import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { forgotPasswordAction } from "@/lib/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { cn } from "@/lib/utils";

const inputClass = cn(
  "flex h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111318] placeholder:text-[#9CA3AF]",
  "transition-all duration-150 outline-none",
  "hover:border-[#D1D5DB]",
  "focus:border-[#1877F2] focus:shadow-[0_0_0_3px_rgba(24,119,242,0.15)]"
);

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, null);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  function onSubmit(_data: ForgotPasswordInput, e?: React.BaseSyntheticEvent) {
    e?.preventDefault();
    formAction(new FormData(e?.target as HTMLFormElement));
  }

  return (
    <AuthCard>

      <AnimatePresence mode="wait">
        {state?.success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-4"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F0FDF4] mx-auto mb-4">
              <CheckCircle2 className="h-7 w-7 text-[#16A34A]" />
            </div>
            <h2 className="text-xl font-semibold text-[#111318] mb-2">
              Email trimis!
            </h2>
            <p className="text-sm text-[#6B7280] mb-6">
              Verifică inbox-ul pentru instrucțiunile de resetare a parolei.
            </p>
            <Link
              href="/login"
              className="text-sm text-[#1877F2] font-medium hover:underline"
            >
              Înapoi la autentificare
            </Link>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-6">
              <h1 className="text-[28px] font-semibold text-[#111318] leading-tight tracking-tight">
                Resetează parola
              </h1>
              <p className="text-sm text-[#6B7280] mt-1">
                Îți trimitem un link de resetare pe email.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <AnimatePresence>
                {state?.error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-[#FEF2F2] border-l-[3px] border-[#DC2626]"
                  >
                    <AlertCircle className="h-4 w-4 text-[#DC2626] mt-0.5 shrink-0" />
                    <p className="text-sm text-[#DC2626]">{state.error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label htmlFor="email" className="block text-[13px] font-medium text-[#374151] mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="tu@exemplu.ro"
                  autoComplete="email"
                  className={cn(inputClass, errors.email && "border-[#DC2626]")}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[#DC2626]">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:shadow-[0_0_0_3px_rgba(24,119,242,0.3)]"
              >
                {isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Se trimite...</>
                ) : (
                  "Trimite link de resetare"
                )}
              </button>
            </form>

            <Link
              href="/login"
              className="mt-6 flex items-center justify-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111318] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Înapoi la autentificare
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthCard>
  );
}
