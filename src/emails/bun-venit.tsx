import * as React from "react";
import { EmailLayout, H1, P, PrimaryButton, Divider, Muted } from "./layout";

interface Props {
  numeComplet: string;
  email: string;
  appUrl: string;
}

export function BunVenitEmail({ numeComplet, email, appUrl }: Props) {
  const firstName = numeComplet.split(" ")[0];

  return (
    <EmailLayout preview={`Bun venit pe Velos.ro, ${firstName}! Contul tău este gata.`}>
      <H1>Bun venit pe Velos.ro! 👋</H1>
      <P>Salut, <strong>{firstName}</strong>!</P>
      <P>
        Contul tău a fost creat cu succes. Acum ai acces la platforma completă
        de management pentru stații ITP — programări, clienți, vehicule,
        remindere SMS și rapoarte, totul într-un singur loc.
      </P>
      <P>
        Ai <strong>6 luni de probă gratuită</strong>, fără card bancar. Perioada de
        probă nu include SMS-uri: când vrei să trimiți remindere clienților,
        cumperi credit SMS direct din platformă (0,05 € / SMS). Creditul nu expiră.
      </P>

      <PrimaryButton href={`${appUrl}/dashboard`}>
        Accesează dashboard-ul
      </PrimaryButton>

      <Divider />

      <P style={{ fontSize: 14 }}>
        <strong>Ce poți face acum:</strong>
      </P>
      <P style={{ fontSize: 14 }}>
        ✅ Adaugă prima ta stație ITP<br />
        ✅ Importă clienții și vehiculele existente<br />
        ✅ Configurează programul și tarifele<br />
        ✅ Cumpără credit SMS și activează reminderele automate
      </P>

      <Divider />

      <Muted>
        Ai întrebări? Scrie-ne la support@velos.ro și îți răspundem în cel mult 24h.
      </Muted>
      <Muted>
        Email înregistrat: {email}
      </Muted>
    </EmailLayout>
  );
}

export default BunVenitEmail;
