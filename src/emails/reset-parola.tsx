import * as React from "react";
import { EmailLayout, H1, P, PrimaryButton, Divider, Muted, AlertBox } from "./layout";

interface Props {
  numeComplet: string;
  resetUrl: string;
}

export function ResetParolaEmail({ numeComplet, resetUrl }: Props) {
  const firstName = numeComplet?.split(" ")[0] || "utilizator";

  return (
    <EmailLayout preview="Ai solicitat resetarea parolei contului Velos.ro">
      <H1>Resetare parolă</H1>
      <P>Salut, <strong>{firstName}</strong>!</P>
      <P>
        Am primit o solicitare de resetare a parolei pentru contul tău Velos.ro.
        Apasă butonul de mai jos pentru a seta o parolă nouă.
      </P>

      <PrimaryButton href={resetUrl}>
        Resetează parola
      </PrimaryButton>

      <AlertBox color="#92400E" bg="#FFFBEB" border="#FDE68A">
        ⏱ Acest link este valabil <strong>60 de minute</strong>. După expirare,
        va trebui să soliciți din nou resetarea parolei.
      </AlertBox>

      <Divider />

      <Muted>
        Dacă nu ai solicitat resetarea parolei, ignoră acest email —
        contul tău este în siguranță.
      </Muted>
      <Muted>
        Din motive de securitate, nu vom trimite niciodată parola ta prin email.
      </Muted>
    </EmailLayout>
  );
}

export default ResetParolaEmail;
