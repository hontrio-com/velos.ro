import LandingNavbar from "@/components/landing/navbar";
import LandingFooter from "@/components/landing/footer";

function Section({
  id,
  number,
  title,
  children,
}: {
  id?: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-10 scroll-mt-24">
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

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="font-semibold text-[#111318] mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DataTable({
  rows,
}: {
  rows: { categorie: string; exemple: string; temei: string; durata: string }[];
}) {
  return (
    <div className="overflow-x-auto mt-3 rounded-xl border border-[#E5E7EB]">
      <table className="w-full text-xs text-[#374151]">
        <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
          <tr>
            <th className="text-left px-4 py-3 font-semibold text-[#111318] w-[22%]">Categorie date</th>
            <th className="text-left px-4 py-3 font-semibold text-[#111318] w-[28%]">Exemple</th>
            <th className="text-left px-4 py-3 font-semibold text-[#111318] w-[28%]">Temei legal (GDPR)</th>
            <th className="text-left px-4 py-3 font-semibold text-[#111318] w-[22%]">Durată păstrare</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F9FAFB]"}>
              <td className="px-4 py-3 font-medium align-top">{r.categorie}</td>
              <td className="px-4 py-3 align-top">{r.exemple}</td>
              <td className="px-4 py-3 align-top">{r.temei}</td>
              <td className="px-4 py-3 align-top">{r.durata}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RightItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#E5E7EB] rounded-xl p-4 bg-white">
      <p className="font-semibold text-[#111318] mb-1">{title}</p>
      <p className="text-sm text-[#6B7280] leading-relaxed">{children}</p>
    </div>
  );
}

export default function ConfidentialitateePage() {
  return (
    <>
      <LandingNavbar />
      <main className="bg-[#F7F8FA] min-h-screen pt-8 pb-20">
        <div className="max-w-4xl mx-auto px-6">

          {/* Header */}
          <div className="mb-10">
            <p className="text-xs font-semibold text-[#1877F2] uppercase tracking-widest mb-2">Legal</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0A0F1E] mb-3">
              Politica de Confidențialitate
            </h1>
            <p className="text-sm text-[#6B7280]">
              Versiunea 1.0 &mdash; Ultima actualizare: <strong className="text-[#374151]">14 mai 2025</strong>
            </p>
            <div className="mt-4 p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-sm text-[#1E40AF] leading-relaxed">
              Această politică se aplică platformei Velos (velos.ro), operată de <strong>SC VOID SFT GAMES SRL</strong>,
              și descrie modul în care prelucrăm datele cu caracter personal în conformitate cu{" "}
              <strong>Regulamentul (UE) 2016/679 (GDPR)</strong> și <strong>Legea nr. 190/2018</strong> privind
              măsurile de punere în aplicare a GDPR în România.
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 sm:p-10">

            {/* 1. Identitatea Operatorului */}
            <Section number="1" title="Identitatea și datele de contact ale Operatorului">
              <p>
                Operatorul de date cu caracter personal în sensul Art. 4 alin. (7) GDPR este:
              </p>
              <div className="mt-3 border border-[#E5E7EB] rounded-xl overflow-hidden">
                {[
                  ["Denumire", "SC VOID SFT GAMES SRL"],
                  ["CUI", "43474393"],
                  ["Sediu social", "Strada Progresului, Nr. 2, România"],
                  ["Email contact", "contact@velos.ro"],
                  ["Telefon", "0757 941 553"],
                  ["Program", "Luni – Vineri, 09:00 – 18:00"],
                  ["Website", "velos.ro"],
                ].map(([label, value], i) => (
                  <div key={i} className={`flex gap-4 px-4 py-2.5 text-xs ${i % 2 === 0 ? "bg-white" : "bg-[#F9FAFB]"}`}>
                    <span className="font-semibold text-[#111318] w-40 shrink-0">{label}</span>
                    <span className="text-[#374151]">{value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3">
                <strong>Responsabil cu Protecția Datelor (DPO):</strong> SC VOID SFT GAMES SRL nu a desemnat un DPO
                obligatoriu conform Art. 37 GDPR, întrucât prelucrările efectuate nu intră în categoriile care impun
                desemnarea obligatorie. Orice solicitare privind protecția datelor poate fi adresată la adresa de
                email <strong>contact@velos.ro</strong> cu subiectul „GDPR".
              </p>
            </Section>

            {/* 2. Domeniu de aplicare */}
            <Section number="2" title="Domeniu de aplicare. Calitatea Operatorului și a Împuternicitului">
              <p>
                Platforma Velos este un serviciu de tip Software as a Service (SaaS) destinat persoanelor juridice
                (stații ITP). În acest context, SC VOID SFT GAMES SRL acționează în două calități distincte:
              </p>
              <SubSection title="2.1 Operator independent — pentru datele utilizatorilor platformei">
                <p>
                  Prelucrăm ca Operator datele reprezentanților legali, administratorilor și angajaților stațiilor ITP
                  care creează și utilizează un cont pe platforma Velos. Temeiul legal este Art. 6 alin. (1) lit. (b)
                  GDPR (executarea contractului de abonament).
                </p>
              </SubSection>
              <SubSection title="2.2 Împuternicit — pentru datele clienților finali ai stației ITP">
                <p>
                  Datele clienților finali (persoanele fizice care se programează la ITP) sunt introduse în platformă
                  de stația ITP în calitate de Operator. SC VOID SFT GAMES SRL prelucrează aceste date exclusiv în
                  calitate de <strong>Împuternicit (Data Processor)</strong> conform Art. 4 alin. (8) GDPR, în baza
                  Acordului de Prelucrare a Datelor (APD/DPA) inclus în Termenii și Condițiile platformei.
                </p>
                <p>
                  Stația ITP este responsabilă de asigurarea unui temei legal pentru colectarea datelor clienților
                  săi finali și de informarea acestora conform obligațiilor Art. 13 GDPR.
                </p>
              </SubSection>
            </Section>

            {/* 3. Date colectate */}
            <Section number="3" title="Ce date cu caracter personal prelucrăm">
              <SubSection title="3.1 Date ale utilizatorilor platformei (conturi Velos)">
                <DataTable
                  rows={[
                    {
                      categorie: "Date de identificare",
                      exemple: "Nume, prenume, adresă email, număr de telefon",
                      temei: "Art. 6(1)(b) — executarea contractului",
                      durata: "Pe durata contractului + 3 ani",
                    },
                    {
                      categorie: "Date firmă",
                      exemple: "Denumire societate, CUI, adresă sediu, nr. stație ITP",
                      temei: "Art. 6(1)(b) — executarea contractului; Art. 6(1)(c) — obligație legală (facturare)",
                      durata: "10 ani (obligații contabile)",
                    },
                    {
                      categorie: "Date de autentificare",
                      exemple: "Email, parolă hash (bcrypt), token sesiune",
                      temei: "Art. 6(1)(b) — executarea contractului",
                      durata: "Pe durata contului activ",
                    },
                    {
                      categorie: "Date de facturare",
                      exemple: "Adresă facturare, date plată (tokenizate prin procesator), istoricul facturilor",
                      temei: "Art. 6(1)(c) — obligație legală (Legea 227/2015, Legea 82/1991)",
                      durata: "10 ani",
                    },
                    {
                      categorie: "Date de utilizare",
                      exemple: "Acțiuni în platformă, funcții folosite, date de login",
                      temei: "Art. 6(1)(f) — interes legitim (securitate, îmbunătățire servicii)",
                      durata: "12 luni",
                    },
                    {
                      categorie: "Date tehnice",
                      exemple: "Adresă IP, browser, sistem de operare, cookies",
                      temei: "Art. 6(1)(f) — interes legitim (securitate) / Art. 6(1)(a) — consimțământ (cookies marketing)",
                      durata: "Cf. Politica Cookies",
                    },
                  ]}
                />
              </SubSection>
              <SubSection title="3.2 Date ale clienților finali ai stației ITP (prelucrate ca Împuternicit)">
                <DataTable
                  rows={[
                    {
                      categorie: "Identificare client",
                      exemple: "Nume, prenume, număr de telefon, email",
                      temei: "Determinat de stația ITP (Operator)",
                      durata: "Determinat de stația ITP",
                    },
                    {
                      categorie: "Date vehicul",
                      exemple: "Număr înmatriculare, marcă, model, an fabricație, tip, combustibil",
                      temei: "Determinat de stația ITP (Operator)",
                      durata: "Determinat de stația ITP",
                    },
                    {
                      categorie: "Programări și rezultate ITP",
                      exemple: "Data programării, rezultat inspecție, defecțiuni constatate",
                      temei: "Determinat de stația ITP (Operator)",
                      durata: "Determinat de stația ITP",
                    },
                    {
                      categorie: "Comunicări SMS",
                      exemple: "Conținut SMS, status livrare, număr destinatar",
                      temei: "Art. 6(1)(a) consimțământ sau Art. 6(1)(b) executarea serviciului — determinat de stația ITP",
                      durata: "12 luni",
                    },
                  ]}
                />
              </SubSection>
              <SubSection title="3.3 Date ale vizitatorilor paginii publice de programări (Smart Page)">
                <DataTable
                  rows={[
                    {
                      categorie: "Date programare online",
                      exemple: "Nume, telefon, număr înmatriculare, data aleasă",
                      temei: "Art. 6(1)(b) — pașii precontractuali (programare ITP)",
                      durata: "Determinat de stația ITP",
                    },
                    {
                      categorie: "Date tehnice",
                      exemple: "IP, browser, cookies tehnice",
                      temei: "Art. 6(1)(f) — interes legitim (securitate serviciu)",
                      durata: "30 zile",
                    },
                  ]}
                />
              </SubSection>
            </Section>

            {/* 4. Surse */}
            <Section number="4" title="Sursele datelor cu caracter personal">
              <p>Colectăm date din următoarele surse:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>
                  <strong>Direct de la dumneavoastră</strong> — prin formularul de înregistrare, configurarea contului,
                  completarea profilului stației, introducerea manuală a clienților și vehiculelor în platformă.
                </li>
                <li>
                  <strong>Automat, prin utilizarea platformei</strong> — log-uri de acces, adresă IP, cookie-uri
                  tehnice, date de sesiune.
                </li>
                <li>
                  <strong>De la clienții finali ai stației</strong> — prin formularul de programare online (Smart Page),
                  în cazul în care clientul final completează singur datele.
                </li>
                <li>
                  <strong>De la procesatorul de plăți</strong> — confirmarea tranzacției, identificatorul tokenizat
                  al metodei de plată.
                </li>
              </ul>
            </Section>

            {/* 5. Scopuri si temei */}
            <Section number="5" title="Scopurile prelucrării și temeiul legal">
              {[
                ["Crearea și gestionarea contului", "Executarea contractului de abonament", "Art. 6(1)(b)"],
                ["Furnizarea serviciilor platformei (CRM, programări, SMS, rapoarte)", "Executarea contractului", "Art. 6(1)(b)"],
                ["Facturare și arhivare contabilă", "Obligație legală (Legea 82/1991, Legea 227/2015)", "Art. 6(1)(c)"],
                ["Suport tehnic și rezolvarea incidentelor", "Executarea contractului / Interes legitim", "Art. 6(1)(b)/(f)"],
                ["Securitatea platformei și prevenirea fraudelor", "Interes legitim", "Art. 6(1)(f)"],
                ["Trimiterea de notificări tranzacționale (expirare abonament, facturi)", "Executarea contractului", "Art. 6(1)(b)"],
                ["Trimiterea de comunicări comerciale (noutăți, oferte Velos)", "Consimțământ", "Art. 6(1)(a)"],
                ["Statistici agregate și îmbunătățirea serviciului (date anonimizate)", "Interes legitim", "Art. 6(1)(f)"],
                ["Respectarea obligațiilor legale (răspuns la cereri autorități)", "Obligație legală", "Art. 6(1)(c)"],
              ].map(([scop, motiv, articol], i) => (
                <div key={i} className={`flex gap-4 px-4 py-2.5 text-xs rounded-lg ${i % 2 === 0 ? "bg-[#F9FAFB]" : "bg-white"} border border-[#F3F4F6]`}>
                  <span className="text-[#374151] flex-1">{scop}</span>
                  <span className="text-[#6B7280] w-56 shrink-0">{motiv}</span>
                  <span className="font-mono font-semibold text-[#1877F2] w-20 shrink-0 text-right">{articol}</span>
                </div>
              ))}
              <p className="mt-4 text-xs text-[#6B7280]">
                Acolo unde temeiul legal este <strong>consimțământul</strong> [Art. 6(1)(a)], aveți dreptul de a
                retrage consimțământul în orice moment, fără a afecta legalitatea prelucrării anterioare retragerii.
              </p>
            </Section>

            {/* 6. Destinatari */}
            <Section number="6" title="Destinatarii datelor. Subprocesori">
              <p>
                Nu vindem, nu închiriem și nu transferăm datele dumneavoastră unor terți în scopuri de marketing.
                Datele pot fi accesate de:
              </p>
              <SubSection title="6.1 Angajații și colaboratorii SC VOID SFT GAMES SRL">
                <p>
                  Exclusiv cei care au nevoie de acces pentru prestarea serviciilor (principiul „need to know").
                  Toți sunt obligați prin clauze de confidențialitate.
                </p>
              </SubSection>
              <SubSection title="6.2 Subprocesori tehnici (Împuterniciți)">
                <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] mt-2">
                  <table className="w-full text-xs text-[#374151]">
                    <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-[#111318]">Furnizor</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#111318]">Rol</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#111318]">Sediu</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#111318]">Garanție transfer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Supabase, Inc.", "Bază de date, autentificare, stocare fișiere", "SUA", "Clauze contractuale standard (SCC) — Art. 46 GDPR"],
                        ["Furnizor SMS (Twilio / SMSO / similar)", "Trimitere SMS-uri programări și remindere", "SUA/UE", "SCC sau sediu în UE"],
                        ["Vercel, Inc.", "Hosting aplicație web, CDN", "SUA", "Clauze contractuale standard (SCC)"],
                        ["Stripe, Inc.", "Procesare plăți (dacă aplicabil)", "SUA", "SCC + certificare PCI DSS"],
                        ["Google LLC", "Google Maps embed, Analytics (opțional)", "SUA", "SCC + Privacy Shield successor"],
                      ].map(([furnizor, rol, sediu, garantie], i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F9FAFB]"}>
                          <td className="px-4 py-3 font-medium align-top">{furnizor}</td>
                          <td className="px-4 py-3 align-top">{rol}</td>
                          <td className="px-4 py-3 align-top">{sediu}</td>
                          <td className="px-4 py-3 align-top">{garantie}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs text-[#6B7280]">
                  Lista subprocesorilor poate fi actualizată. Orice adăugare de subprocesori noi va fi notificată
                  cu cel puțin <strong>30 de zile</strong> înainte prin email sau notificare în platformă.
                  Utilizatorul are dreptul de a obiecta față de noul subprocesor.
                </p>
              </SubSection>
              <SubSection title="6.3 Autorități publice">
                <p>
                  Datele pot fi divulgate autorităților publice (ANAF, poliție, instanțe) exclusiv în temeiul
                  unei obligații legale sau al unui ordin judecătoresc, în volumul minim necesar.
                </p>
              </SubSection>
            </Section>

            {/* 7. Transferuri internaționale */}
            <Section number="7" title="Transferuri de date în afara Spațiului Economic European (SEE)">
              <p>
                Unii subprocesori (Supabase, Vercel) au servere sau sedii în Statele Unite ale Americii, o țară
                care nu beneficiază de o decizie de adecvare din partea Comisiei Europene în baza Art. 45 GDPR.
              </p>
              <p>
                Transferurile sunt efectuate cu garanții adecvate în baza{" "}
                <strong>Clauzelor Contractuale Standard (SCC)</strong> adoptate de Comisia Europeană prin Decizia
                de punere în aplicare (UE) 2021/914 din 4 iunie 2021, conform Art. 46 alin. (2) lit. (c) GDPR.
              </p>
              <p>
                Puteți solicita o copie a clauzelor contractuale standard aplicabile scriind la{" "}
                <strong>contact@velos.ro</strong>.
              </p>
            </Section>

            {/* 8. Durata */}
            <Section number="8" title="Durata păstrării datelor">
              <p>
                Păstrăm datele cu caracter personal numai atât timp cât este necesar pentru scopurile descrise
                și/sau cât prevede legea:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>
                  <strong>Date de cont și de utilizare:</strong> Pe durata relației contractuale. La reziliere,
                  contul este dezactivat, iar datele sunt șterse în termen de <strong>90 de zile</strong>, cu
                  excepția celor supuse unor obligații legale de arhivare.
                </li>
                <li>
                  <strong>Date de facturare și documente contabile:</strong> <strong>10 ani</strong> de la data
                  emiterii, conform Legii 82/1991 (Legea contabilității).
                </li>
                <li>
                  <strong>Log-uri tehnice și de securitate:</strong> <strong>12 luni</strong>, după care sunt
                  anonimizate sau șterse.
                </li>
                <li>
                  <strong>Date SMS (conținut, status):</strong> <strong>12 luni</strong> de la trimitere.
                </li>
                <li>
                  <strong>Cookie-uri:</strong> Conform Politicii de Cookies (durate variabile, maxim 13 luni
                  pentru cookie-uri de analiză).
                </li>
                <li>
                  <strong>Date prelucrate pe baza consimțământului:</strong> Până la retragerea consimțământului
                  sau cererea de ștergere, oricare survine mai devreme.
                </li>
              </ul>
              <p className="mt-3">
                La expirarea perioadelor de retenție, datele sunt șterse ireversibil sau anonimizate astfel
                încât să nu mai permită identificarea persoanei vizate.
              </p>
            </Section>

            {/* 9. Drepturile persoanelor vizate */}
            <Section number="9" title="Drepturile dumneavoastră ca persoană vizată">
              <p>
                Conform GDPR (Cap. III, Art. 15–22) și Legii 190/2018, aveți următoarele drepturi:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <RightItem title="Dreptul de acces (Art. 15)">
                  Aveți dreptul de a obține o confirmare că prelucrăm datele dumneavoastră și, dacă da, o copie a
                  acestora, împreună cu informații despre scopuri, categorii, destinatari și durata păstrării.
                </RightItem>
                <RightItem title="Dreptul la rectificare (Art. 16)">
                  Puteți solicita corectarea datelor inexacte sau completarea datelor incomplete, inclusiv prin
                  furnizarea unei declarații suplimentare.
                </RightItem>
                <RightItem title="Dreptul la ștergere (Art. 17)">
                  &bdquo;Dreptul de a fi uitat&rdquo; — puteți solicita ștergerea datelor în situațiile prevăzute
                  de Art. 17 GDPR (date nu mai sunt necesare, consimțământ retras, opoziție, prelucrare ilegală).
                  Nu se aplică dacă prelucrarea este necesară pentru obligații legale.
                </RightItem>
                <RightItem title="Dreptul la restricționarea prelucrării (Art. 18)">
                  Puteți solicita marcarea datelor pentru a limita prelucrarea lor viitoare, în condițiile Art. 18
                  (contestarea exactității, prelucrare ilegală, nevoie pentru constatarea drepturilor).
                </RightItem>
                <RightItem title="Dreptul la portabilitatea datelor (Art. 20)">
                  Aveți dreptul de a primi datele furnizate de dumneavoastră într-un format structurat, utilizat
                  curent și care poate fi citit automat (JSON, CSV) și de a le transmite altui operator, acolo unde
                  este tehnic posibil.
                </RightItem>
                <RightItem title="Dreptul la opoziție (Art. 21)">
                  Puteți obiecta în orice moment față de prelucrarea bazată pe interesul legitim [Art. 6(1)(f)].
                  Prelucrarea va înceta cu excepția cazului în care există motive legitime imperioase.
                </RightItem>
                <RightItem title="Dreptul de a nu face obiectul deciziilor automate (Art. 22)">
                  Aveți dreptul de a nu face obiectul unei decizii bazate exclusiv pe prelucrarea automată, inclusiv
                  profilarea, care produce efecte juridice sau vă afectează semnificativ. Velos nu ia astfel de
                  decizii automate.
                </RightItem>
                <RightItem title="Retragerea consimțământului (Art. 7 alin. 3)">
                  Acolo unde prelucrarea se bazează pe consimțământ, îl puteți retrage oricând, fără a afecta
                  legalitatea prelucrării anterioare. Retragerea se face prin email la contact@velos.ro sau
                  din setările contului.
                </RightItem>
              </div>
              <SubSection title="Cum vă exercitați drepturile">
                <p>
                  Trimiteți o cerere scrisă la <strong>contact@velos.ro</strong> cu subiectul „Cerere GDPR —
                  [Dreptul solicitat]". Vom răspunde în termen de <strong>30 de zile calendaristice</strong>
                  de la primirea cererii (termen care poate fi prelungit cu maximum 60 de zile suplimentare în
                  cazuri complexe, cu notificarea dumneavoastră).
                </p>
                <p>
                  Cererea este gratuită. Dacă cererile sunt vădit nefondate sau excesive (în special datorită
                  caracterului lor repetitiv), putem percepe o taxă rezonabilă sau refuza cererea, cu motivare.
                </p>
                <p>
                  Vom solicita verificarea identității dumneavoastră înainte de a procesa cererea, pentru
                  a preveni divulgarea datelor unor terți neautorizați.
                </p>
              </SubSection>
            </Section>

            {/* 10. Securitate */}
            <Section number="10" title="Măsuri de securitate a datelor">
              <p>
                Implementăm măsuri tehnice și organizatorice adecvate pentru a proteja datele cu caracter personal
                împotriva accesului neautorizat, distrugerii, pierderii, modificării sau divulgării, conform
                Art. 25 (Privacy by Design) și Art. 32 GDPR:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>Criptarea datelor în tranzit prin <strong>HTTPS/TLS 1.3</strong></li>
                <li>Criptarea datelor stocate în repaus (AES-256) prin Supabase</li>
                <li>Parole stocate exclusiv ca hash-uri securizate (<strong>bcrypt</strong>)</li>
                <li>Autentificare cu doi factori (2FA) disponibilă pentru utilizatori</li>
                <li>Controlul accesului bazat pe roluri (RBAC) — Row Level Security (RLS) la nivel de bază de date</li>
                <li>Backup-uri automate criptate, cu retenție de 7 zile</li>
                <li>Monitorizare permanentă a incidentelor de securitate</li>
                <li>Restricții de acces intern (principiul „need to know")</li>
                <li>Evaluarea periodică a vulnerabilităților</li>
              </ul>
              <p className="mt-3">
                <strong>Notificarea încălcărilor de securitate:</strong> În cazul unui incident de securitate
                care prezintă un risc pentru drepturile și libertățile persoanelor vizate, vom notifica
                <strong> ANSPDCP în termen de 72 de ore</strong> (Art. 33 GDPR) și persoanele vizate afectate
                fără întârzieri nejustificate (Art. 34 GDPR), dacă riscul este ridicat.
              </p>
            </Section>

            {/* 11. Cookies */}
            <Section number="11" title="Cookie-uri și tehnologii similare">
              <p>
                Platforma Velos utilizează cookie-uri și tehnologii similare (localStorage, sesiuni). Categoriile
                principale sunt:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>
                  <strong>Cookie-uri strict necesare:</strong> Esențiale pentru funcționarea platformei
                  (sesiune autentificare, preferințe UI). Nu necesită consimțământ (Legea 506/2004, Art. 4³).
                </li>
                <li>
                  <strong>Cookie-uri de performanță/analiză:</strong> Ne ajută să înțelegem cum este folosită
                  platforma (date agregate, anonimizate). Necesită consimțământ.
                </li>
                <li>
                  <strong>Cookie-uri de marketing:</strong> Nu utilizăm cookie-uri de marketing pe paginile
                  interne ale platformei. Pe pagina de prezentare (landing page) pot fi utilizate, cu
                  consimțământul dumneavoastră.
                </li>
              </ul>
              <p className="mt-3">
                Detalii complete privind fiecare cookie, durata și gestionarea preferințelor se găsesc în
                <strong> Politica de Cookies</strong> (velos.ro/cookies).
              </p>
            </Section>

            {/* 12. Marketing */}
            <Section number="12" title="Comunicări de marketing">
              <p>
                Trimitem comunicări comerciale (noutăți despre platformă, oferte, ghiduri) exclusiv utilizatorilor
                care și-au exprimat consimțământul explicit la înregistrare sau ulterior, conform Art. 6(1)(a) GDPR
                și Art. 12 din Legea 506/2004.
              </p>
              <p>
                Vă puteți dezabona oricând prin:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Link-ul „Dezabonare" din orice email comercial</li>
                <li>Setările contului Velos → Notificări → Marketing</li>
                <li>Email la <strong>contact@velos.ro</strong> cu subiectul „Dezabonare marketing"</li>
              </ul>
              <p className="mt-2">
                Dezabonarea de la comunicările de marketing nu afectează notificările tranzacționale necesare
                prestării serviciului (facturi, expirare abonament, alerte tehnice).
              </p>
            </Section>

            {/* 13. Minori */}
            <Section number="13" title="Date cu privire la minori">
              <p>
                Platforma Velos este destinată exclusiv persoanelor cu vârsta de cel puțin <strong>18 ani</strong>{" "}
                sau persoanelor juridice reprezentate de persoane cu vârsta legală. Nu colectăm în mod intenționat
                date cu caracter personal de la minori sub 16 ani (vârsta consimțământului digital conform Art. 8 GDPR
                coroborat cu Legea 190/2018).
              </p>
              <p>
                Dacă descoperim că am colectat din greșeală date ale unui minor, le vom șterge prompt. Ne puteți
                notifica la <strong>contact@velos.ro</strong>.
              </p>
            </Section>

            {/* 14. Link-uri externe */}
            <Section number="14" title="Link-uri către site-uri terțe">
              <p>
                Platforma poate conține link-uri către site-uri externe (Google Maps, ANPC, etc.). Această politică
                se aplică exclusiv datelor prelucrate de SC VOID SFT GAMES SRL. Nu suntem responsabili de practicile
                de confidențialitate ale site-urilor terțe. Vă recomandăm să consultați politicile de
                confidențialitate ale acestora.
              </p>
            </Section>

            {/* 15. Modificări */}
            <Section number="15" title="Modificări ale Politicii de Confidențialitate">
              <p>
                Putem actualiza periodic această politică pentru a reflecta modificări ale serviciilor, cerințelor
                legale sau practicilor de prelucrare a datelor. Versiunea actualizată va fi publicată la
                <strong> velos.ro/confidentialitate</strong> cu menționarea datei ultimei actualizări.
              </p>
              <p>
                Pentru modificările semnificative (care afectează drepturile dumneavoastră sau scopurile prelucrării),
                vă vom notifica prin email sau printr-un banner vizibil în platformă cu cel puțin{" "}
                <strong>14 zile înainte</strong> de intrarea în vigoare, oferindu-vă posibilitatea de a obiecta
                sau de a rezilia contractul dacă nu sunteți de acord.
              </p>
              <p>
                Continuarea utilizării platformei după intrarea în vigoare a noii versiuni constituie acceptarea
                tacită a modificărilor.
              </p>
            </Section>

            {/* 16. ANSPDCP */}
            <Section number="16" title="Dreptul de a depune o plângere la autoritatea de supraveghere">
              <p>
                Fără a aduce atingere oricărei alte căi de atac administrative sau judiciare, aveți dreptul de a
                depune o plângere la autoritatea de supraveghere competentă, în conformitate cu Art. 77 GDPR:
              </p>
              <div className="mt-3 border border-[#E5E7EB] rounded-xl overflow-hidden">
                {[
                  ["Autoritate", "Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)"],
                  ["Adresă", "Bd. G-ral. Gheorghe Magheru nr. 28-30, Sector 1, 010336 București"],
                  ["Telefon", "+40 318 059 211"],
                  ["Email", "anspdcp@dataprotection.ro"],
                  ["Website", "www.dataprotection.ro"],
                ].map(([label, value], i) => (
                  <div key={i} className={`flex gap-4 px-4 py-2.5 text-xs ${i % 2 === 0 ? "bg-white" : "bg-[#F9FAFB]"}`}>
                    <span className="font-semibold text-[#111318] w-28 shrink-0">{label}</span>
                    <span className="text-[#374151]">{value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3">
                Vă încurajăm să ne contactați în primul rând la <strong>contact@velos.ro</strong> pentru a
                încerca rezolvarea amiabilă a oricărei probleme legate de protecția datelor înainte de a vă
                adresa autorității de supraveghere.
              </p>
            </Section>

            {/* 17. Contact */}
            <Section number="17" title="Contact pentru probleme de protecția datelor">
              <p>
                Pentru orice întrebări, solicitări sau reclamații privind prelucrarea datelor cu caracter personal,
                ne puteți contacta:
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "Email", value: "contact@velos.ro", note: "Subiect: GDPR — [subiect]" },
                  { label: "Telefon", value: "0757 941 553", note: "Luni – Vineri, 09:00 – 18:00" },
                  { label: "Poștă", value: "Strada Progresului, Nr. 2", note: "SC VOID SFT GAMES SRL" },
                ].map((item) => (
                  <div key={item.label} className="border border-[#E5E7EB] rounded-xl p-4 bg-[#F9FAFB] text-center">
                    <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">{item.label}</p>
                    <p className="font-semibold text-[#111318] text-sm">{item.value}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">{item.note}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-[#9CA3AF]">
                SC VOID SFT GAMES SRL &mdash; CUI 43474393 &mdash; Strada Progresului, Nr. 2, România
              </p>
            </Section>

          </div>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
