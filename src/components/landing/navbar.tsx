"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "#functii", label: "Funcții" },
  { href: "#preturi", label: "Prețuri" },
  { href: "#testimoniale", label: "Testimoniale" },
  { href: "#faq", label: "FAQ" },
];

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#060A14]/90 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/logo441x245.png"
            alt="Velos"
            width={88}
            height={49}
            className="h-8 w-auto"
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-[#94A3B8] hover:text-white transition-colors duration-150"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-[#94A3B8] hover:text-white transition-colors px-4 py-2 rounded-lg"
          >
            Autentificare
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold bg-[#1877F2] hover:bg-[#1565D8] text-white px-5 py-2 rounded-lg transition-colors"
          >
            Incearca gratuit
          </Link>
        </div>

        <button
          className="md:hidden text-white p-2 -mr-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Deschide meniu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#060A14] border-b border-white/[0.06] px-6 pb-6">
          <nav className="flex flex-col gap-1 pt-4">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-[#94A3B8] hover:text-white py-2.5 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/[0.06]">
            <Link
              href="/login"
              className="text-sm text-[#94A3B8] py-2.5 text-center"
              onClick={() => setMobileOpen(false)}
            >
              Autentificare
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-[#1877F2] text-white px-4 py-3 rounded-lg text-center"
              onClick={() => setMobileOpen(false)}
            >
              Incearca gratuit
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
