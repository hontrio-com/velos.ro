import LandingNavbar from "@/components/landing/navbar";
import LandingFooter from "@/components/landing/footer";
import Link from "next/link";

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-[#111318] mb-4 flex items-start gap-3">
        <span className="flex-shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full bg-[#1877F2]/10 text-[#1877F2] text-xs font-bold mt-0.5">
          {number}
        </span>
        {title}
      </h2>
      <div className="pl-10 space-y-3 text-sm text-[#374151] leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function RightCard({
  article,
  title,
  description,
  howTo,
  color,
}: {
  article: string;
  title: string;
  description: string;
  howTo: string;
  color: string;
}) {
  return (
    <div className={`rounded-xl border p-5 ${color}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-bold text-[#111318] text-sm leading-snug">{title}</h3>
        <span className="shrink-0 text-xs font-mono font-semibold text-[#6B7280] bg-white border border-[#E5E7EB] px-2 py-0.5 rounded-full">
          {article}
        </span>
      </div>
      <p className="text-xs text-[#6B7280] leading-relaxed mb-3">{description}</p>
      <div className="flex items-start gap-2 bg-white rounded-lg px-3 py-2 border border-[#E5E7EB]">
        <span className="text-[#059669] text-xs mt-0.5">→</span>
        <p className="text-xs text-[#374151]">{howTo}</p>
      </div>
    </div>
  );
}

function ProcessStep({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-xs font-bold">
        {step}
      </div>
      <div className="pb-6 border-l border-[#E5E7EB] pl-4 ml-[-16px] mt-1 flex-1">
        <p className="font-semibold text-[#111318] text-sm">{title}</p>
        <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function GdprPage() {
  return (
    <>
      <LandingNavbar />
      <main className="bg-[#F7F8FA] min-h-screen pt-8 pb-20">
        <div className="max-w-4xl mx-auto px-6">

          {/* Header */}
          <div className="mb-10">
            <p className="text-xs font-semibold text-[#1877F2] uppercase tracking-widest mb-2">Legal</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0A0F1E] mb-3">
              GDPR — Protecția Datelor cu Caracter Personal
            </h1>
            <p className="text-sm text-[#6B7280]">
              Versiunea 1.0 &mdash; Ultima actualizare:{" "}
              <strong className="text-[#374151]">14 mai 2025</strong>
            </p>
            <div className="mt-4 p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-sm text-[#1E40AF] leading-relaxed">
              Această pagină explică în termeni clari drepturile dumneavoastră conform{" "}
              <strong>Regulamentului (UE) 2016/679 (GDPR)</strong> și{" "}
              <strong>Legii nr. 190/2018</strong> și modul în care SC VOID SFT GAMES SRL respectă
              aceste drepturi în cadrul platformei <strong>Velos (velos.ro)</strong>.
              Pentru detalii complete privind prelucrarea datelor, consultați{" "}
              <Link href="/confidentialitate" className="underline font-semibold">
                Politica de Confidențialitate
              </Link>.
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 sm:p-10">

            {/* 1 */}
            <Section number="1" title="Ce este GDPR și ce înseamnă pentru dumneavoastră?">
              <p>
                <strong>GDPR</strong> (General Data Protection Regulation — Regulamentul General privind
                Protecția Datelor) este un regulament european care a intrat în vigoare la{" "}
                <strong>25 mai 2018</strong> și care se aplică în toate statele membre ale Uniunii Europene,
                inclusiv România. A fost transpus în legislația națională prin <strong>Legea nr. 190/2018</strong>.
              </p>
              <p>
                GDPR reglementează modul în care organizațiile colectează, stochează, prelucrează și șterg
                datele cu caracter personal ale persoanelor fizice. O <strong>dată cu caracter personal</strong>{" "}
                este orice informație care poate identifica direct sau indirect o persoană fizică: nume, email,
                număr de telefon, adresă IP, număr de înmatriculare vehicul etc.
              </p>
              <p>
                <strong>Ce înseamnă pentru dumneavoastră:</strong> Aveți drepturi clare și aplicabile cu
                privire la datele dumneavoastră personale. SC VOID SFT GAMES SRL (operatorul platformei Velos)
                are obligația legală de a respecta aceste drepturi și de a vă oferi transparență deplină
                privind prelucrarea datelor.
              </p>
            </Section>

            {/* 2 */}
            <Section number="2" title="Cine suntem. Rolurile noastre conform GDPR">
              <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
                <table className="w-full text-xs text-[#374151]">
                  <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-[#111318]">Rol GDPR</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#111318]">Definiție</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#111318]">Când se aplică</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white border-b border-[#F3F4F6]">
                      <td className="px-4 py-3 font-semibold text-[#1877F2] align-top">Operator</td>
                      <td className="px-4 py-3 align-top">
                        Entitatea care stabilește scopurile și mijloacele prelucrării [Art. 4(7) GDPR]
                      </td>
                      <td className="px-4 py-3 align-top">
                        Prelucrăm datele utilizatorilor platformei (reprezentanți stații ITP, angajați) —
                        SC VOID SFT GAMES SRL este Operator
                      </td>
                    </tr>
                    <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                      <td className="px-4 py-3 font-semibold text-[#7C3AED] align-top">Împuternicit</td>
                      <td className="px-4 py-3 align-top">
                        Entitatea care prelucrează date în numele Operatorului [Art. 4(8) GDPR]
                      </td>
                      <td className="px-4 py-3 align-top">
                        Prelucrăm datele clienților finali ai stațiilor ITP — SC VOID SFT GAMES SRL
                        este Împuternicit, stația ITP este Operator
                      </td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-4 py-3 font-semibold text-[#059669] align-top">Sub-împuternicit</td>
                      <td className="px-4 py-3 align-top">
                        Furnizori tehnici care prelucrează date în numele Împuternicitului
                      </td>
                      <td className="px-4 py-3 align-top">
                        Supabase, furnizor SMS, Vercel — prelucrează date pentru a furniza
                        infrastructura platformei Velos
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl">
                <p className="font-semibold text-[#111318] text-sm mb-1">Datele de contact ale Operatorului:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs text-[#374151]">
                  <span><strong>Denumire:</strong> SC VOID SFT GAMES SRL</span>
                  <span><strong>CUI:</strong> 43474393</span>
                  <span><strong>Sediu:</strong> Strada Progresului, Nr. 2, România</span>
                  <span><strong>Email GDPR:</strong> contact@velos.ro</span>
                  <span><strong>Telefon:</strong> 0757 941 553</span>
                  <span><strong>Program:</strong> Luni – Vineri, 09:00 – 18:00</span>
                </div>
              </div>
            </Section>

            {/* 3 */}
            <Section number="3" title="Principiile GDPR pe care le respectăm">
              <p>
                Conform Art. 5 GDPR, toate prelucrările de date efectuate de SC VOID SFT GAMES SRL respectă
                următoarele principii fundamentale:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {[
                  {
                    title: "Legalitate, echitate și transparență",
                    desc: "Prelucrăm date numai în baza unui temei legal valid și vă informăm clar despre aceasta.",
                  },
                  {
                    title: "Limitarea scopului",
                    desc: "Datele sunt colectate în scopuri determinate, explicite și legitime — nu le folosim în alt mod.",
                  },
                  {
                    title: "Reducerea la minimum a datelor",
                    desc: "Colectăm numai datele strict necesare scopului — nu cerem mai mult decât avem nevoie.",
                  },
                  {
                    title: "Exactitate",
                    desc: "Datele sunt menținute exacte și actualizate; puteți corecta oricând datele inexacte.",
                  },
                  {
                    title: "Limitarea stocării",
                    desc: "Datele sunt păstrate numai atât timp cât este necesar sau prevăzut de lege.",
                  },
                  {
                    title: "Integritate și confidențialitate",
                    desc: "Aplicăm măsuri tehnice și organizatorice adecvate pentru securitatea datelor.",
                  },
                  {
                    title: "Responsabilitate (Accountability)",
                    desc: "Putem demonstra respectarea GDPR — ținem evidența activităților de prelucrare.",
                  },
                  {
                    title: "Privacy by Design & Default",
                    desc: "Protecția datelor este integrată în arhitectura platformei, nu adăugată ulterior.",
                  },
                ].map((p) => (
                  <div key={p.title} className="border border-[#E5E7EB] rounded-xl p-4 bg-[#F9FAFB]">
                    <p className="font-semibold text-[#111318] text-xs mb-1">{p.title}</p>
                    <p className="text-xs text-[#6B7280] leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* 4 */}
            <Section number="4" title="Drepturile dumneavoastră. Cum le exercitați">
              <p>
                GDPR (Capitolul III, Art. 15–22) vă conferă opt drepturi fundamentale privind datele
                dumneavoastră cu caracter personal:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <RightCard
                  article="Art. 15"
                  title="Dreptul de acces"
                  description="Aveți dreptul de a ști dacă prelucrăm datele dumneavoastră și, dacă da, de a obține o copie a acestora (extras de date), împreună cu informații despre: scopuri, categorii de date, destinatari, durată de stocare, dreptul de portabilitate și rectificare."
                  howTo="Trimiteți un email la contact@velos.ro cu subiectul „GDPR — Drept de acces". Vom răspunde în max. 30 zile cu un export al datelor dumneavoastră."
                  color="border-[#BFDBFE] bg-[#EFF6FF]"
                />
                <RightCard
                  article="Art. 16"
                  title="Dreptul la rectificare"
                  description="Dacă datele dumneavoastră sunt inexacte sau incomplete, aveți dreptul de a solicita corectarea sau completarea lor fără întârzieri nejustificate."
                  howTo="Puteți actualiza datele direct din setările contului Velos sau trimiteți o cerere la contact@velos.ro cu subiectul „GDPR — Rectificare"."
                  color="border-[#A7F3D0] bg-[#ECFDF5]"
                />
                <RightCard
                  article="Art. 17"
                  title="Dreptul la ștergere („dreptul de a fi uitat")"
                  description="Puteți solicita ștergerea datelor atunci când: nu mai sunt necesare scopului inițial, v-ați retras consimțământul, ați obiectat la prelucrare, datele au fost prelucrate ilegal sau ștergerea este impusă de o obligație legală. Nu se aplică pentru date supuse obligațiilor legale de arhivare (ex. facturi — 10 ani)."
                  howTo="Trimiteți o cerere la contact@velos.ro cu subiectul „GDPR — Ștergere date". Vom confirma ștergerea sau vă vom explica motivul pentru care nu poate fi efectuată."
                  color="border-[#FCA5A5] bg-[#FEF2F2]"
                />
                <RightCard
                  article="Art. 18"
                  title="Dreptul la restricționarea prelucrării"
                  description="Puteți solicita „înghețarea" prelucrării datelor (nu și ștergerea) în situații specifice: contestați exactitatea datelor (pe durata verificării), prelucrarea este ilegală dar preferați restricționarea în loc de ștergere, aveți nevoie de date pentru constatarea unui drept în instanță."
                  howTo="Trimiteți o cerere la contact@velos.ro cu subiectul „GDPR — Restricționare". Vom aplica restricția și vă vom notifica înainte de ridicarea ei."
                  color="border-[#FDE68A] bg-[#FFFBEB]"
                />
                <RightCard
                  article="Art. 20"
                  title="Dreptul la portabilitatea datelor"
                  description="Aveți dreptul de a primi datele furnizate de dumneavoastră într-un format structurat, utilizat curent și care poate fi citit automat (JSON sau CSV) și de a le transmite direct unui alt operator, acolo unde este tehnic posibil. Se aplică numai pentru datele prelucrate pe baza contractului sau a consimțământului."
                  howTo="Solicitați un export la contact@velos.ro cu subiectul „GDPR — Portabilitate". Vom furniza un fișier JSON/CSV în termen de 30 zile."
                  color="border-[#DDD6FE] bg-[#F5F3FF]"
                />
                <RightCard
                  article="Art. 21"
                  title="Dreptul la opoziție"
                  description="Puteți obiecta în orice moment față de prelucrarea datelor dumneavoastră bazată pe interesul nostru legitim [Art. 6(1)(f)], inclusiv pentru profilare. Vom înceta prelucrarea cu excepția cazului în care demonstrăm motive legitime imperioase. Puteți obiecta oricând față de prelucrarea în scop de marketing direct."
                  howTo="Trimiteți o opoziție la contact@velos.ro cu subiectul „GDPR — Opoziție". Pentru marketing: link dezabonare din orice email sau setările contului."
                  color="border-[#FBCFE8] bg-[#FDF2F8]"
                />
                <RightCard
                  article="Art. 22"
                  title="Dreptul de a nu face obiectul deciziilor automate"
                  description="Aveți dreptul de a nu face obiectul unei decizii bazate exclusiv pe prelucrarea automată (inclusiv profilare) care produce efecte juridice sau vă afectează semnificativ în mod similar. SC VOID SFT GAMES SRL nu ia astfel de decizii automate cu privire la utilizatorii platformei."
                  howTo="Dacă considerați că o decizie automată v-a afectat, contactați-ne la contact@velos.ro cu subiectul „GDPR — Decizie automată"."
                  color="border-[#BAE6FD] bg-[#F0F9FF]"
                />
                <RightCard
                  article="Art. 7(3)"
                  title="Retragerea consimțământului"
                  description="Acolo unde prelucrarea se bazează pe consimțământul dumneavoastră, îl puteți retrage oricând, fără a afecta legalitatea prelucrării efectuate anterior retragerii. Retragerea consimțământului nu afectează serviciile bazate pe contract sau obligații legale."
                  howTo="Retragere din setările contului (secțiunea Notificări) sau prin email la contact@velos.ro cu subiectul „GDPR — Retragere consimțământ"."
                  color="border-[#A7F3D0] bg-[#ECFDF5]"
                />
              </div>
            </Section>

            {/* 5 */}
            <Section number="5" title="Cum procesăm o cerere GDPR">
              <p>
                Procesul nostru pentru gestionarea cererilor privind drepturile GDPR:
              </p>
              <div className="mt-5 space-y-0">
                <ProcessStep
                  step="1"
                  title="Primiți cererea dumneavoastră"
                  description="Trimiteți un email la contact@velos.ro cu subiectul „GDPR — [dreptul solicitat]". Vă rugăm să precizați clar ce solicitați și să includeți datele de identificare (email cont, nume)."
                />
                <ProcessStep
                  step="2"
                  title="Verificăm identitatea"
                  description="Pentru a proteja datele dumneavoastră față de solicitări neautorizate, vom verifica identitatea prin confirmarea adresei de email asociate contului sau prin întrebări de verificare. Nu solicităm documente de identitate în mod standard."
                />
                <ProcessStep
                  step="3"
                  title="Analizăm și procesăm cererea"
                  description="Evaluăm cererea în raport cu prevederile GDPR. Dacă există motive pentru care nu putem da curs integral cererii (ex. obligații legale de arhivare), vă vom explica în detaliu."
                />
                <ProcessStep
                  step="4"
                  title="Răspundem în termen de 30 de zile"
                  description="Termenul legal de răspuns este de 30 de zile calendaristice de la primirea cererii. În cazuri complexe sau multiple, termenul poate fi prelungit cu maximum 60 de zile suplimentare, cu notificarea dumneavoastră în termen de 30 zile și explicarea motivelor."
                />
                <ProcessStep
                  step="5"
                  title="Răspunsul este gratuit"
                  description="Exercitarea drepturilor GDPR este gratuită. Excepție: dacă cererile sunt vădit nefondate sau excesive (repetitive), putem percepe o taxă administrativă rezonabilă sau refuza cererea, cu motivare scrisă."
                />
              </div>
              <div className="mt-2 p-4 bg-[#F0FDF4] border border-[#A7F3D0] rounded-xl">
                <p className="font-semibold text-[#065F46] text-sm mb-1">Trimiteți cererea dumneavoastră GDPR:</p>
                <p className="text-xs text-[#047857]">
                  Email: <strong>contact@velos.ro</strong> &mdash; Subiect: <strong>„GDPR — [dreptul solicitat]"</strong>
                  <br />
                  Exemplu: „GDPR — Drept de acces", „GDPR — Ștergere date", „GDPR — Portabilitate"
                </p>
              </div>
            </Section>

            {/* 6 */}
            <Section number="6" title="Acordul de Prelucrare a Datelor (APD / DPA) pentru clienții B2B">
              <p>
                Conform Art. 28 GDPR, atunci când un Operator (stația ITP) utilizează un Împuternicit
                (SC VOID SFT GAMES SRL / Velos) pentru prelucrarea datelor cu caracter personal ale
                clienților săi finali, relația trebuie reglementată printr-un <strong>Acord de Prelucrare
                a Datelor (APD)</strong> în formă scrisă.
              </p>
              <p>
                APD-ul este integrat în Termenii și Condițiile platformei Velos (Secțiunea 11 — Acord de
                Prelucrare a Datelor). Prin acceptarea Termenilor și Condițiilor la înregistrarea contului,
                stația ITP (Operatorul) și SC VOID SFT GAMES SRL (Împuternicitul) încheie automat un APD
                valabil conform Art. 28 GDPR.
              </p>
              <div className="mt-3 overflow-x-auto rounded-xl border border-[#E5E7EB]">
                <table className="w-full text-xs text-[#374151]">
                  <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-[#111318]">Cerință Art. 28(3) GDPR</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#111318]">Cum este îndeplinită de Velos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Prelucrare numai pe baza instrucțiunilor documentate ale Operatorului", "Platforma procesează datele clienților finali exclusiv conform acțiunilor efectuate de stația ITP"],
                      ["Confidențialitate — persoanele autorizate se angajează la confidențialitate", "Toți angajații și colaboratorii sunt obligați prin clauze de confidențialitate contractuale"],
                      ["Măsuri de securitate adecvate [Art. 32]", "TLS 1.3, AES-256, bcrypt, RLS, backup, monitorizare — detaliate în Politica de Confidențialitate"],
                      ["Respectarea condițiilor pentru sub-împuterniciți", "Lista sub-împuterniciților este publicată și actualizată. Notificare cu 30 zile înainte de schimbări"],
                      ["Asistență pentru exercitarea drepturilor persoanelor vizate", "Funcționalități platformă pentru export, ștergere, rectificare date clienți finali"],
                      ["Ștergerea / returnarea datelor la finalul contractului", "La reziliere, datele sunt exportabile 30 zile, apoi șterse în 90 zile"],
                      ["Punerea la dispoziție a informațiilor pentru audituri", "La cerere scrisă, furnizăm documentație privind conformitatea GDPR"],
                    ].map(([cerinta, implementare], i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F9FAFB]"}>
                        <td className="px-4 py-3 align-top font-medium">{cerinta}</td>
                        <td className="px-4 py-3 align-top text-[#6B7280]">{implementare}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-[#6B7280]">
                Textul complet al APD-ului se regăsește în{" "}
                <Link href="/termeni" className="text-[#1877F2] hover:underline">
                  Termenii și Condițiile platformei
                </Link>{" "}
                (Secțiunea 11). La cerere, APD-ul poate fi furnizat și ca document separat semnat.
                Contactați-ne la <strong>contact@velos.ro</strong>.
              </p>
            </Section>

            {/* 7 */}
            <Section number="7" title="Evidența activităților de prelucrare (Registrul GDPR)">
              <p>
                Conform Art. 30 GDPR, SC VOID SFT GAMES SRL ține o <strong>evidență scrisă a activităților
                de prelucrare</strong> (Registrul de prelucrare) care documentează:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Denumirea și datele de contact ale operatorului</li>
                <li>Scopurile prelucrării pentru fiecare activitate</li>
                <li>Categoriile de persoane vizate și categoriile de date</li>
                <li>Categoriile de destinatari și transferuri internaționale</li>
                <li>Termenele de ștergere sau retenție</li>
                <li>Descrierea măsurilor de securitate aplicate</li>
              </ul>
              <p className="mt-3">
                Registrul este un document intern, pus la dispoziția ANSPDCP la solicitare conform
                Art. 30 alin. (4) GDPR. Un rezumat al activităților principale de prelucrare este
                disponibil în{" "}
                <Link href="/confidentialitate" className="text-[#1877F2] hover:underline">
                  Politica de Confidențialitate
                </Link>{" "}
                (Secțiunea 3 — Tabelele de categorii de date).
              </p>
            </Section>

            {/* 8 */}
            <Section number="8" title="Evaluarea impactului asupra protecției datelor (DPIA)">
              <p>
                Conform Art. 35 GDPR, efectuăm o <strong>Evaluare a Impactului asupra Protecției Datelor
                (DPIA)</strong> înainte de orice operațiune de prelucrare care poate genera un risc ridicat
                pentru drepturile și libertățile persoanelor fizice.
              </p>
              <p>
                Categoriile de prelucrare care pot necesita DPIA conform liniilor directoare EDPB WP248:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Prelucrare la scară largă de date sensibile</li>
                <li>Prelucrare sistematică și extinsă bazată pe profilare automată</li>
                <li>Monitorizare sistematică a persoanelor în spații publice</li>
              </ul>
              <p className="mt-2">
                Platforma Velos nu efectuează prelucrări care să necesite obligatoriu DPIA conform criteriilor
                EDPB. Monitorizăm continuu activitățile de prelucrare și efectuăm DPIA ori de câte ori
                introducem funcționalități noi cu potențial risc ridicat.
              </p>
            </Section>

            {/* 9 */}
            <Section number="9" title="Notificarea încălcărilor de securitate (Data Breach)">
              <p>
                În cazul unui incident de securitate care implică date cu caracter personal, SC VOID SFT GAMES
                SRL respectă obligațiile prevăzute de Art. 33 și Art. 34 GDPR:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div className="border border-[#FCA5A5] bg-[#FEF2F2] rounded-xl p-4">
                  <p className="font-bold text-[#991B1B] text-sm mb-2">Notificare ANSPDCP [Art. 33]</p>
                  <p className="text-xs text-[#7F1D1D] leading-relaxed">
                    În termen de <strong>72 de ore</strong> de la constatarea incidentului care prezintă
                    risc pentru drepturile persoanelor fizice, notificăm ANSPDCP cu toate detaliile
                    disponibile (natura incidentului, date afectate, persoane implicate, măsuri luate).
                  </p>
                </div>
                <div className="border border-[#FDE68A] bg-[#FFFBEB] rounded-xl p-4">
                  <p className="font-bold text-[#92400E] text-sm mb-2">Notificare persoane vizate [Art. 34]</p>
                  <p className="text-xs text-[#78350F] leading-relaxed">
                    Dacă incidentul prezintă un <strong>risc ridicat</strong> pentru drepturile și
                    libertățile dumneavoastră, vă vom notifica <strong>fără întârzieri nejustificate</strong>
                    prin email, cu descrierea clară a incidentului și a măsurilor recomandate.
                  </p>
                </div>
              </div>
              <p className="mt-3">
                Menținem un <strong>registru intern al incidentelor de securitate</strong> conform Art. 33
                alin. (5) GDPR, inclusiv pentru incidentele care nu necesită notificarea autorității.
              </p>
            </Section>

            {/* 10 */}
            <Section number="10" title="Obligațiile stației ITP ca Operator de date">
              <p>
                Stațiile ITP care utilizează platforma Velos prelucrează date cu caracter personal ale
                clienților lor finali în calitate de <strong>Operator independent</strong>. Prin urmare,
                stația ITP are următoarele obligații proprii conform GDPR:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>
                  <strong>Informarea clienților finali [Art. 13 GDPR]:</strong> Stația ITP trebuie să
                  informeze clienții finali despre prelucrarea datelor lor (prin afișaj la recepție,
                  formular de programare, etc.).
                </li>
                <li>
                  <strong>Temeiul legal pentru prelucrare:</strong> Stația ITP trebuie să identifice
                  și să documenteze temeiul legal pentru fiecare prelucrare (contract, consimțământ,
                  obligație legală, interes legitim).
                </li>
                <li>
                  <strong>Consimțământ pentru SMS-uri [Legea 506/2004]:</strong> Trimiterea de SMS-uri
                  cu caracter comercial (remindere, oferte) necesită consimțământul explicit al
                  destinatarului. Platforma Velos oferă funcționalitatea de gestionare a opt-in/opt-out
                  SMS per client (câmpul <code className="bg-[#F3F4F6] px-1 rounded font-mono text-xs">sms_optin</code>
                  din profilul clientului).
                </li>
                <li>
                  <strong>Durata de retenție:</strong> Stația ITP stabilește propria politică de
                  retenție a datelor clienților finali și poate exporta sau șterge datele din platformă.
                </li>
                <li>
                  <strong>Răspuns la cereri GDPR ale clienților finali:</strong> Stația ITP este
                  responsabilă de răspunsul la cererile GDPR ale clienților săi finali. SC VOID SFT GAMES
                  SRL oferă asistență tehnică prin funcționalitățile platformei.
                </li>
              </ul>
              <p className="mt-3 text-xs text-[#6B7280]">
                SC VOID SFT GAMES SRL pune la dispoziția stațiilor ITP documentație și suport pentru
                conformitatea GDPR. Contactați-ne la <strong>contact@velos.ro</strong> pentru asistență.
              </p>
            </Section>

            {/* 11 */}
            <Section number="11" title="Autoritatea de supraveghere. Dreptul de a depune plângere">
              <p>
                Fără a aduce atingere oricărei alte căi de atac administrative sau judiciare, aveți
                dreptul de a depune o plângere la autoritatea de supraveghere competentă conform
                Art. 77 GDPR și Art. 8 din Legea 190/2018:
              </p>
              <div className="mt-4 border border-[#E5E7EB] rounded-xl overflow-hidden">
                <div className="bg-[#F9FAFB] px-5 py-3 border-b border-[#E5E7EB]">
                  <p className="font-bold text-[#111318] text-sm">
                    Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal
                    (ANSPDCP)
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                  {[
                    ["Adresă", "Bd. G-ral. Gheorghe Magheru nr. 28-30, Sector 1, 010336 București"],
                    ["Telefon", "+40 318 059 211"],
                    ["Email", "anspdcp@dataprotection.ro"],
                    ["Website", "www.dataprotection.ro"],
                    ["Formular online", "dataprotection.ro/pages/page.aspx?id=4"],
                    ["Program", "Luni – Vineri, 09:00 – 17:00"],
                  ].map(([label, value], i) => (
                    <div key={i} className={`flex gap-4 px-5 py-2.5 text-xs border-b border-[#F3F4F6] ${i % 2 === 0 ? "bg-white" : "bg-[#F9FAFB]"}`}>
                      <span className="font-semibold text-[#111318] w-32 shrink-0">{label}</span>
                      <span className="text-[#374151]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-4">
                Vă încurajăm să ne contactați în primul rând direct la{" "}
                <strong>contact@velos.ro</strong> pentru a rezolva orice problemă legată de
                protecția datelor. Suntem angajați să găsim o soluție amiabilă în cel mai scurt
                timp posibil.
              </p>
            </Section>

            {/* 12 */}
            <Section number="12" title="Documente conexe">
              <p>
                Această pagină face parte dintr-un set complet de documente de conformitate GDPR:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {[
                  {
                    title: "Termeni și Condiții",
                    desc: "Contractul de utilizare a platformei, inclusiv APD (Art. 28 GDPR)",
                    href: "/termeni",
                  },
                  {
                    title: "Politica de Confidențialitate",
                    desc: "Detalii complete despre datele colectate, scopuri, temeie legale, subprocesori",
                    href: "/confidentialitate",
                  },
                  {
                    title: "Politica de Cookies",
                    desc: "Lista completă a cookie-urilor, categorii, durată, gestionare consimțământ",
                    href: "/cookies",
                  },
                  {
                    title: "Contact GDPR",
                    desc: "contact@velos.ro — Subiect: GDPR — [dreptul solicitat]",
                    href: "mailto:contact@velos.ro",
                  },
                ].map((doc) => (
                  <Link
                    key={doc.title}
                    href={doc.href}
                    className="border border-[#E5E7EB] rounded-xl p-4 bg-[#F9FAFB] hover:bg-[#EFF6FF] hover:border-[#BFDBFE] transition-colors group block"
                  >
                    <p className="font-semibold text-[#111318] text-sm group-hover:text-[#1877F2] transition-colors mb-1">
                      {doc.title} →
                    </p>
                    <p className="text-xs text-[#6B7280] leading-relaxed">{doc.desc}</p>
                  </Link>
                ))}
              </div>
            </Section>

            {/* Footer info */}
            <div className="mt-6 pt-6 border-t border-[#E5E7EB] text-xs text-[#9CA3AF] text-center">
              SC VOID SFT GAMES SRL &mdash; CUI 43474393 &mdash; Strada Progresului, Nr. 2, România
              &mdash; contact@velos.ro &mdash; 0757 941 553
            </div>

          </div>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
