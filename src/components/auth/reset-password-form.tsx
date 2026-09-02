"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { PasswordInput } from "@/components/auth/password-input";
import { cn } from "@/lib/utils";

const labelClass = "block text-[13px] font-medium text-[#374151] mb-1.5";

/**
 * Link-ul de resetare trimis pe email trece prin Supabase, care redirectioneaza
 * aici. In functie de tipul de link, sesiunea vine in trei forme diferite; le
 * tratam pe toate, altfel utilizatorul ajunge pe o pagina care nu-l lasa sa-si
 * schimbe parola:
 *   - `#access_token=...&refresh_token=...` (flux implicit, cazul obisnuit)
 *   - `?token_hash=...&type=recovery`       (link verificat pe server)
 *   - `?code=...`                            (flux PKCE)
 */
type Stare = "verific" | "gata" | "link_invalid" | "salvat";

export function ResetPasswordForm() {
  const router = useRouter();
  const [stare, setStare] = useState<Stare>("verific");
  const [eroareServer, setEroareServer] = useState<string | null>(null);
  const [seSalveaza, setSeSalveaza] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  useEffect(() => {
    const supabase = createClient();

    async function pregatesteSesiunea() {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const tokenHash = url.searchParams.get("token_hash");
      const code = url.searchParams.get("code");

      try {
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          // Curatam tokenurile din bara de adrese.
          window.history.replaceState({}, "", window.location.pathname);
        } else if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
          if (error) throw error;
          window.history.replaceState({}, "", window.location.pathname);
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          window.history.replaceState({}, "", window.location.pathname);
        }

        const { data } = await supabase.auth.getUser();
        setStare(data.user ? "gata" : "link_invalid");
      } catch {
        setStare("link_invalid");
      }
    }

    pregatesteSesiunea();
  }, []);

  async function onSubmit(date: ResetPasswordInput) {
    setSeSalveaza(true);
    setEroareServer(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: date.password });

    setSeSalveaza(false);
    if (error) {
      setEroareServer(error.message);
      return;
    }

    setStare("salvat");
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  if (stare === "verific") {
    return (
      <div className="flex items-center gap-2 text-sm text-[#6B7280]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Se verifică link-ul...
      </div>
    );
  }

  if (stare === "link_invalid") {
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-[#FEF2F2] border-l-[3px] border-[#DC2626]">
          <AlertCircle className="h-4 w-4 text-[#DC2626] mt-0.5 shrink-0" />
          <p className="text-sm text-[#DC2626]">
            Link-ul de resetare este invalid sau a expirat. Cere unul nou.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1877F2] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Trimite alt link
        </Link>
      </div>
    );
  }

  if (stare === "salvat") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-[#F0FDF4] border-l-[3px] border-[#16A34A]"
      >
        <CheckCircle2 className="h-4 w-4 text-[#16A34A] mt-0.5 shrink-0" />
        <p className="text-sm text-[#166534]">
          Parola a fost schimbată. Te ducem în cont...
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <AnimatePresence>
        {eroareServer && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-[#FEF2F2] border-l-[3px] border-[#DC2626]"
          >
            <AlertCircle className="h-4 w-4 text-[#DC2626] mt-0.5 shrink-0" />
            <p className="text-sm text-[#DC2626]">{eroareServer}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <label htmlFor="password" className={labelClass}>
          Parolă nouă
        </label>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          autoComplete="new-password"
          className={cn(errors.password && "border-[#DC2626] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.15)]")}
          {...register("password", { onChange: () => clearErrors("password") })}
        />
        {errors.password && (
          <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[#DC2626]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="confirm_password" className={labelClass}>
          Confirmă parola
        </label>
        <PasswordInput
          id="confirm_password"
          placeholder="••••••••"
          autoComplete="new-password"
          className={cn(errors.confirm_password && "border-[#DC2626] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.15)]")}
          {...register("confirm_password", { onChange: () => clearErrors("confirm_password") })}
        />
        {errors.confirm_password && (
          <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[#DC2626]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.confirm_password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={seSalveaza}
        className={cn(
          "w-full h-10 rounded-lg bg-[#1877F2] text-white text-sm font-medium",
          "transition-colors hover:bg-[#1565D8] disabled:opacity-60 disabled:cursor-not-allowed",
          "flex items-center justify-center gap-2"
        )}
      >
        {seSalveaza && <Loader2 className="h-4 w-4 animate-spin" />}
        {seSalveaza ? "Se salvează..." : "Salvează parola nouă"}
      </button>
    </form>
  );
}
