"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "Ce include perioada de trial de 15 zile?",
    answer:
      "In cei 15 zile ai acces complet la toate functiile platformei: SMS-uri automate, programari online, CRM, rapoarte. Primesti 20 de SMS-uri gratuite pentru a testa fluxul complet. Nu este necesar niciun card bancar pentru inregistrare.",
  },
  {
    question: "Ce se intampla dupa expirarea trial-ului?",
    answer:
      "La sfarsitul perioadei de trial, contul tau trece in starea inactiva. Nu se sterge nimic. Poti alege oricand un plan platit si iti reia activitatea de unde ai lasat-o, cu toate datele intacte.",
  },
  {
    question: "Pot sa cumpar mai multe SMS-uri daca se termina cele incluse in plan?",
    answer:
      "Da. Daca ai consumat cota lunara de SMS-uri inclusa in plan, poti achizitiona pachete suplimentare direct din contul tau, prin card bancar. SMS-urile cumparate nu expira si se consuma dupa ce se termina cota lunara.",
  },
  {
    question: "Pot gestiona mai multe statii ITP dintr-un singur cont?",
    answer:
      "Da, incepand cu planul Pro poti adauga pana la 3 statii. Planul Enterprise permite statii nelimitate. Fiecare statie are clientii, programarile si setarile ei separate, dar le gestionezi din acelasi dashboard.",
  },
  {
    question: "Datele clientilor mei sunt in siguranta?",
    answer:
      "Toate datele sunt stocate pe servere securizate in Europa, conforme GDPR. Conexiunile sunt criptate SSL. Nu vindem sau partajam datele tale cu terti. Ai control complet si poti exporta sau sterge datele oricand.",
  },
  {
    question: "Functioneaza si pentru statii RAR sau alte tipuri de inspectii?",
    answer:
      "Platforma este construita cu accent pe ITP, dar functioneaza pentru orice business care lucreaza cu programari periodice si doreste sa trimita remindere automate clientilor. Templateurile SMS sunt complet personalizabile.",
  },
  {
    question: "Pot importa clientii pe care ii am deja?",
    answer:
      "Da. Poti importa clientii existenti printr-un fisier CSV cu campurile: nume, telefon, numar de inmatriculare si data expirarii ITP. Dupa import, platforma genereaza automat reminderele viitoare.",
  },
];

export default function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-[#F7F8FA] py-24 scroll-mt-16">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-[#1877F2] uppercase tracking-widest mb-3">
            Intrebari frecvente
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0A0F1E] leading-tight mb-4">
            Ai intrebari?
            <br />
            <span className="text-[#6B7280]">Avem raspunsurile.</span>
          </h2>
        </div>

        {/* Items */}
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 ${
                  isOpen ? "border-[#E5E7EB] shadow-sm" : "border-[#F3F4F6]"
                }`}
              >
                <button
                  className="w-full text-left flex items-center justify-between gap-4 px-6 py-5"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                >
                  <span className="text-sm font-semibold text-[#111318] leading-snug">
                    {item.question}
                  </span>
                  <span className="shrink-0 text-[#9CA3AF]">
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-[#6B7280] leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-sm text-[#9CA3AF]">
            Nu ai gasit raspunsul?{" "}
            <a
              href="mailto:contact@itpbase.ro"
              className="text-[#1877F2] hover:underline font-medium"
            >
              Scrie-ne pe email
            </a>{" "}
            si iti raspundem in maxim 24 de ore.
          </p>
        </div>
      </div>
    </section>
  );
}
