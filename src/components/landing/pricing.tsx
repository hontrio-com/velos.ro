"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      "250 SMS-uri / luna",
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
      "1000 SMS-uri / luna",
      "Statii nelimitate",
      "Programari online",
      "CRM complet",
      "Rapoarte avansate",
      "Export PDF si CSV",
      "Suport dedicat",
      "Onboarding personalizat",
    ],
    cta: "Alege Enterprise",
    href: "/contact",
    highlight: false,
  },
];

export default function LandingPricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="preturi" className="bg-white py-24 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-6">
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
          <Switch
            checked={yearly}
            onCheckedChange={(checked) => setYearly(checked as boolean)}
          />
          <span className={`text-sm font-medium ${yearly ? "text-[#111318]" : "text-[#9CA3AF]"}`}>
            Anual
          </span>
          {yearly && (
            <Badge variant="secondary" className="text-[#059669] bg-[#059669]/10 border-0">
              2 luni gratuit
            </Badge>
          )}
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {PLANS.map((plan) => {
            const price = yearly ? plan.price.yearly : plan.price.monthly;
            return (
              <Card
                key={plan.name}
                className={cn(
                  "relative flex flex-col",
                  plan.highlight && "border-2 border-[#1877F2] scale-[1.02]"
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="px-3 py-1 text-xs font-bold">
                      Recomandat
                    </Badge>
                  </div>
                )}

                <CardContent className="pt-6 flex flex-col flex-1 gap-5">
                  <div>
                    <h3 className="text-base font-bold text-[#111318] mb-1">{plan.name}</h3>
                    <p className="text-xs text-[#9CA3AF] leading-relaxed">{plan.description}</p>
                  </div>

                  <div>
                    {plan.duration ? (
                      <p className="text-2xl font-bold text-[#111318]">{plan.duration}</p>
                    ) : (
                      <div className="flex items-end gap-1">
                        <span className="text-3xl font-bold text-[#111318]">{price} lei</span>
                        <span className="text-sm text-[#9CA3AF] mb-1">/luna</span>
                      </div>
                    )}
                    {yearly && plan.price.monthly > 0 && (
                      <p className="text-xs text-[#9CA3AF] mt-0.5 line-through">
                        {plan.price.monthly} lei/luna
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2.5 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 mt-0.5 shrink-0 text-[#1877F2]" />
                        <span className="text-sm text-[#374151]">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.href}
                    className={cn(
                      buttonVariants({
                        variant: plan.highlight ? "default" : "outline",
                        size: "default",
                      }),
                      "w-full justify-center py-2.5 h-auto text-sm font-semibold"
                    )}
                  >
                    {plan.cta}
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-sm text-[#9CA3AF] mt-8">
          Toate preturile sunt in lei. Poti anula oricand.
        </p>
      </div>
    </section>
  );
}
