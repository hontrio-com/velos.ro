"use client";

import Link from "next/link";
import { ExternalLink, Calendar, Globe } from "lucide-react";

interface SmartPageBannerProps {
  slug: string;
}

export function SmartPageBanner({ slug }: SmartPageBannerProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 rounded-xl border border-[#BFDBFE] bg-gradient-to-r from-[#EFF6FF] to-[#F0F9FF] px-5 py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#DBEAFE] shrink-0">
        <Globe className="h-4.5 w-4.5 text-[#1877F2]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#111318]">
          Pagina ta de programari online este activa
        </p>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Clientii tai pot face programari direct de pe <span className="font-medium text-[#1877F2]">velos.ro/{slug}</span>
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`https://velos.ro/${slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-[#E5E7EB] px-3 py-2 text-xs font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors shadow-sm"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Vezi ITP Smart Page
        </Link>
        <Link
          href="/programari"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1877F2] px-3 py-2 text-xs font-medium text-white hover:bg-[#1565D8] transition-colors shadow-sm"
        >
          <Calendar className="h-3.5 w-3.5" />
          Programari
        </Link>
      </div>
    </div>
  );
}
