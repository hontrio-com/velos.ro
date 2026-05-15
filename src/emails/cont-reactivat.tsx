import * as React from "react";
import { EmailLayout, H1, P, PrimaryButton, Divider, Muted } from "./layout";

interface Props {
  numeComplet: string;
  appUrl: string;
}

export function ContReactivatEmail({ numeComplet, appUrl }: Props) {
  const firstName = numeComplet.split(" ")[0];

  return (
    <EmailLayout preview="Contul tău Velos.ro a fost reactivat!">
      <H1>Contul tău a fost reactivat ✅</H1>
      <P>
        Salut, <strong>{firstName}</strong>!
      </P>
      <P>
        Contul tău Velos.ro a fost reactivat. Poți accesa din nou platforma
        și toate funcționalitățile tale — programări, clienți, remindere SMS
        și rapoarte.
      </P>

      <PrimaryButton href={`${appUrl}/dashboard`}>
        Accesează dashboard-ul
      </PrimaryButton>

      <Divider />

      <Muted>
        Ai întrebări? Scrie-ne la{" "}
        <a href="mailto:support@velos.ro" style={{ color: "#1877F2" }}>
          support@velos.ro
        </a>
        .
      </Muted>
    </EmailLayout>
  );
}

export default ContReactivatEmail;
