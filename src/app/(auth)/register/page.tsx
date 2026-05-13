import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { GoogleButton } from "@/components/auth/google-button";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthCard } from "@/components/auth/auth-card";

export const metadata: Metadata = {
  title: "Cont nou - ITP CRM",
};

export default function RegisterPage() {
  return (
    <AuthCard>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold text-[#111318] leading-tight tracking-tight">
          Creează-ți contul
        </h1>
        <div className="flex items-center gap-2 mt-1.5">
          <p className="text-sm text-[#6B7280]">14 zile gratuit, fără card</p>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[11px] font-medium text-[#16A34A]">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M10 3L4.5 8.5 2 6"
                stroke="#16A34A"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Trial gratuit
          </span>
        </div>
      </div>

      {/* Google */}
      <GoogleButton />

      {/* Divider */}
      <div className="my-5">
        <AuthDivider />
      </div>

      {/* Form */}
      <RegisterForm />

      {/* Footer link */}
      <p className="mt-6 text-center text-sm text-[#6B7280]">
        Ai deja cont?{" "}
        <Link
          href="/login"
          className="text-[#1877F2] font-medium hover:underline transition-colors"
        >
          Autentifică-te
        </Link>
      </p>
    </AuthCard>
  );
}
