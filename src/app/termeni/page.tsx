import LandingNavbar from "@/components/landing/navbar";
import LandingFooter from "@/components/landing/footer";

export const metadata = {
  title: "Termeni și Condiții | Velos",
  description:
    "Termenii și condițiile de utilizare a platformei Velos, serviciu furnizat de SC VOID SFT GAMES SRL.",
};

export default function TermeniPage() {
  return (
    <div className="bg-white">
      <LandingNavbar />
      <main className="max-w-4xl mx-auto px-6 py-16 sm:py-24">
        {/* Header */}
        <div className="mb-12">
          <p className="text-sm font-semibold text-[#1877F2] uppercase tracking-widest mb-3">
            Document legal
          </p>
          <h1 className="text-4xl font-bold text-[#0A0F1E] mb-4">
            Termeni și Condiții
          </h1>
          <p className="text-[#6B7280]">
            Ultima actualizare: <strong>14 mai 2025</strong>
          </p>
          <div className="mt-6 p-4 bg-[#FFF7ED] border border-[#FED7AA] rounded-xl">
            <p className="text-sm text-[#92400E]">
              Vă rugăm să citiți cu atenție acești Termeni și Condiții înainte
              de a utiliza platforma Velos. Prin crearea unui cont sau utilizarea
              oricărei funcții a platformei, confirmați că ați citit, înțeles și
              acceptat în întregime prevederile de mai jos.
            </p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none space-y-10 text-[#374151] leading-relaxed">

          {/* 1. Identificarea furnizorului */}
          <Section id="furnizor" title="1. Identificarea furnizorului de servicii">
            <p>
              Platforma <strong>Velos</strong>, accesibilă la adresa{" "}
              <strong>velos.ro</strong>, este operată de:
            </p>
            <table className="w-full text-sm border-collapse mt-4">
              <tbody>
                <TableRow label="Denumire societate" value="SC VOID SFT GAMES SRL" />
                <TableRow label="Cod unic de înregistrare (CUI)" value="43474393" />
                <TableRow label="Sediu social" value="Strada Progresului, Nr. 2, România" />
                <TableRow label="Adresă e-mail" value="contact@velos.ro" />
                <TableRow label="Număr de telefon" value="0757 941 553" />
                <TableRow label="Program asistență" value="Luni – Vineri, 09:00 – 18:00" />
              </tbody>
            </table>
            <p className="mt-4">
              Conform art. 5 din Legea nr. 365/2002 privind comerțul electronic,
              furnizorul pune la dispoziție aceste date de identificare în mod
              permanent și direct accesibil utilizatorilor.
            </p>
          </Section>

          {/* 2. Definiții */}
          <Section id="definitii" title="2. Definiții">
            <p>În înțelesul prezentului document, termenii de mai jos au următoarea semnificație:</p>
            <dl className="mt-4 space-y-3">
              <DefinitionItem term={"„Platforma\" / „Velos\""}>
                ansamblul serviciilor software de tip SaaS (Software as a Service)
                disponibile la velos.ro, inclusiv aplicația web, API-urile,
                funcționalitățile de CRM, programări online, SMS-uri automate și
                ITP Smart Page.
              </DefinitionItem>
              <DefinitionItem term={"„Furnizorul\""}>
                SC VOID SFT GAMES SRL, societate de drept român, operatorul
                platformei Velos.
              </DefinitionItem>
              <DefinitionItem term={"„Utilizatorul\" / „Clientul\""}>
                orice persoană fizică sau juridică (stație ITP, operator economic)
                care creează un cont pe platformă și utilizează serviciile Velos în
                scop profesional sau comercial.
              </DefinitionItem>
              <DefinitionItem term={"„Utilizatorul Final\""}>
                persoana fizică (proprietar de vehicul) care utilizează pagina de
                programare ITP Smart Page a unui Utilizator pentru a efectua o
                rezervare.
              </DefinitionItem>
              <DefinitionItem term={"„Contul\""}>
                setul de credențiale (e-mail și parolă) creat de Utilizator pentru
                accesarea platformei.
              </DefinitionItem>
              <DefinitionItem term={"„Abonamentul\""}>
                planul de servicii ales de Utilizator (Trial, Basic, Pro sau
                Enterprise), cu dreptul de acces la funcționalitățile corespunzătoare
                pe durata plătită.
              </DefinitionItem>
              <DefinitionItem term={"„Date cu caracter personal\""}>
                orice informație referitoare la o persoană fizică identificată sau
                identificabilă, prelucrată în cadrul sau prin intermediul platformei,
                în sensul Regulamentului (UE) 2016/679 (GDPR).
              </DefinitionItem>
              <DefinitionItem term={"„Operator\" (GDPR)"}>
                Utilizatorul platformei, care determină scopurile și mijloacele de
                prelucrare a datelor clienților săi finali.
              </DefinitionItem>
              <DefinitionItem term={"„Împuternicit\" (GDPR)"}>
                Furnizorul (SC VOID SFT GAMES SRL), care prelucrează datele cu
                caracter personal în numele Utilizatorului, conform instrucțiunilor
                acestuia.
              </DefinitionItem>
              <DefinitionItem term={"„SMS-uri\""}>
                mesajele text transmise prin intermediul platformei Velos către
                clienții finali ai Utilizatorului, în baza unui consimțământ valid.
              </DefinitionItem>
              <DefinitionItem term={"„Conținut\""}>
                orice text, imagine, date, informații sau materiale introduse în
                platformă de Utilizator sau de Utilizatorul Final.
              </DefinitionItem>
              <DefinitionItem term={"„Contractul\""}>
                acordul format din prezentele Termeni și Condiții, Politica de
                Confidențialitate, Politica de Cookies și orice alte documente
                publicate pe platformă, acceptate de Utilizator la momentul
                înregistrării.
              </DefinitionItem>
            </dl>
          </Section>

          {/* 3. Obiectul contractului */}
          <Section id="obiect" title="3. Obiectul contractului">
            <p>
              Velos pune la dispoziția Utilizatorilor o platformă SaaS de
              management dedicată stațiilor de inspecție tehnică periodică (ITP)
              din România. Serviciile includ, fără a se limita la:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-3">
              <li>
                <strong>CRM complet</strong> – gestionarea bazei de date a
                clienților, vehiculelor și istoricului intervențiilor;
              </li>
              <li>
                <strong>Programări online</strong> – calendar de programări,
                sloturi orare configurabile și confirmare automată;
              </li>
              <li>
                <strong>SMS-uri automate</strong> – trimiterea de mesaje de
                reamintire înainte de expirarea ITP-ului, confirmări de programare
                și notificări personalizate;
              </li>
              <li>
                <strong>ITP Smart Page</strong> – pagină de prezentare personalizată
                a stației, optimizată SEO, cu URL propriu de forma
                velos.ro/itp/[slug-statie], galerie foto, lista de servicii și
                prețuri, program de lucru și locație interactivă;
              </li>
              <li>
                <strong>Rapoarte și statistici</strong> – rapoarte financiare,
                statistici de programări, export PDF și CSV;
              </li>
              <li>
                <strong>Gestionarea angajaților</strong> – adăugarea și
                administrarea conturilor de personal.
              </li>
            </ul>
            <p className="mt-4">
              Furnizorul își rezervă dreptul de a adăuga, modifica sau întrerupe
              funcționalități ale platformei, cu notificarea prealabilă a
              Utilizatorilor activi, conform art. 14 din prezentele T&C.
            </p>
          </Section>

          {/* 4. Acceptarea termenilor */}
          <Section id="acceptare" title="4. Acceptarea termenilor și condiții de eligibilitate">
            <p>
              Utilizarea platformei Velos este condiționată de acceptarea
              integrală a prezentelor Termeni și Condiții. Prin bifarea căsuței
              de consimțământ la înregistrare și/sau prin utilizarea efectivă a
              platformei, Utilizatorul:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-3">
              <li>
                declară că a citit și înțeles integral prezentele T&C, Politica
                de Confidențialitate și Politica de Cookies;
              </li>
              <li>
                confirmă că are capacitate deplină de exercițiu (persoană fizică
                cu vârsta de cel puțin 18 ani) sau că acționează în numele unei
                persoane juridice cu drept de reprezentare legală;
              </li>
              <li>
                acceptă că utilizarea platformei în scop profesional exclude
                calitatea de „consumator" în sensul OUG 34/2014, serviciile
                Velos fiind destinate exclusiv activității comerciale/profesionale
                a stațiilor ITP.
              </li>
            </ul>
            <p className="mt-4">
              Dacă nu sunteți de acord cu oricare dintre prevederile prezentelor
              T&C, vă rugăm să nu creați un cont și să nu utilizați platforma.
            </p>
          </Section>

          {/* 5. Înregistrarea contului */}
          <Section id="cont" title="5. Crearea și securitatea contului">
            <p>
              5.1. Pentru a accesa serviciile Velos, Utilizatorul trebuie să
              creeze un cont furnizând informații corecte, complete și actualizate,
              inclusiv: nume, prenume, adresă de e-mail validă, număr de telefon
              și datele stației ITP.
            </p>
            <p className="mt-3">
              5.2. Utilizatorul este responsabil pentru menținerea
              confidențialității credențialelor de acces (e-mail și parolă) și
              pentru toate acțiunile efectuate din contul său. Furnizorul nu va
              fi răspunzător pentru pierderile cauzate de accesul neautorizat
              al terților ca urmare a nerespectării acestei obligații.
            </p>
            <p className="mt-3">
              5.3. În cazul suspiciunii de acces neautorizat, Utilizatorul are
              obligația de a notifica imediat Furnizorul la{" "}
              <strong>contact@velos.ro</strong>.
            </p>
            <p className="mt-3">
              5.4. Furnizorul își rezervă dreptul de a suspenda sau șterge
              conturile pentru care există indicii de activitate frauduloasă,
              abuzivă sau contrară prezentelor T&C, fără obligația de
              preaviz și fără nicio responsabilitate față de Utilizator.
            </p>
            <p className="mt-3">
              5.5. Un Utilizator poate gestiona una sau mai multe stații ITP,
              în funcție de planul de abonament ales. Datele introduse de
              Utilizator trebuie să corespundă realității; Furnizorul nu verifică
              autorizația RAR sau orice altă calitate profesională a Utilizatorului.
            </p>
          </Section>

          {/* 6. Planuri și prețuri */}
          <Section id="preturi" title="6. Planuri de abonament și prețuri">
            <p>
              6.1. Velos oferă următoarele planuri de abonament:
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm border border-[#E5E7EB] rounded-xl overflow-hidden">
                <thead className="bg-[#F9FAFB]">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-[#111318] border-b border-[#E5E7EB]">Plan</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#111318] border-b border-[#E5E7EB]">Preț lunar</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#111318] border-b border-[#E5E7EB]">Preț anual</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#111318] border-b border-[#E5E7EB]">SMS incluse</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#111318] border-b border-[#E5E7EB]">Stații</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#F3F4F6]">
                    <td className="px-4 py-3 font-medium text-[#111318]">Trial</td>
                    <td className="px-4 py-3 text-[#059669] font-semibold">Gratuit</td>
                    <td className="px-4 py-3 text-[#9CA3AF]">—</td>
                    <td className="px-4 py-3">20 SMS</td>
                    <td className="px-4 py-3">1 stație</td>
                  </tr>
                  <tr className="border-b border-[#F3F4F6]">
                    <td className="px-4 py-3 font-medium text-[#111318]">Basic</td>
                    <td className="px-4 py-3">149 lei + TVA</td>
                    <td className="px-4 py-3">119 lei/lună + TVA</td>
                    <td className="px-4 py-3">250 SMS/lună</td>
                    <td className="px-4 py-3">1 stație</td>
                  </tr>
                  <tr className="border-b border-[#F3F4F6]">
                    <td className="px-4 py-3 font-medium text-[#111318]">Pro</td>
                    <td className="px-4 py-3">249 lei + TVA</td>
                    <td className="px-4 py-3">199 lei/lună + TVA</td>
                    <td className="px-4 py-3">500 SMS/lună</td>
                    <td className="px-4 py-3">3 stații</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#111318]">Enterprise</td>
                    <td className="px-4 py-3">499 lei + TVA</td>
                    <td className="px-4 py-3">399 lei/lună + TVA</td>
                    <td className="px-4 py-3">1.000 SMS/lună</td>
                    <td className="px-4 py-3">Nelimitat</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              6.2. <strong>Prețurile afișate nu includ TVA.</strong> TVA-ul se
              aplică conform legislației fiscale române în vigoare (19% pentru
              persoane juridice înregistrate în scop de TVA în România). Factura
              fiscală va reflecta valoarea totală inclusiv TVA.
            </p>
            <p className="mt-3">
              6.3. SMS-urile nefolosite dintr-o perioadă de facturare nu se
              reportează în luna următoare.
            </p>
            <p className="mt-3">
              6.4. Furnizorul poate oferi, periodic, promoții sau reduceri cu
              caracter temporar. Acestea nu constituie drepturi permanente și pot
              fi retrase la expirarea perioadei promoționale.
            </p>
            <p className="mt-3">
              6.5. Prețurile pot fi modificate cu un preaviz de minimum{" "}
              <strong>30 de zile</strong> comunicat prin e-mail. Utilizatorul
              are dreptul de a rezilia contractul înainte de intrarea în vigoare
              a noilor prețuri, fără penalități.
            </p>
          </Section>

          {/* 7. Facturare și plată */}
          <Section id="facturare" title="7. Facturare, plată și reînnoire automată">
            <p>
              7.1. <strong>Modalități de plată.</strong> Plata abonamentului se
              efectuează online, prin card bancar (Visa, Mastercard) sau prin
              transfer bancar, prin intermediul procesorului de plăți agreat de
              Furnizor. Datele cardului nu sunt stocate de Furnizor, ci exclusiv
              de procesatorul de plăți certificat PCI DSS.
            </p>
            <p className="mt-3">
              7.2. <strong>Ciclu de facturare lunar.</strong> Abonamentul lunar
              se activează la data efectuării primei plăți și se reînnoiește
              automat în fiecare lună la aceeași dată calendaristică, până la
              rezilierea expresă de către Utilizator.
            </p>
            <p className="mt-3">
              7.3. <strong>Ciclu de facturare anual.</strong> Abonamentul anual
              se facturează integral în avans la data activării și se reînnoiește
              automat după 12 luni, cu un avantaj de 2 luni gratuite față de
              prețul lunar.
            </p>
            <p className="mt-3">
              7.4. <strong>Notificare reînnoire.</strong> Cu minimum{" "}
              <strong>7 zile</strong> înainte de reînnoirea automată, Furnizorul
              va transmite Utilizatorului un e-mail de notificare. Aceasta este
              o obligație de transparență, conform principiilor bunei-credințe
              contractuale prevăzute de Codul Civil.
            </p>
            <p className="mt-3">
              7.5. <strong>Eșecul plății.</strong> În cazul în care plata
              automată eșuează, Utilizatorul va fi notificat și va beneficia de
              un termen de grație de <strong>5 zile calendaristice</strong>{" "}
              pentru reglementarea situației. Dacă plata nu este efectuată în
              acest termen, accesul la funcționalitățile plătite va fi suspendat,
              datele Utilizatorului fiind păstrate timp de 30 de zile.
            </p>
            <p className="mt-3">
              7.6. <strong>Factura fiscală</strong> va fi emisă electronic și
              transmisă pe adresa de e-mail a Utilizatorului în termen de{" "}
              <strong>5 zile lucrătoare</strong> de la efectuarea plății.
            </p>
            <p className="mt-3">
              7.7. <strong>Rambursări.</strong> Plățile efectuate pentru
              abonamentele activate nu sunt rambursabile, cu excepția cazurilor
              prevăzute expres la art. 9 (Dreptul de retragere) sau a
              neîndeplinirii culpabile a obligațiilor Furnizorului.
            </p>
          </Section>

          {/* 8. Perioada Trial */}
          <Section id="trial" title="8. Perioada de probă (Trial)">
            <p>
              8.1. Utilizatorii noi beneficiază de o perioadă de probă gratuită
              de <strong>15 (cincisprezece) zile calendaristice</strong> de la
              data creării contului, fără a fi necesară furnizarea datelor unui
              card bancar.
            </p>
            <p className="mt-3">
              8.2. Pe durata perioadei Trial, Utilizatorul are acces la toate
              funcționalitățile platformei, cu limita de{" "}
              <strong>20 SMS-uri</strong> și <strong>1 stație ITP</strong>.
            </p>
            <p className="mt-3">
              8.3. La expirarea perioadei Trial, contul va fi trecut în regim
              limitat (read-only). Datele introduse se păstrează 30 de zile,
              timp în care Utilizatorul poate alege un plan plătit pentru a
              relua activitatea. Dacă nu este ales niciun plan, contul și datele
              asociate vor fi șterse definitiv, conform Politicii de
              Confidențialitate.
            </p>
            <p className="mt-3">
              8.4. Furnizorul nu garantează prelungirea sau repetarea perioadei
              de Trial și poate limita sau anula accesul Trial pentru conturi
              suspectate de abuz.
            </p>
          </Section>

          {/* 9. Dreptul de retragere */}
          <Section id="retragere" title="9. Dreptul de retragere">
            <p>
              9.1. Serviciile Velos sunt destinate exclusiv activității
              profesionale și/sau comerciale a stațiilor ITP. În consecință,
              Utilizatorii acționează în calitate de <strong>profesioniști</strong>{" "}
              în sensul OUG 34/2014 privind drepturile consumatorilor, și{" "}
              <strong>nu beneficiază de dreptul de retragere de 14 zile</strong>{" "}
              specific contractelor cu consumatorii.
            </p>
            <p className="mt-3">
              9.2. Cu toate acestea, ca politică comercială voluntară,{" "}
              <strong>
                Furnizorul oferă o garanție de satisfacție de 7 zile
              </strong>{" "}
              pentru prima lună de abonament plătit (exclusiv Trial). Dacă
              Utilizatorul nu este mulțumit de servicii, poate solicita
              rambursarea integrală a sumei achitate în termen de 7 zile de la
              prima plată, prin trimiterea unei cereri la{" "}
              <strong>contact@velos.ro</strong>. Această politică se aplică o
              singură dată per cont.
            </p>
            <p className="mt-3">
              9.3. Garanția de la pct. 9.2 nu se aplică în cazul în care
              Utilizatorul a trimis un număr semnificativ de SMS-uri (mai mult
              de 50% din cota lunară inclusă în plan) în cele 7 zile de la
              activare.
            </p>
          </Section>

          {/* 10. Rezilierea */}
          <Section id="reziliere" title="10. Rezilierea și anularea abonamentului">
            <p>
              10.1. <strong>Reziliere de către Utilizator.</strong> Utilizatorul
              poate rezilia abonamentul oricând, direct din panoul de control al
              contului (secțiunea „Setări → Abonament") sau prin e-mail la{" "}
              <strong>contact@velos.ro</strong>. Rezilierea produce efecte la
              finalul perioadei de facturare curente, Utilizatorul păstrând
              accesul la funcționalitățile plătite până la acea dată.
            </p>
            <p className="mt-3">
              10.2. <strong>Nu există penalități de reziliere anticipată</strong>{" "}
              pentru abonamentele lunare.
            </p>
            <p className="mt-3">
              10.3. Pentru abonamentele anuale, rezilierea anticipată (înainte
              de expirarea celor 12 luni) nu dă dreptul la rambursarea sumelor
              achitate pentru lunile rămase, cu excepția cazului în care
              rezilierea este cauzată de o modificare semnificativă a condițiilor
              de serviciu de către Furnizor.
            </p>
            <p className="mt-3">
              10.4. <strong>Reziliere de către Furnizor.</strong> Furnizorul poate
              rezilia sau suspenda contractul cu efect imediat, fără notificare
              prealabilă, în cazurile de:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-2 ml-4">
              <li>încălcare gravă a prezentelor T&C;</li>
              <li>activitate frauduloasă sau ilegală;</li>
              <li>
                transmitere de SMS-uri nesolicitate (spam) sau cu conținut
                ilegal;
              </li>
              <li>tentative de acces neautorizat la sistemele Furnizorului;</li>
              <li>neplata abonamentului după termenul de grație.</li>
            </ul>
            <p className="mt-3">
              10.5. <strong>Ștergerea datelor la reziliere.</strong> La rezilierea
              contractului, datele Utilizatorului vor fi păstrate în platformă
              timp de <strong>30 de zile calendaristice</strong>, interval în
              care Utilizatorul poate solicita exportul datelor. După expirarea
              acestei perioade, datele vor fi șterse definitiv, cu excepția
              celor pentru care există obligație legală de arhivare.
            </p>
            <p className="mt-3">
              10.6. Utilizatorul poate solicita ștergerea imediată a datelor și
              înainte de expirarea celor 30 de zile, printr-o cerere explicită
              transmisă la <strong>contact@velos.ro</strong>.
            </p>
          </Section>

          {/* 11. Obligațiile Utilizatorului */}
          <Section id="obligatii-utilizator" title="11. Obligațiile și restricțiile Utilizatorului">
            <p>
              11.1. Utilizatorul se obligă să utilizeze platforma exclusiv în
              scopuri legale și în conformitate cu prezentele T&C, legislația
              română și europeană aplicabilă.
            </p>
            <p className="mt-3">
              11.2. <strong>Utilizatorul are obligația:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-2 ml-4">
              <li>
                să furnizeze informații corecte și actualizate la înregistrare
                și pe parcursul utilizării;
              </li>
              <li>
                să dețină consimțământul valid al clienților finali înainte de
                a transmite SMS-uri prin platformă, conform Legii 506/2004 și
                GDPR;
              </li>
              <li>
                să se asigure că mesajele SMS trimise prin platformă nu au
                caracter de spam, nu conțin informații false sau înșelătoare și
                respectă legislația privind comunicările comerciale electronice;
              </li>
              <li>
                să informeze Utilizatorii Finali cu privire la prelucrarea
                datelor lor personale, în calitate de Operator GDPR;
              </li>
              <li>
                să mențină confidențialitatea credențialelor de acces și să
                nu le partajeze cu persoane neautorizate;
              </li>
              <li>
                să notifice imediat Furnizorul în caz de breșă de securitate
                sau acces neautorizat.
              </li>
            </ul>
            <p className="mt-3">
              11.3. <strong>Este interzis:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-2 ml-4">
              <li>
                utilizarea platformei pentru transmiterea de mesaje spam,
                conținut ofensator, discriminatoriu, ilegal sau care încalcă
                drepturile terților;
              </li>
              <li>
                accesul neautorizat la conturile altor utilizatori, la
                infrastructura Furnizorului sau la date care nu vă aparțin;
              </li>
              <li>
                reproducerea, distribuirea, sublicențierea, vânzarea sau
                transferul platformei sau al oricăror drepturi derivate;
              </li>
              <li>
                efectuarea de operațiuni de reverse engineering, decompilare
                sau dezasamblare a software-ului;
              </li>
              <li>
                utilizarea de roboți (bots), scraping, crawlere sau orice
                mijloace automate de accesare a platformei fără acordul scris
                al Furnizorului;
              </li>
              <li>
                introducerea de viruși, cod malițios sau orice alte elemente
                dăunătoare în platformă;
              </li>
              <li>
                crearea de conturi false sau furnizarea de date de identificare
                eronate.
              </li>
            </ul>
          </Section>

          {/* 12. Obligațiile Furnizorului */}
          <Section id="obligatii-furnizor" title="12. Obligațiile Furnizorului">
            <p>Furnizorul se obligă:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-3">
              <li>
                să furnizeze serviciile descrise în planul de abonament ales de
                Utilizator, la standardele de calitate specificate;
              </li>
              <li>
                să asigure disponibilitatea platformei de cel puțin{" "}
                <strong>99,5% lunar</strong> (excluzând perioadele de mentenanță
                planificată și evenimentele de forță majoră);
              </li>
              <li>
                să notifice Utilizatorii cu cel puțin <strong>48 de ore</strong>{" "}
                înainte de efectuarea mentenanței programate;
              </li>
              <li>
                să implementeze măsuri tehnice și organizatorice adecvate pentru
                protecția datelor, conform art. 32 GDPR;
              </li>
              <li>
                să notifice Utilizatorii cu privire la orice modificare
                semnificativă a serviciilor sau prețurilor cu un preaviz de
                minimum <strong>30 de zile</strong>;
              </li>
              <li>
                să asigure suport tehnic prin e-mail în zilele lucrătoare
                (Luni–Vineri, 09:00–18:00), cu timp de răspuns de maximum{" "}
                <strong>2 zile lucrătoare</strong>;
              </li>
              <li>
                să efectueze backup-uri periodice ale datelor platformei;
              </li>
              <li>
                să respecte obligațiile de împuternicit GDPR conform Acordului
                de Prelucrare a Datelor (APD) integrat în prezentele T&C
                (art. 15).
              </li>
            </ul>
          </Section>

          {/* 13. Disponibilitatea serviciului */}
          <Section id="disponibilitate" title="13. Disponibilitatea serviciului și mentenanța">
            <p>
              13.1. Furnizorul depune eforturi rezonabile pentru a asigura
              disponibilitatea continuă a platformei, cu un obiectiv de uptime
              de <strong>99,5% lunar</strong>.
            </p>
            <p className="mt-3">
              13.2. Furnizorul nu garantează funcționarea neîntreruptă și fără
              erori a platformei. Pot apărea întreruperi temporare cauzate de:
              mentenanță planificată, actualizări de sistem, defecțiuni hardware
              sau software, atacuri cibernetice sau factori aflați în afara
              controlului rezonabil al Furnizorului.
            </p>
            <p className="mt-3">
              13.3. <strong>Mentenanța planificată</strong> va fi anunțată cu
              cel puțin 48 de ore în avans pe platforma sau prin e-mail și va
              fi programată, de regulă, în afara orelor de vârf (Luni–Vineri,
              22:00–06:00 sau weekend).
            </p>
            <p className="mt-3">
              13.4. În cazul unor întreruperi neplanificate cu durata mai mare
              de <strong>4 ore consecutive</strong>, Furnizorul va acorda
              Utilizatorilor afectați o compensație sub forma unui credit
              echivalent cu perioada de indisponibilitate, aplicat la factura
              următoare.
            </p>
          </Section>

          {/* 14. Modificarea termenilor */}
          <Section id="modificare" title="14. Modificarea termenilor și condițiilor">
            <p>
              14.1. Furnizorul poate modifica prezentele T&C oricând, cu
              notificarea Utilizatorilor activi prin e-mail și/sau printr-o
              notificare vizibilă în platformă, cu un preaviz de minimum{" "}
              <strong>30 de zile calendaristice</strong> înainte de data intrării
              în vigoare a modificărilor.
            </p>
            <p className="mt-3">
              14.2. Dacă Utilizatorul nu este de acord cu modificările, are
              dreptul de a rezilia contractul înainte de data intrării în vigoare
              a noilor T&C, fără penalități, prin notificare scrisă la{" "}
              <strong>contact@velos.ro</strong>.
            </p>
            <p className="mt-3">
              14.3. Continuarea utilizării platformei după data intrării în
              vigoare a noilor T&C constituie acceptarea tacită a acestora.
            </p>
            <p className="mt-3">
              14.4. Versiunile anterioare ale T&C vor fi arhivate și
              disponibile la cerere.
            </p>
          </Section>

          {/* 15. Prelucrarea datelor — GDPR / DPA */}
          <Section id="gdpr" title="15. Prelucrarea datelor cu caracter personal — Acord de prelucrare a datelor (APD)">
            <p>
              Prezentul articol constituie Acordul de Prelucrare a Datelor
              (APD) în sensul art. 28 din Regulamentul (UE) 2016/679 (GDPR)
              și al Legii nr. 190/2018.
            </p>

            <h3 className="font-semibold text-[#111318] mt-5 mb-2">15.1. Calitățile părților</h3>
            <p>
              În relația cu Utilizatorii Finali ai stației ITP (proprietarii
              de vehicule):
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-2 ml-4">
              <li>
                <strong>Utilizatorul (stația ITP)</strong> are calitatea de{" "}
                <strong>Operator</strong> de date cu caracter personal, în
                sensul art. 4 alin. (7) GDPR;
              </li>
              <li>
                <strong>Furnizorul (SC VOID SFT GAMES SRL)</strong> are calitatea
                de <strong>Împuternicit</strong>, în sensul art. 4 alin. (8)
                GDPR, prelucrând datele exclusiv pe baza instrucțiunilor
                documentate ale Operatorului.
              </li>
            </ul>

            <h3 className="font-semibold text-[#111318] mt-5 mb-2">15.2. Datele prelucrate</h3>
            <p>Furnizorul prelucrează, în calitate de Împuternicit, următoarele categorii de date:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-2 ml-4">
              <li>Date de identificare: nume, prenume;</li>
              <li>Date de contact: număr de telefon, adresă e-mail;</li>
              <li>Date vehicul: număr de înmatriculare, marcă, model, an fabricație;</li>
              <li>Date programări: data, ora, tipul serviciului ITP;</li>
              <li>Istoricul rezultatelor ITP și al intervențiilor.</li>
            </ul>

            <h3 className="font-semibold text-[#111318] mt-5 mb-2">15.3. Scopurile și temeiul prelucrării</h3>
            <p>
              Datele sunt prelucrate exclusiv în scopul furnizării serviciilor
              contractate (gestionarea programărilor, trimiterea SMS-urilor de
              reamintire, generarea rapoartelor) și nu vor fi utilizate de
              Furnizor în alte scopuri proprii.
            </p>

            <h3 className="font-semibold text-[#111318] mt-5 mb-2">15.4. Obligațiile Furnizorului în calitate de Împuternicit</h3>
            <p>Furnizorul se obligă:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-2 ml-4">
              <li>
                să prelucreze datele exclusiv conform instrucțiunilor documentate
                ale Operatorului;
              </li>
              <li>
                să se asigure că persoanele autorizate să prelucreze datele s-au
                angajat la confidențialitate;
              </li>
              <li>
                să implementeze măsuri tehnice și organizatorice adecvate (art.
                32 GDPR): criptare în tranzit (TLS) și în repaus, control al
                accesului, jurnalizare, backup periodic;
              </li>
              <li>
                să notifice Operatorul în termen de <strong>72 de ore</strong>{" "}
                în cazul descoperirii unei breșe de securitate care afectează
                datele prelucrate;
              </li>
              <li>
                să asiste Operatorul în îndeplinirea obligațiilor față de
                persoanele vizate (drept de acces, rectificare, ștergere,
                portabilitate);
              </li>
              <li>
                la finalul contractului, să șteargă sau să returneze toate
                datele cu caracter personal, la alegerea Operatorului;
              </li>
              <li>
                să pună la dispoziția Operatorului toate informațiile necesare
                demonstrării conformității cu GDPR.
              </li>
            </ul>

            <h3 className="font-semibold text-[#111318] mt-5 mb-2">15.5. Sub-împuterniciți</h3>
            <p>
              Furnizorul poate utiliza sub-împuterniciți (ex: furnizori de
              infrastructură cloud, furnizori de servicii SMS). Utilizatorul
              autorizează în mod general utilizarea acestora. Furnizorul va
              notifica Utilizatorul cu <strong>30 de zile</strong> înainte de
              adăugarea sau înlocuirea unui sub-împuternicit semnificativ,
              acordând Utilizatorului posibilitatea de a formula obiecții.
              Contractele cu sub-împuterniciții impun aceleași obligații de
              protecție a datelor ca prezentul acord.
            </p>

            <h3 className="font-semibold text-[#111318] mt-5 mb-2">15.6. Transferuri internaționale</h3>
            <p>
              Datele cu caracter personal sunt stocate pe servere localizate în
              Spațiul Economic European (SEE). Orice transfer în afara SEE se
              va efectua numai cu garanții adecvate (clauze contractuale
              standard, decizie de adecvare etc.), conform Capitolului V GDPR.
            </p>

            <h3 className="font-semibold text-[#111318] mt-5 mb-2">15.7. Obligațiile Operatorului (Utilizatorul)</h3>
            <p>
              Utilizatorul, în calitate de Operator, are obligația:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-2 ml-4">
              <li>
                să dețină temei juridic valid (consimțământ, contract, interes
                legitim) pentru prelucrarea datelor clienților finali;
              </li>
              <li>
                să informeze clienții finali cu privire la prelucrarea datelor
                înainte de colectarea acestora;
              </li>
              <li>
                să gestioneze drepturile persoanelor vizate (acces,
                rectificare, ștergere, opoziție);
              </li>
              <li>
                să se asigure că SMS-urile trimise prin platformă au la bază
                consimțământul valid al destinatarilor, conform Legii 506/2004.
              </li>
            </ul>

            <p className="mt-4">
              Pentru detalii complete privind prelucrarea datelor de Furnizor
              în calitate de Operator propriu (date ale Utilizatorilor
              platformei), a se vedea <strong>Politica de Confidențialitate</strong>.
            </p>
          </Section>

          {/* 16. SMS */}
          <Section id="sms" title="16. Utilizarea serviciului de SMS">
            <p>
              16.1. Serviciul de SMS din cadrul Velos permite trimiterea de
              mesaje text către clienții finali ai stației ITP, pentru scopuri
              precum: reamintiri ITP, confirmări de programare, notificări
              operaționale.
            </p>
            <p className="mt-3">
              16.2. <strong>Obligații legale privind consimțământul.</strong>{" "}
              Conform art. 12 din Legea 506/2004 și GDPR, transmiterea de
              comunicări comerciale prin SMS este permisă numai dacă destinatarul
              și-a exprimat consimțământul prealabil, liber, specific, informat
              și neechivoc. Utilizatorul este singurul responsabil pentru
              obținerea și documentarea acestui consimțământ.
            </p>
            <p className="mt-3">
              16.3. Utilizatorul se obligă să nu utilizeze serviciul SMS pentru:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-2 ml-4">
              <li>trimiterea de mesaje nesolicitate (spam);</li>
              <li>conținut publicitar nesolicitat, înșelător sau ilegal;</li>
              <li>
                mesaje care conțin link-uri de phishing sau malware;
              </li>
              <li>transmiterea de date cu caracter sensibil.</li>
            </ul>
            <p className="mt-3">
              16.4. <strong>SMS-urile incluse în plan</strong> se consumă
              lunar și nu se reportează. Utilizatorul este notificat când
              consumă 80% și 100% din cota lunară.
            </p>
            <p className="mt-3">
              16.5. Furnizorul poate suspenda serviciul SMS al unui Utilizator
              care înregistrează o rată ridicată de reclamații din partea
              destinatarilor sau care este identificat ca sursă de spam, cu
              notificarea imediată a Utilizatorului.
            </p>
            <p className="mt-3">
              16.6. Furnizorul nu garantează livrarea 100% a SMS-urilor,
              aceasta putând fi afectată de factori externi (rețeaua
              operatorului de telefonie, număr de telefon dezactivat etc.).
            </p>
          </Section>

          {/* 17. Proprietate intelectuală */}
          <Section id="ip" title="17. Proprietate intelectuală">
            <p>
              17.1. Platforma Velos, inclusiv software-ul, codul sursă,
              designul, logo-urile, denumirile, mărcile, documentația și toate
              elementele creative asociate, sunt proprietatea exclusivă a SC
              VOID SFT GAMES SRL și sunt protejate de Legea nr. 8/1996 privind
              dreptul de autor și drepturile conexe, precum și de legislația
              privind mărcile și brevetele.
            </p>
            <p className="mt-3">
              17.2. Furnizorul acordă Utilizatorului o licență
              <strong> neexclusivă, netransferabilă, revocabilă</strong>, limitată
              la utilizarea platformei în conformitate cu prezentele T&C, pe
              durata abonamentului activ.
            </p>
            <p className="mt-3">
              17.3. <strong>Conținutul Utilizatorului.</strong> Utilizatorul
              rămâne proprietarul datelor și conținutului introduse în platformă.
              Prin utilizarea platformei, Utilizatorul acordă Furnizorului o
              licență limitată, neexclusivă și gratuită de a procesa acest
              conținut exclusiv în scopul furnizării serviciilor contractate.
            </p>
            <p className="mt-3">
              17.4. Furnizorul poate utiliza denumirea și sigla Utilizatorului
              (stației ITP) ca referință comercială, cu acordul prealabil al
              Utilizatorului.
            </p>
          </Section>

          {/* 18. Limitarea răspunderii */}
          <Section id="raspundere" title="18. Limitarea răspunderii">
            <p>
              18.1. Platforma Velos este furnizată „ca atare" (as-is). Furnizorul
              nu oferă garanții cu privire la adecvarea platformei pentru un
              scop specific, absența erorilor sau compatibilitatea cu orice
              sistem terț.
            </p>
            <p className="mt-3">
              18.2. Furnizorul nu va fi răspunzător pentru:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-2 ml-4">
              <li>
                pierderi de date cauzate de acțiunile sau omisiunile
                Utilizatorului;
              </li>
              <li>
                prejudicii indirecte, incidentale, speciale sau punitiv
                (inclusiv pierderi de profit, pierdere de clienți, reputație),
                chiar dacă a fost informat de posibilitatea unor astfel de
                prejudicii;
              </li>
              <li>
                întreruperi cauzate de factori externi: furnizori de internet,
                operatori de telefonie, forță majoră, atacuri DDoS;
              </li>
              <li>
                utilizarea neconformă a platformei de către Utilizator sau de
                terți care au obținut acces prin contul Utilizatorului;
              </li>
              <li>
                conținutul SMS-urilor transmise de Utilizator, acesta purtând
                responsabilitatea exclusivă a conformității cu legislația
                aplicabilă.
              </li>
            </ul>
            <p className="mt-3">
              18.3. Răspunderea totală cumulată a Furnizorului față de un
              Utilizator, indiferent de natura prejudiciului, este limitată la{" "}
              <strong>
                valoarea sumelor plătite de Utilizator în ultimele 3 luni
                calendaristice
              </strong>{" "}
              anterioare producerii evenimentului generator al prejudiciului.
            </p>
            <p className="mt-3">
              18.4. Limitările de mai sus se aplică în măsura permisă de
              legislația română în vigoare și nu exclud răspunderea pentru
              prejudicii cauzate cu intenție sau prin culpă gravă.
            </p>
          </Section>

          {/* 19. Confidențialitate */}
          <Section id="confidentialitate" title="19. Confidențialitate">
            <p>
              19.1. Fiecare parte se obligă să păstreze confidențialitatea
              informațiilor cu caracter confidențial ale celeilalte părți,
              obținute în legătură cu executarea prezentului contract, și să
              nu le divulge terților fără acordul scris prealabil.
            </p>
            <p className="mt-3">
              19.2. Obligația de confidențialitate nu se aplică informațiilor:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-2 ml-4">
              <li>
                care sunt sau devin publice fără culpa părții care le divulgă;
              </li>
              <li>
                dezvăluite ca urmare a unei obligații legale sau a unui ordin
                al autorităților competente;
              </li>
              <li>
                cunoscute anterior de parte din surse independente.
              </li>
            </ul>
            <p className="mt-3">
              19.3. Obligația de confidențialitate supraviețuiește încetării
              contractului timp de <strong>3 ani</strong>.
            </p>
          </Section>

          {/* 20. Forța majoră */}
          <Section id="forta-majora" title="20. Forța majoră și cazul fortuit">
            <p>
              20.1. Niciuna dintre părți nu va fi răspunzătoare pentru
              neîndeplinirea obligațiilor contractuale dacă aceasta este
              determinată de un eveniment de forță majoră, în sensul art. 1.351
              din Codul Civil român — eveniment extern, imprevizibil, absolut
              invincibil și inevitabil.
            </p>
            <p className="mt-3">
              20.2. Constituie forță majoră, fără a se limita la: calamități
              naturale, cutremure, inundații, epidemii, atacuri cibernetice de
              amploare națională, întreruperi majore ale infrastructurii de
              internet, acte ale autorităților publice.
            </p>
            <p className="mt-3">
              20.3. Partea care invocă forța majoră are obligația de a notifica
              cealaltă parte în termen de <strong>5 zile lucrătoare</strong>{" "}
              de la producerea evenimentului și de a furniza dovezi.
            </p>
            <p className="mt-3">
              20.4. Dacă evenimentul de forță majoră durează mai mult de{" "}
              <strong>30 de zile calendaristice</strong>, oricare dintre părți
              poate rezilia contractul fără penalități, prin notificare scrisă.
            </p>
          </Section>

          {/* 21. Legea aplicabilă și jurisdicție */}
          <Section id="lege" title="21. Legea aplicabilă și jurisdicția competentă">
            <p>
              21.1. Prezentul contract este guvernat și interpretat în
              conformitate cu legea română, în special:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-2 ml-4">
              <li>Codul Civil al României (Legea 287/2009);</li>
              <li>Legea 365/2002 privind comerțul electronic;</li>
              <li>OUG 34/2014 privind drepturile consumatorilor;</li>
              <li>Legea 193/2000 privind clauzele abuzive;</li>
              <li>Regulamentul (UE) 2016/679 (GDPR) și Legea 190/2018;</li>
              <li>Legea 506/2004 privind comunicațiile electronice.</li>
            </ul>
            <p className="mt-3">
              21.2. Orice litigiu izvorât din sau în legătură cu prezentul
              contract se va soluționa, în primul rând, pe cale amiabilă.
              Dacă nu se ajunge la o înțelegere în termen de 30 de zile,
              litigiul va fi supus spre soluționare instanțelor judecătorești
              competente din <strong>România</strong>, cu respectarea normelor
              de competență materială și teritorială din Codul de Procedură
              Civilă.
            </p>
          </Section>

          {/* 22. Soluționarea alternativă a litigiilor */}
          <Section id="sal" title="22. Soluționarea alternativă a litigiilor (SAL/SOL)">
            <p>
              22.1. Conform OUG 38/2015 și Legii 151/2015, Utilizatorii care
              au calitatea de consumatori (persoane fizice care acționează în
              afara sferei activității profesionale) pot apela la proceduri de
              soluționare alternativă a litigiilor (SAL).
            </p>
            <p className="mt-3">
              22.2. Utilizatorii pot sesiza{" "}
              <strong>
                Autoritatea Națională pentru Protecția Consumatorilor (ANPC)
              </strong>{" "}
              la adresa:{" "}
              <a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer" className="text-[#1877F2] hover:underline">
                anpc.ro/ce-este-sal/
              </a>
            </p>
            <p className="mt-3">
              22.3. Platforma europeană de soluționare online a litigiilor
              (SOL) este accesibilă la:{" "}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-[#1877F2] hover:underline">
                ec.europa.eu/consumers/odr
              </a>
            </p>
            <p className="mt-3">
              22.4. Adresa de contact a Furnizorului pentru sesizări și
              reclamații: <strong>contact@velos.ro</strong>
            </p>
          </Section>

          {/* 23. Clauze diverse */}
          <Section id="diverse" title="23. Dispoziții finale">
            <p>
              23.1. <strong>Independența clauzelor.</strong> Dacă oricare
              clauză a prezentelor T&C este declarată nulă sau inaplicabilă
              de o instanță competentă, restul clauzelor rămân în vigoare și
              produc efecte depline. Clauza nulă va fi înlocuită cu o prevedere
              legală cât mai apropiată de intenția inițială a părților.
            </p>
            <p className="mt-3">
              23.2. <strong>Cesiunea contractului.</strong> Utilizatorul nu
              poate ceda drepturile și obligațiile din prezentul contract unui
              terț fără acordul scris prealabil al Furnizorului. Furnizorul poate
              ceda contractul în cazul reorganizării societății (fuziune,
              divizare, cesiune de activitate), cu notificarea prealabilă a
              Utilizatorilor.
            </p>
            <p className="mt-3">
              23.3. <strong>Comunicări.</strong> Orice notificare sau comunicare
              în legătură cu prezentele T&C va fi efectuată în scris, prin
              e-mail la adresele înregistrate în cont. Comunicările transmise
              prin e-mail se consideră recepționate în ziua lucrătoare următoare
              expedierii.
            </p>
            <p className="mt-3">
              23.4. <strong>Renunțarea.</strong> Nicio omisiune a Furnizorului
              de a exercita un drept sau de a invoca o prevedere din prezentele
              T&C nu constituie o renunțare la acel drept sau prevedere.
            </p>
            <p className="mt-3">
              23.5. <strong>Integralitatea contractului.</strong> Prezentele
              T&C, împreună cu Politica de Confidențialitate și Politica de
              Cookies, constituie întregul acord dintre Furnizor și Utilizator
              cu privire la obiectul lor și înlocuiesc orice înțelegeri sau
              comunicări anterioare.
            </p>
            <p className="mt-3">
              23.6. Prezentele T&C intră în vigoare la data publicării pe
              platformă: <strong>14 mai 2025</strong>.
            </p>
          </Section>

          {/* Contact */}
          <div className="border border-[#E5E7EB] rounded-2xl p-6 bg-[#F9FAFB]">
            <h2 className="text-lg font-bold text-[#111318] mb-2">Contact</h2>
            <p className="text-sm text-[#6B7280]">
              Pentru orice întrebări legate de prezentele T&C, vă rugăm să ne
              contactați:
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li><span className="font-medium text-[#374151]">E-mail:</span>{" "}<a href="mailto:contact@velos.ro" className="text-[#1877F2] hover:underline">contact@velos.ro</a></li>
              <li><span className="font-medium text-[#374151]">Telefon:</span>{" "}0757 941 553 (Luni – Vineri, 09:00 – 18:00)</li>
              <li><span className="font-medium text-[#374151]">Adresă:</span>{" "}SC VOID SFT GAMES SRL, Strada Progresului, Nr. 2, România</li>
            </ul>
          </div>

        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl font-bold text-[#111318] mb-4 pb-3 border-b border-[#E5E7EB]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function TableRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-[#F3F4F6]">
      <td className="py-2.5 pr-4 text-[#6B7280] font-medium whitespace-nowrap w-48">{label}</td>
      <td className="py-2.5 text-[#111318] font-semibold">{value}</td>
    </tr>
  );
}

function DefinitionItem({
  term,
  children,
}: {
  term: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2">
      <dt className="font-semibold text-[#111318] shrink-0">{term}</dt>
      <dd className="text-[#6B7280]">— {children}</dd>
    </div>
  );
}
