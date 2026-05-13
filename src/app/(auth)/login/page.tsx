import type { Metadata } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleButton } from "@/components/auth/google-button";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthCard } from "@/components/auth/auth-card";

export const metadata: Metadata = {
  title: "Autentificare - ITP CRM",
};

export default function LoginPage() {
  return (
    <AuthCard>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold text-[#111318] leading-tight tracking-tight">
          Bun venit
        </h1>
      </div>

      {/* Google */}
      <GoogleButton />

      {/* Divider */}
      <div className="my-5">
        <AuthDivider />
      </div>

      {/* Form */}
      <LoginForm />

      {/* Footer link */}
      <p className="mt-6 text-center text-sm text-[#6B7280]">
        Nu ai cont?{" "}
        <Link
          href="/register"
          className="text-[#1877F2] font-medium hover:underline transition-colors"
        >
          Creează unul
        </Link>
      </p>
    </AuthCard>
  );
}
