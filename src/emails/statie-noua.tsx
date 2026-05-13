import * as React from "react";
import { EmailLayout, H1, P, PrimaryButton, Divider, Muted, InfoRow } from "./layout";

interface Props {
  numeProprietar: string;
  numeStatie: string;
  slugStatie: string;
  appUrl: string;
}

export function StatieNouaEmail({ numeProprietar, numeStatie, slugStatie, appUrl }: Props) {
  const firstName = numeProprietar.split(" ")[0];

  return (
    <EmailLayout preview={`Stația "${numeStatie}" a fost creată cu succes pe Velos.ro`}>
      <H1>Stație nouă creată! 🏢</H1>
      <P>Felicitări, <strong>{firstName}</strong>!</P>
      <P>
        Stația ta <strong>{numeStatie}</strong> a fost înregistrată cu succes pe platforma Velos.ro.
        Acum poți configura programul, tarifele, angajații și să începi să primești programări.
      </P>

      <div style={{
        backgroundColor: "#F7F8FA",
        borderRadius: 10,
        padding: "16px 20px",
        margin: "16px 0",
        border: "1px solid #F3F4F6",
      }}>
        <InfoRow label="🏢 Stație" value={numeStatie} />
        <InfoRow label="🔗 Link booking" value={`${appUrl}/booking/${slugStatie}`} />
      </div>

      <PrimaryButton href={`${appUrl}/setari/statii`}>
        Configurează stația
      </PrimaryButton>

      <Divider />

      <P style={{ fontSize: 14 }}>
        <strong>Pași următori recomandați:</strong><br />
        1️⃣ Completează adresa și programul de lucru<br />
        2️⃣ Adaugă tarifele pentru servicii<br />
        3️⃣ Înregistrează angajații<br />
        4️⃣ Configurează remindere SMS automate<br />
        5️⃣ Distribuie link-ul de booking clienților tăi
      </P>

      <Muted>
        Link booking public: {appUrl}/booking/{slugStatie}
      </Muted>
    </EmailLayout>
  );
}

export default StatieNouaEmail;
