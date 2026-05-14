"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Zap } from "lucide-react";

const PLANS = [
  {
    name: "Trial",
    price: { monthly: 0, yearly: 0 },
    description: "Testeaza toate functiile fara risc.",
    duration: "15 zile gratuit",
    features: [
      "20 SMS-uri incluse",
      "1 statie ITP",
      "Programari online",
      "CRM complet",
      "Rapoarte de baza",
      "Suport prin email",
    ],
    cta: "Incepe gratuit",
    href: "/register",
    highlight: false,
  },
  {
    name: "Basic",
    price: { monthly: 149, yearly: 119 },
    description: "Pentru statiile cu un singur punct de lucru.",
    duration: null,
    features: [
      "200 SMS-uri / luna",
      "1 statie ITP",
      "Programari online",
      "CRM complet",
      "Rapoarte de baza",
      "Suport prin email",
    ],
    cta: "Alege Basic",
    href: "/register?plan=basic",
    highlight: false,
  },
  {
    name: "Pro",
    price: { monthly: 249, yearly: 199 },
    description: "Cel mai ales de statiile in crestere.",
    duration: null,
    features: [
      "500 SMS-uri / luna",
      "3 statii ITP",
      "Programari online",
      "CRM complet",
      "Rapoarte avansate",
      "Export PDF si CSV",
      "Suport prioritar",
    ],
    cta: "Alege Pro",
    href: "/register?plan=pro",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: { monthly: 499, yearly: 399 },
    description: "Pentru retele mari cu nevoi specifice.",
    duration: null,
    features: [
      "SMS-uri nelimitate",
      "Statii nelimitate",
      "Programari online",
      "CRM complet",
      "Rapoarte avansate",
      "Export PDF si CSV",
      "Suport dedicat",
      "Onboarding personalizat",
    ],
    cta: "Contacteaza-ne",
    href: "/contact",
    highlight: false,
  },
];

export default function LandingPricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="preturi" className="bg-[#F7F8FA] py-24 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-[#1877F2] uppercase tracking-widest mb-3">
            Preturi
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A0F1E] leading-tight mb-5">
            Simplu si transparent.
            <br />
            <span className="text-[#6B7280]">Fara surprize.</span>
          </h2>
          <p className="text-lg text-[#6B7280] leading-relaxed">
            Incepi cu trial gratuit de 15 zile, fara card bancar. Alegi planul
            care ti se potriveste dupa ce testezi.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm font-medium ${!yearly ? "text-[#111318]" : "text-[#9CA3AF]"}`}>
            Lunar
          </span>
          <button
            onClick={() => setYearly(!yearly)}
            className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
              yearly ? "bg-[#1877F2]" : "bg-[#D1D5DB]"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                yearly ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${yearly ? "text-[#111318]" : "text-[#9CA3AF]"}`}>
            Anual
          </span>
          {yearly && (
            <span className="text-xs font-semibold bg-[#059669]/10 text-[#059669] px-2.5 py-1 rounded-full">
              2 luni gratuit
            </span>
          )}
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {PLANS.map((plan) => {
            const price = yearly ? plan.price.yearly : plan.price.monthly;
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-7 flex flex-col ${
                  plan.highlight
                    ? "bg-white border-2 border-[#1877F2] shadow-md shadow-[#1877F2]/10 scale-[1.02]"
                    : "bg-white border border-[#F3F4F6]"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#1877F2] text-white px-3 py-1 rounded-full">
                      <Zap className="h-3 w-3" />
                      Recomandat
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-base font-bold mb-1 text-[#111318]">
                    {plan.name}
                  </h3>
                  <p className="text-xs leading-relaxed text-[#9CA3AF]">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  {plan.duration ? (
                    <p className="text-2xl font-bold text-[#111318]">{plan.duration}</p>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-bold text-[#111318]">{price} lei</span>
                      <span className="text-sm mb-1 text-[#9CA3AF]">/luna</span>
                    </div>
                  )}
                  {yearly && plan.price.monthly > 0 && (
                    <p className="text-xs text-[#9CA3AF] mt-0.5 line-through">
                      {plan.price.monthly} lei/luna
                    </p>
                  )}
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-[#1877F2]" />
                      <span className="text-sm text-[#374151]">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`text-sm font-semibold text-center py-3 rounded-lg transition-colors ${
                    plan.highlight
                      ? "bg-[#1877F2] hover:bg-[#1565D8] text-white"
                      : "bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111318]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-[#9CA3AF] mt-8">
          Toti preturile sunt in lei, fara TVA. Poti anula oricand, fara penalizari.
        </p>
      </div>
    </section>
  );
}
