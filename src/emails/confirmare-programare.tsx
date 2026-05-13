import * as React from "react";
import { EmailLayout, H1, P, PrimaryButton, Divider, Muted, InfoRow, AlertBox } from "./layout";

interface Props {
  numeClient: string;
  nrInmatriculare: string;
  marcaModel: string;
  dataFormatata: string;
  ora: string;
  tipServiciu: string;
  numeStatie: string;
  adresaStatie?: string;
  telefonStatie?: string;
  pret?: string;
  observatii?: string;
  appUrl: string;
}

export function ConfirmareProgramareEmail({
  numeClient, nrInmatriculare, marcaModel,
  dataFormatata, ora, tipServiciu,
  numeStatie, adresaStatie, telefonStatie,
  pret, observatii, appUrl,
}: Props) {
  const firstName = numeClient.split(" ")[0];

  return (
    <EmailLayout preview={`Programare confirmată: ${tipServiciu} pe ${dataFormatata} la ${ora}`}>
      <H1>Programare confirmată ✅</H1>
      <P>Salut, <strong>{firstName}</strong>!</P>
      <P>
        Programarea ta a fost înregistrată cu succes. Mai jos găsești toate detaliile.
      </P>

      {/* Details card */}
      <div style={{
        backgroundColor: "#F7F8FA",
        borderRadius: 10,
        padding: "16px 20px",
        margin: "16px 0",
        border: "1px solid #F3F4F6",
      }}>
        <InfoRow label="📅 Data" value={dataFormatata} />
        <InfoRow label="🕐 Ora" value={ora} />
        <InfoRow label="🔧 Serviciu" value={tipServiciu} />
        <InfoRow label="🚗 Vehicul" value={`${nrInmatriculare} — ${marcaModel}`} />
        <InfoRow label="🏢 Stație" value={numeStatie} />
        {adresaStatie && <InfoRow label="📍 Adresă" value={adresaStatie} />}
        {telefonStatie && <InfoRow label="📞 Telefon" value={telefonStatie} />}
        {pret && <InfoRow label="💰 Preț" value={`${pret} RON`} />}
      </div>

      {observatii && (
        <AlertBox color="#1E40AF" bg="#EFF6FF" border="#BFDBFE">
          💬 <strong>Observații:</strong> {observatii}
        </AlertBox>
      )}

      <Divider />

      <P style={{ fontSize: 14 }}>
        <strong>Pregătește-te pentru inspecție:</strong><br />
        ✔ Actele vehiculului (talon, CIV, CI proprietar)<br />
        ✔ RCA valabil<br />
        ✔ Vehiculul curat și în stare de funcționare<br />
        ✔ Sosește cu 10 minute înainte de ora programată
      </P>

      <Divider />

      <Muted>
        Ai nevoie să modifici sau să anulezi programarea? Contactează-ne la {telefonStatie || "numărul stației"}.
      </Muted>
    </EmailLayout>
  );
}

export default ConfirmareProgramareEmail;
