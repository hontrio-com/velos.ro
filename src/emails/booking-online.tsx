import * as React from "react";
import { EmailLayout, H1, P, Divider, Muted, InfoRow, AlertBox } from "./layout";

interface Props {
  numeClient: string;
  nrInmatriculare: string;
  marcaModel?: string;
  dataFormatata: string;
  ora: string;
  tipServiciu: string;
  numeStatie: string;
  adresaStatie?: string;
  telefonStatie?: string;
  observatii?: string;
}

export function BookingOnlineEmail({
  numeClient, nrInmatriculare, marcaModel,
  dataFormatata, ora, tipServiciu,
  numeStatie, adresaStatie, telefonStatie, observatii,
}: Props) {
  const firstName = numeClient.split(" ")[0];

  return (
    <EmailLayout preview={`Rezervare online confirmată: ${tipServiciu} pe ${dataFormatata} la ${ora}`}>
      <H1>Rezervare online confirmată! 🎉</H1>
      <P>Salut, <strong>{firstName}</strong>!</P>
      <P>
        Ai rezervat cu succes o programare online la <strong>{numeStatie}</strong>.
        Echipa stației va confirma programarea și te va contacta dacă apar modificări.
      </P>

      <AlertBox color="#166534" bg="#F0FDF4" border="#BBF7D0">
        ✅ Rezervarea ta a fost primită și este în curs de confirmare.
      </AlertBox>

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
        <InfoRow label="🚗 Vehicul" value={`${nrInmatriculare}${marcaModel ? ` — ${marcaModel}` : ""}`} />
        <InfoRow label="🏢 Stație" value={numeStatie} />
        {adresaStatie && <InfoRow label="📍 Adresă" value={adresaStatie} />}
        {telefonStatie && <InfoRow label="📞 Telefon" value={telefonStatie} />}
      </div>

      {observatii && (
        <AlertBox color="#374151" bg="#F9FAFB" border="#E5E7EB">
          💬 <strong>Observațiile tale:</strong> {observatii}
        </AlertBox>
      )}

      <Divider />

      <P style={{ fontSize: 14 }}>
        <strong>Pregătire pentru ziua ITP:</strong><br />
        ✔ Talon, CIV și CI proprietar<br />
        ✔ RCA valabil<br />
        ✔ Sosire cu 10 minute înainte<br />
        ✔ Vehiculul curat și funcțional
      </P>

      <Muted>
        Modificări sau anulare? Contactează stația la {telefonStatie || "numărul afișat pe site"}.
      </Muted>
    </EmailLayout>
  );
}

export default BookingOnlineEmail;
