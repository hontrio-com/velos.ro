"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { signInWithGoogleAction } from "@/lib/actions/auth";

export function GoogleButton() {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await signInWithGoogleAction();
    });
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      whileHover={{ scale: isPending ? 1 : 1.01 }}
      whileTap={{ scale: isPending ? 1 : 0.99 }}
      transition={{ duration: 0.15 }}
      className="w-full flex items-center justify-center gap-2.5 h-11 px-4 rounded-lg border border-[#E5E7EB] bg-white text-[#111318] text-sm font-medium transition-all duration-150 hover:border-[#D1D5DB] hover:bg-[#F9FAFB] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:shadow-[0_0_0_3px_rgba(24,119,242,0.15)]"
    >
      {isPending ? (
        <>
          <svg
            className="h-4 w-4 animate-spin text-[#1877F2]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-[#6B7280]">Se conectează...</span>
        </>
      ) : (
        <>
          {/* Google SVG logo — 4 culori oficiale */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z"
              fill="#4285F4"
            />
            <path
              d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z"
              fill="#34A853"
            />
            <path
              d="M4.405 11.9A6.01 6.01 0 014.09 10c0-.663.114-1.305.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z"
              fill="#FBBC05"
            />
            <path
              d="M10 3.977c1.468 0 2.786.505 3.822 1.496l2.868-2.868C14.959.99 12.695 0 10 0A9.996 9.996 0 001.064 5.51l3.34 2.59C5.192 5.736 7.396 3.977 10 3.977z"
              fill="#EA4335"
            />
          </svg>
          <span>Continuă cu Google</span>
        </>
      )}
    </motion.button>
  );
}
