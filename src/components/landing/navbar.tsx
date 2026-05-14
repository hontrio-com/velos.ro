"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ArrowRight } from "lucide-react";

const NAV_LINKS = [
  { href: "#functii", label: "Funcții" },
  { href: "#preturi", label: "Prețuri" },
  { href: "#testimoniale", label: "Testimoniale" },
  { href: "#faq", label: "FAQ" },
];

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [announcementVisible, setAnnouncementVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Announcement bar */}
      {announcementVisible && (
        <div className="relative bg-[#1877F2] text-white text-xs font-medium py-2.5 px-6 text-center">
          <span>
            Programarile online si SMS-urile automate sunt incluse in toate planurile, inclusiv Trial.{" "}
            <a href="#preturi" className="underline underline-offset-2 font-semibold">
              Vezi planurile
            </a>
          </span>
          <button
            onClick={() => setAnnouncementVisible(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Inchide"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main navbar */}
      <header
        className={`sticky top-0 left-0 right-0 z-50 bg-white transition-shadow duration-200 ${
          scrolled ? "shadow-sm border-b border-[#E5E7EB]" : "border-b border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-[68px] flex items-center justify-between gap-8">

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/logo441x245.png"
              alt="Velos"
              width={176}
              height={98}
              quality={100}
              className="h-9 w-auto"
              priority
            />
          </Link>

          {/* Nav links — desktop */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="relative text-sm font-medium text-[#4B5563] hover:text-[#111318] px-3.5 py-2 rounded-lg hover:bg-[#F9FAFB] transition-colors duration-150"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Right side — desktop */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <Link
              href="/login"
              className="text-sm font-medium text-[#4B5563] hover:text-[#111318] px-4 py-2 rounded-lg hover:bg-[#F9FAFB] transition-colors"
            >
              Autentificare
            </Link>

            <div className="w-px h-5 bg-[#E5E7EB] mx-2" />

            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-sm font-semibold bg-[#1877F2] hover:bg-[#1565D8] text-white px-5 py-2.5 rounded-lg transition-colors"
            >
              Incearca gratuit
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-[#374151] p-2 -mr-2 rounded-lg hover:bg-[#F9FAFB] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Deschide meniu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#F3F4F6] bg-white px-4 pb-6">
            <nav className="flex flex-col pt-2">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-sm font-medium text-[#4B5563] hover:text-[#111318] py-3 px-3 rounded-lg hover:bg-[#F9FAFB] transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[#F3F4F6]">
              <Link
                href="/login"
                className="text-sm font-medium text-[#4B5563] py-3 text-center rounded-lg hover:bg-[#F9FAFB] transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Autentificare
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold bg-[#1877F2] hover:bg-[#1565D8] text-white px-4 py-3 rounded-lg text-center transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Incearca gratuit
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
