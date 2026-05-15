import * as React from "react";
import { EmailLayout, H1, P, AlertBox, Divider, Muted } from "./layout";

interface Props {
  numeComplet: string;
  motiv?: string;
}

export function ContSuspendatEmail({ numeComplet, motiv }: Props) {
  const firstName = numeComplet.split(" ")[0];

  return (
    <EmailLayout preview="Contul tău Velos.ro a fost suspendat">
      <H1>Contul tău a fost suspendat</H1>
      <P>
        Salut, <strong>{firstName}</strong>!
      </P>
      <P>
        Contul tău Velos.ro a fost suspendat de echipa noastră de suport.
        Accesul la platformă a fost restricționat temporar.
      </P>

      {motiv && (
        <AlertBox color="#991B1B" bg="#FEF2F2" border="#FECACA">
          ⚠️ <strong>Motiv:</strong> {motiv}
        </AlertBox>
      )}

      <Divider />

      <P style={{ fontSize: 14 }}>
        Dacă crezi că este o eroare sau dorești să clarifici situația,
        contactează echipa noastră la{" "}
        <a href="mailto:support@velos.ro" style={{ color: "#1877F2" }}>
          support@velos.ro
        </a>{" "}
        și îți vom răspunde în cel mai scurt timp.
      </P>

      <Muted>Velos.ro — Platformă pentru stații ITP</Muted>
    </EmailLayout>
  );
}

export default ContSuspendatEmail;
