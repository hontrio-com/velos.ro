"use client";

import { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <div className="relative">
        <input
          ref={ref}
          type={show ? "text" : "password"}
          className={cn(
            "flex h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 pr-10 text-sm text-[#111318] placeholder:text-[#9CA3AF]",
            "transition-all duration-150 ease-in outline-none",
            "hover:border-[#D1D5DB]",
            "focus:border-[#1877F2] focus:shadow-[0_0_0_3px_rgba(24,119,242,0.15)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors duration-150"
          tabIndex={-1}
          aria-label={show ? "Ascunde parola" : "Arată parola"}
        >
          {show ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
