import LandingNavbar from "@/components/landing/navbar";
import LandingFooter from "@/components/landing/footer";

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

function CategoryCard({
  color,
  label,
  badge,
  description,
  temei,
  children,
}: {
  color: string;
  label: string;
  badge: string;
  description: string;
  temei: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`border rounded-xl overflow-hidden ${color}`}>
      <div className="px-5 py-4 border-b">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-bold text-[#111318] text-sm">{label}</h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-[#E5E7EB] text-[#374151]">
            {badge}
          </span>
        </div>
        <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed">{description}</p>
        <p className="text-xs text-[#9CA3AF] mt-1 italic">Temei legal: {temei}</p>
      </div>
      <div className="px-5 py-3 bg-white">{children}</div>
    </div>
  );
}

function CookieRow({
  name,
  furnizor,
  scop,
  durata,
  tip,
}: {
  name: string;
  furnizor: string;
  scop: string;
  durata: string;
  tip: string;
}) {
  return (
    <tr className="border-b border-[#F3F4F6] last:border-0">
      <td className="py-2.5 pr-3 font-mono text-xs font-semibold text-[#1877F2] align-top">{name}</td>
      <td className="py-2.5 pr-3 text-xs text-[#6B7280] align-top">{furnizor}</td>
      <td className="py-2.5 pr-3 text-xs text-[#374151] align-top">{scop}</td>
      <td className="py-2.5 pr-3 text-xs text-[#6B7280] align-top whitespace-nowrap">{durata}</td>
      <td className="py-2.5 text-xs align-top">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tip === "Session" ? "bg-[#F3F4F6] text-[#6B7280]" : "bg-[#EFF6FF] text-[#1877F2]"}`}>
          {tip}
        </span>
      </td>
    </tr>
  );
}

function BrowserCard({
  name,
  steps,
  link,
}: {
  name: string;
  steps: string;
  link: string;
}) {
  return (
    <div className="border border-[#E5E7EB] rounded-xl p-4 bg-white">
      <p className="font-semibold text-[#111318] text-sm mb-1">{name}</p>
      <p className="text-xs text-[#6B7280] leading-relaxed mb-2">{steps}</p>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-[#1877F2] hover:underline break-all"
      >
        {link}
      </a>
    </div>
  );
}

export default function CookiesPage() {
  return (
    <>
      <LandingNavbar />
      <main className="bg-[#F7F8FA] min-h-screen pt-8 pb-20">
        <div className="max-w-4xl mx-auto px-6">

          {/* Header */}
          <div className="mb-10">
            <p className="text-xs font-semibold text-[#1877F2] uppercase tracking-widest mb-2">Legal</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0A0F1E] mb-3">
              Politica de Cookies
            </h1>
            <p className="text-sm text-[#6B7280]">
              Versiunea 1.0 &mdash; Ultima actualizare:{" "}
              <strong className="text-[#374151]">14 mai 2025</strong>
            </p>
            <div className="mt-4 p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-sm text-[#1E40AF] leading-relaxed">
              Această politică descrie modul în care SC VOID SFT GAMES SRL utilizează cookie-uri și tehnologii
              similare pe platforma <strong>velos.ro</strong>, în conformitate cu{" "}
              <strong>Legea nr. 506/2004</strong> privind prelucrarea datelor cu caracter personal și protecția
              vieții private în sectorul comunicațiilor electronice (transpunerea Directivei ePrivacy
              2002/58/CE, modificată prin 2009/136/CE) și cu <strong>GDPR (UE) 2016/679</strong>.
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 sm:p-10">

            {/* 1 */}
            <Section number="1" title="Ce sunt cookie-urile?">
              <p>
                Un <strong>cookie</strong> este un fișier text de dimensiune mică pe care un site web îl stochează
                în browserul dumneavoastră când îl vizitați. Cookie-urile sunt utilizate pe scară largă pentru a
                face site-urile să funcționeze sau să funcționeze mai eficient, precum și pentru a oferi informații
                proprietarilor site-ului.
              </p>
              <p>
                Pe lângă cookie-uri clasice (HTTP cookies), folosim și tehnologii similare:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>
                  <strong>localStorage / sessionStorage</strong> — stocare locală în browser pentru preferințe
                  de interfață și starea sesiunii de utilizare.
                </li>
                <li>
                  <strong>Pixeli de urmărire</strong> — imagini de 1×1 pixel care pot fi încorporate în pagini
                  sau emailuri pentru a înregistra o acțiune (nu sunt utilizați în prezent).
                </li>
                <li>
                  <strong>Fingerprinting de browser</strong> — nu utilizăm această tehnologie.
                </li>
              </ul>
              <p>
                Cookie-urile pot fi:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>
                  <strong>De sesiune (Session)</strong> — șterse automat când închideți browserul.
                </li>
                <li>
                  <strong>Persistente (Persistent)</strong> — rămân pe dispozitivul dumneavoastră până la
                  expirarea lor sau până când le ștergeți manual.
                </li>
                <li>
                  <strong>Primare (First-party)</strong> — plasate de velos.ro direct.
                </li>
                <li>
                  <strong>Terțe (Third-party)</strong> — plasate de domenii externe (de ex. Google Analytics).
                </li>
              </ul>
            </Section>

            {/* 2 */}
            <Section number="2" title="De ce folosim cookie-uri?">
              <p>
                Folosim cookie-uri pentru a:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Menține sesiunea autentificată și a asigura securitatea contului</li>
                <li>Reține preferințele dumneavoastră de interfață (limbă, tema, stație activă)</li>
                <li>Înțelege cum este utilizată platforma și îmbunătăți funcționalitățile</li>
                <li>Preveni frauda și asigura securitatea platformei</li>
                <li>Măsura eficiența paginilor de prezentare (landing page)</li>
              </ul>
            </Section>

            {/* 3 */}
            <Section number="3" title="Categoriile de cookie-uri utilizate">
              <div className="space-y-5">

                {/* Strict necesare */}
                <CategoryCard
                  color="border-[#059669]/20 bg-[#F0FDF4]"
                  label="Cookie-uri strict necesare"
                  badge="Fără consimțământ"
                  description="Esențiale pentru funcționarea platformei. Nu pot fi dezactivate fără a afecta funcționalitățile de bază (autentificare, securitate, sesiune). Nu stochează informații personal identificabile dincolo de ce este strict necesar."
                  temei="Art. 4³ alin. (1) Legea 506/2004 — exceptare de la consimțământ pentru cookie-uri tehnic necesare"
                >
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#F3F4F6]">
                        <th className="text-left text-xs font-semibold text-[#9CA3AF] pb-2 pr-3">Nume</th>
                        <th className="text-left text-xs font-semibold text-[#9CA3AF] pb-2 pr-3">Furnizor</th>
                        <th className="text-left text-xs font-semibold text-[#9CA3AF] pb-2 pr-3">Scop</th>
                        <th className="text-left text-xs font-semibold text-[#9CA3AF] pb-2 pr-3">Durată</th>
                        <th className="text-left text-xs font-semibold text-[#9CA3AF] pb-2">Tip</th>
                      </tr>
                    </thead>
                    <tbody>
                      <CookieRow name="sb-access-token" furnizor="Supabase / velos.ro" scop="Token autentificare JWT — menține sesiunea activă" durata="1 oră" tip="Session" />
                      <CookieRow name="sb-refresh-token" furnizor="Supabase / velos.ro" scop="Reînnoire automată a sesiunii fără reautentificare" durata="60 zile" tip="Persistent" />
                      <CookieRow name="__session" furnizor="velos.ro" scop="Identificator sesiune server (Next.js)" durata="Session" tip="Session" />
                      <CookieRow name="csrf-token" furnizor="velos.ro" scop="Protecție împotriva atacurilor Cross-Site Request Forgery" durata="Session" tip="Session" />
                      <CookieRow name="cookie_consent" furnizor="velos.ro" scop="Reține preferințele dumneavoastră de consimțământ cookie-uri" durata="13 luni" tip="Persistent" />
                    </tbody>
                  </table>
                </CategoryCard>

                {/* Funcționale */}
                <CategoryCard
                  color="border-[#0891B2]/20 bg-[#ECFEFF]"
                  label="Cookie-uri funcționale"
                  badge="Consimțământ recomandat"
                  description="Permit platformei să rețină alegerile dumneavoastră și să ofere funcționalități îmbunătățite și personalizate. Dezactivarea lor poate afecta experiența de utilizare, dar nu împiedică accesul la funcțiile de bază."
                  temei="Art. 6(1)(a) GDPR — consimțământ; Art. 6(1)(f) GDPR — interes legitim (personalizare UX)"
                >
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#F3F4F6]">
                        <th className="text-left text-xs font-semibold text-[#9CA3AF] pb-2 pr-3">Nume</th>
                        <th className="text-left text-xs font-semibold text-[#9CA3AF] pb-2 pr-3">Furnizor</th>
                        <th className="text-left text-xs font-semibold text-[#9CA3AF] pb-2 pr-3">Scop</th>
                        <th className="text-left text-xs font-semibold text-[#9CA3AF] pb-2 pr-3">Durată</th>
                        <th className="text-left text-xs font-semibold text-[#9CA3AF] pb-2">Tip</th>
                      </tr>
                    </thead>
                    <tbody>
                      <CookieRow name="velos-statie-id" furnizor="velos.ro" scop="Rețin stația activă selectată de utilizator" durata="30 zile" tip="Persistent" />
                      <CookieRow name="velos-sidebar" furnizor="velos.ro" scop="Preferința de afișare sidebar (extins/restrâns)" durata="30 zile" tip="Persistent" />
                      <CookieRow name="velos-theme" furnizor="velos.ro" scop="Preferința temă interfață (light/dark)" durata="30 zile" tip="Persistent" />
                    </tbody>
                  </table>
                </CategoryCard>

                {/* Performanță / Analiză */}
                <CategoryCard
                  color="border-[#7C3AED]/20 bg-[#F5F3FF]"
                  label="Cookie-uri de performanță și analiză"
                  badge="Consimțământ obligatoriu"
                  description="Ne ajută să înțelegem cum interacționează vizitatorii cu platforma prin colectarea și raportarea de informații în mod anonim. Datele sunt utilizate pentru îmbunătățirea continuă a serviciului."
                  temei="Art. 6(1)(a) GDPR — consimțământ explicit; Art. 4³ alin. (2) Legea 506/2004"
                >
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#F3F4F6]">
                        <th className="text-left text-xs font-semibold text-[#9CA3AF] pb-2 pr-3">Nume</th>
                        <th className="text-left text-xs font-semibold text-[#9CA3AF] pb-2 pr-3">Furnizor</th>
                        <th className="text-left text-xs font-semibold text-[#9CA3AF] pb-2 pr-3">Scop</th>
                        <th className="text-left text-xs font-semibold text-[#9CA3AF] pb-2 pr-3">Durată</th>
                        <th className="text-left text-xs font-semibold text-[#9CA3AF] pb-2">Tip</th>
                      </tr>
                    </thead>
                    <tbody>
                      <CookieRow name="_ga" furnizor="Google Analytics" scop="Distinge utilizatorii unici prin atribuirea unui ID generat aleatoriu" durata="13 luni" tip="Persistent" />
                      <CookieRow name="_ga_XXXXXX" furnizor="Google Analytics" scop="Păstrează starea sesiunii pentru Google Analytics 4" durata="13 luni" tip="Persistent" />
                      <CookieRow name="_gid" furnizor="Google Analytics" scop="Distinge utilizatorii — durată scurtă" durata="24 ore" tip="Persistent" />
                      <CookieRow name="_gat" furnizor="Google Analytics" scop="Limitează rata de solicitări (throttle)" durata="1 minut" tip="Session" />
                    </tbody>
                  </table>
                  <p className="text-xs text-[#9CA3AF] mt-3">
                    Google Analytics este configurat cu anonimizarea IP activată (anonymizeIp). Nu transmitem date
                    personal identificabile către Google Analytics. Datele sunt procesate de Google LLC (SUA) conform
                    Clauzelor Contractuale Standard.
                  </p>
                </CategoryCard>

                {/* Marketing */}
                <CategoryCard
                  color="border-[#EA580C]/20 bg-[#FFF7ED]"
                  label="Cookie-uri de marketing și publicitate"
                  badge="Consimțământ obligatoriu"
                  description="Utilizate pentru a urmări vizitatorii pe site-uri și pentru a afișa reclame relevante. Aceste cookie-uri nu sunt active în mod implicit pe platforma Velos. Pot fi activate numai cu consimțământul dumneavoastră explicit."
                  temei="Art. 6(1)(a) GDPR — consimțământ explicit"
                >
                  <p className="text-xs text-[#6B7280]">
                    În prezent <strong>nu utilizăm cookie-uri de marketing/publicitate</strong> pe paginile interne
                    ale platformei. Dacă în viitor vom introduce astfel de cookie-uri (de ex. Meta Pixel, Google Ads),
                    această politică va fi actualizată și vă vom solicita consimțământul explicit înainte de
                    activarea lor.
                  </p>
                </CategoryCard>

              </div>
            </Section>

            {/* 4 */}
            <Section number="4" title="Cookie-uri terțe (third-party)">
              <p>
                Unele pagini ale platformei încorporează conținut sau funcționalități furnizate de terți, care pot
                plasa propriile cookie-uri pe dispozitivul dumneavoastră:
              </p>
              <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] mt-3">
                <table className="w-full text-xs text-[#374151]">
                  <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-[#111318]">Serviciu terț</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#111318]">Utilizare</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#111318]">Politica proprie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Google Maps", "Afișare hartă locație stație ITP (pagina de programări publice)", "policies.google.com/privacy"],
                      ["Google Analytics", "Statistici agregate de utilizare (cu consimțământ)", "policies.google.com/privacy"],
                      ["Supabase", "Autentificare și API backend — cookie-uri tehnice strict necesare", "supabase.com/privacy"],
                      ["Vercel", "Hosting CDN — cookie-uri de securitate și performanță", "vercel.com/legal/privacy-policy"],
                    ].map(([serviciu, utilizare, link], i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F9FAFB]"}>
                        <td className="px-4 py-3 font-medium align-top">{serviciu}</td>
                        <td className="px-4 py-3 align-top">{utilizare}</td>
                        <td className="px-4 py-3 align-top">
                          <span className="text-[#6B7280]">{link}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-[#6B7280]">
                Nu controlăm cookie-urile plasate de terți. Vă recomandăm să consultați politicile de
                confidențialitate ale fiecărui furnizor terț pentru detalii.
              </p>
            </Section>

            {/* 5 */}
            <Section number="5" title="Consimțământul dumneavoastră. Bannerul de cookies">
              <p>
                Conform Art. 4³ din Legea 506/2004 și Art. 6(1)(a) GDPR, cookie-urile care nu sunt strict necesare
                pot fi plasate <strong>numai cu consimțământul prealabil, informat, specific și liber exprimat</strong>{" "}
                al utilizatorului.
              </p>
              <p>
                La prima vizită pe velos.ro, va apărea un <strong>banner de consimțământ pentru cookie-uri</strong>{" "}
                care vă oferă opțiunile:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li><strong>Acceptă toate</strong> — permite cookie-urile funcționale, de analiză și marketing</li>
                <li><strong>Numai necesare</strong> — permite exclusiv cookie-urile strict necesare</li>
                <li><strong>Personalizează</strong> — alegeți individual categoriile pe care le acceptați</li>
              </ul>
              <p>
                Preferința dumneavoastră este salvată în cookie-ul <code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded text-xs font-mono">cookie_consent</code>{" "}
                timp de <strong>13 luni</strong>. La expirare, bannerul va apărea din nou.
              </p>
              <p>
                <strong>Retragerea consimțământului:</strong> Puteți modifica preferințele în orice moment
                accesând link-ul <strong>„Gestionează cookie-urile"</strong> din footer-ul site-ului sau
                scriind la <strong>contact@velos.ro</strong>. Retragerea nu afectează legalitatea prelucrării
                anterioare consimțământului.
              </p>
              <div className="mt-3 p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#92400E]">
                <strong>Important:</strong> Simpla navigare pe site sau închiderea bannerului fără a face o alegere
                nu constituie consimțământ conform GDPR și Legii 506/2004. Cookie-urile care necesită consimțământ
                nu sunt activate până la acordul explicit.
              </div>
            </Section>

            {/* 6 */}
            <Section number="6" title="Cum puteți controla și șterge cookie-urile din browser">
              <p>
                Indiferent de preferințele exprimate în bannerul nostru, puteți gestiona sau șterge cookie-urile
                direct din setările browserului dumneavoastră. Atenție: dezactivarea tuturor cookie-urilor poate
                afecta funcționalitățile platformei, inclusiv autentificarea.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <BrowserCard
                  name="Google Chrome"
                  steps="Setări → Confidențialitate și securitate → Cookie-uri și alte date ale site-urilor"
                  link="https://support.google.com/chrome/answer/95647"
                />
                <BrowserCard
                  name="Mozilla Firefox"
                  steps="Opțiuni → Confidențialitate și securitate → Cookie-uri și date despre site-uri"
                  link="https://support.mozilla.org/ro/kb/stergerea-cookie-urilor"
                />
                <BrowserCard
                  name="Microsoft Edge"
                  steps="Setări → Cookie-uri și permisiuni de site-uri → Cookie-uri și date stocate"
                  link="https://support.microsoft.com/ro-ro/microsoft-edge/cookie-uri"
                />
                <BrowserCard
                  name="Safari (macOS)"
                  steps="Preferințe → Confidențialitate → Gestionați datele site-ului web"
                  link="https://support.apple.com/ro-ro/guide/safari/sfri11471"
                />
                <BrowserCard
                  name="Safari (iOS)"
                  steps="Setări → Safari → Blocați toate cookie-urile"
                  link="https://support.apple.com/ro-ro/HT201265"
                />
                <BrowserCard
                  name="Opera"
                  steps="Setări → Confidențialitate și securitate → Cookie-uri"
                  link="https://help.opera.com/en/latest/web-preferences/#cookies"
                />
              </div>
              <p className="mt-4">
                <strong>Opt-out Google Analytics:</strong> Puteți dezactiva urmărirea Google Analytics pentru
                toate site-urile instalând extensia de browser{" "}
                <strong>Google Analytics Opt-out Browser Add-on</strong> disponibilă la{" "}
                <span className="font-mono text-xs bg-[#F3F4F6] px-1.5 py-0.5 rounded">tools.google.com/dlpage/gaoptout</span>.
              </p>
            </Section>

            {/* 7 */}
            <Section number="7" title="Cookie-uri pe dispozitive mobile">
              <p>
                Pe dispozitivele mobile, cookie-urile funcționează similar cu browserele desktop. Puteți gestiona
                permisiunile de cookie-uri din setările browserului mobil (Chrome, Safari, Firefox) conform
                instrucțiunilor de mai sus.
              </p>
              <p>
                Dacă accesați velos.ro printr-o aplicație mobilă nativă (în cazul în care va fi lansată),
                aceasta poate folosi tehnologii echivalente (ex. storage local al aplicației). Politica aplicabilă
                va fi menționată în mod distinct.
              </p>
            </Section>

            {/* 8 */}
            <Section number="8" title="Durata de stocare a cookie-urilor">
              <p>
                Duratele de stocare sunt specificate în tabelele din Secțiunea 3 pentru fiecare cookie individual.
                Ca regulă generală:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>Cookie-urile de sesiune sunt șterse automat la închiderea browserului.</li>
                <li>Cookie-urile de autentificare expiră la maxim <strong>60 de zile</strong> sau la delogare.</li>
                <li>Cookie-urile de preferințe sunt stocate maxim <strong>30 de zile</strong>.</li>
                <li>Cookie-urile de analiză (Google Analytics) sunt stocate maxim <strong>13 luni</strong>, conform
                  recomandărilor EDPB și ANSPDCP.</li>
                <li>Cookie-ul de consimțământ este stocat <strong>13 luni</strong>, după care bannerul va reapărea.</li>
              </ul>
            </Section>

            {/* 9 */}
            <Section number="9" title="Baza legală. Autoritatea de supraveghere">
              <p>
                Utilizarea cookie-urilor este reglementată în România de:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>
                  <strong>Legea nr. 506/2004</strong> privind prelucrarea datelor cu caracter personal și
                  protecția vieții private în sectorul comunicațiilor electronice, cu modificările ulterioare
                  (transpune Directiva 2002/58/CE — ePrivacy)
                </li>
                <li>
                  <strong>Regulamentul (UE) 2016/679 (GDPR)</strong> — pentru aspectele legate de date cu
                  caracter personal colectate prin cookie-uri
                </li>
                <li>
                  <strong>Liniile directoare ale EDPB</strong> (Comitetul European pentru Protecția Datelor)
                  privind consimțământul și cookie-urile
                </li>
              </ul>
              <p className="mt-3">
                Autoritatea competentă pentru Legea 506/2004 este{" "}
                <strong>ANCOM (Autoritatea Națională pentru Administrare și Reglementare în Comunicații)</strong>.
                Aspectele legate de prelucrarea datelor cu caracter personal prin cookie-uri cad și sub competența{" "}
                <strong>ANSPDCP</strong>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div className="border border-[#E5E7EB] rounded-xl p-4 bg-[#F9FAFB]">
                  <p className="font-semibold text-[#111318] text-sm mb-2">ANCOM</p>
                  <p className="text-xs text-[#6B7280]">Str. Delea Nouă nr. 2, Sector 3, București</p>
                  <p className="text-xs text-[#6B7280]">Tel: +40 21 305 7000</p>
                  <p className="text-xs text-[#6B7280]">www.ancom.ro</p>
                </div>
                <div className="border border-[#E5E7EB] rounded-xl p-4 bg-[#F9FAFB]">
                  <p className="font-semibold text-[#111318] text-sm mb-2">ANSPDCP</p>
                  <p className="text-xs text-[#6B7280]">Bd. G-ral. Gh. Magheru nr. 28-30, Sector 1, București</p>
                  <p className="text-xs text-[#6B7280]">Tel: +40 318 059 211</p>
                  <p className="text-xs text-[#6B7280]">www.dataprotection.ro</p>
                </div>
              </div>
            </Section>

            {/* 10 */}
            <Section number="10" title="Modificări ale Politicii de Cookies">
              <p>
                Putem actualiza această politică pentru a reflecta modificări în utilizarea cookie-urilor sau
                cerințele legale. Versiunea actualizată va fi publicată la{" "}
                <strong>velos.ro/cookies</strong> cu data ultimei actualizări.
              </p>
              <p>
                Pentru modificări semnificative (adăugare de noi categorii de cookie-uri sau furnizori terți care
                necesită consimțământ), vă vom notifica prin bannerul de cookies la următoarea vizită și, dacă
                aveți un cont activ, prin email.
              </p>
            </Section>

            {/* 11 */}
            <Section number="11" title="Contact">
              <p>
                Pentru orice întrebări privind utilizarea cookie-urilor pe platforma Velos:
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border border-[#E5E7EB] rounded-xl p-4 bg-[#F9FAFB]">
                  <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">Email</p>
                  <p className="font-semibold text-[#111318] text-sm">contact@velos.ro</p>
                  <p className="text-xs text-[#6B7280]">Subiect: Cookies — [întrebare]</p>
                </div>
                <div className="border border-[#E5E7EB] rounded-xl p-4 bg-[#F9FAFB]">
                  <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">Operator</p>
                  <p className="font-semibold text-[#111318] text-sm">SC VOID SFT GAMES SRL</p>
                  <p className="text-xs text-[#6B7280]">CUI 43474393 &mdash; Strada Progresului, Nr. 2</p>
                </div>
              </div>
            </Section>

          </div>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
