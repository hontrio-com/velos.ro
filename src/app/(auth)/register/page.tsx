import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { GoogleButton } from "@/components/auth/google-button";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthCard } from "@/components/auth/auth-card";

export const metadata: Metadata = { title: "Cont nou" };

export default function RegisterPage() {
  return (
    <AuthCard>
      {/* Trial badge */}
      <div className="mb-5 rounded-xl px-4 py-3 flex items-center gap-3 border border-[#E5E7EB] bg-[#F9FAFB]">
        <div className="h-8 w-8 rounded-lg bg-[#1877F2]/10 flex items-center justify-center shrink-0">
          <span className="text-[#1877F2] text-xs font-bold">15</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#111318]">Trial gratuit 15 zile</p>
          <p className="text-xs text-[#6B7280]">Alegi planul după înregistrare. Fără card bancar.</p>
        </div>
      </div>

      {/* Google */}
      <GoogleButton />

      <div className="my-5">
        <AuthDivider />
      </div>

      {/* Form */}
      <RegisterForm />

      <p className="mt-6 text-center text-sm text-[#6B7280]">
        Ai deja cont?{" "}
        <Link href="/login" className="text-[#1877F2] font-medium hover:underline transition-colors">
          Autentifică-te
        </Link>
      </p>
    </AuthCard>
  );
}
