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
