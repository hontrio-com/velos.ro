import * as React from "react";
import { EmailLayout, H1, P, Divider, Muted, InfoRow, AlertBox } from "./layout";

interface Props {
  numeClient: string;
  nrInmatriculare: string;
  dataFormatata: string;
  ora: string;
  tipServiciu: string;
  numeStatie: string;
  telefonStatie?: string;
  motiv?: string;
}

export function ProgramareAnulataEmail({
  numeClient, nrInmatriculare, dataFormatata, ora,
  tipServiciu, numeStatie, telefonStatie, motiv,
}: Props) {
  const firstName = numeClient.split(" ")[0];

  return (
    <EmailLayout preview={`Programarea ta din ${dataFormatata} la ${ora} a fost anulată`}>
      <H1>Programare anulată</H1>
      <P>Salut, <strong>{firstName}</strong>,</P>
      <P>
        Îți comunicăm că programarea ta a fost anulată.
      </P>

      <AlertBox color="#991B1B" bg="#FEF2F2" border="#FECACA">
        ❌ Programarea din <strong>{dataFormatata} la {ora}</strong> a fost anulată.
      </AlertBox>

      <div style={{
        backgroundColor: "#F7F8FA",
        borderRadius: 10,
        padding: "16px 20px",
        margin: "16px 0",
        border: "1px solid #F3F4F6",
      }}>
        <InfoRow label="🔧 Serviciu" value={tipServiciu} />
        <InfoRow label="🚗 Vehicul" value={nrInmatriculare} />
        <InfoRow label="🏢 Stație" value={numeStatie} />
      </div>

      {motiv && (
        <AlertBox color="#374151" bg="#F9FAFB" border="#E5E7EB">
          💬 <strong>Motiv:</strong> {motiv}
        </AlertBox>
      )}

      <Divider />

      <P style={{ fontSize: 14 }}>
        Dorești să faci o nouă programare? Contactează stația{telefonStatie ? ` la <strong>${telefonStatie}</strong>` : ""} sau rezervă online.
      </P>

      <Muted>
        Ne pare rău pentru inconveniență. Echipa {numeStatie}.
      </Muted>
    </EmailLayout>
  );
}

export default ProgramareAnulataEmail;
