import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Parolă nouă — Velos.ro" };

export default function ResetPasswordPage() {
  return (
    <AuthCard>
      <div className="mb-7">
        <h1 className="text-[22px] font-semibold text-[#111318] tracking-[-0.01em]">
          Alege o parolă nouă
        </h1>
        <p className="mt-1.5 text-sm text-[#6B7280]">
          Introdu parola nouă pentru contul tău.
        </p>
      </div>
      <ResetPasswordForm />
    </AuthCard>
  );
}
