"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  return (
    <section id="faq" className="bg-[#F7F8FA] py-24 scroll-mt-16">
      <div className="max-w-3xl mx-auto px-6">
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

        <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden divide-y divide-[#F3F4F6]">
          <Accordion multiple={false}>
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={String(i)} className="border-b-0 px-6">
                <AccordionTrigger className="py-5 text-sm font-semibold text-[#111318] hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm text-[#6B7280] leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center mt-10">
          <p className="text-sm text-[#9CA3AF]">
            Nu ai gasit raspunsul?{" "}
            <a href="mailto:contact@itpbase.ro" className="text-[#1877F2] hover:underline font-medium">
              Scrie-ne pe email
            </a>{" "}
            si iti raspundem in maxim 24 de ore.
          </p>
        </div>
      </div>
    </section>
  );
}
