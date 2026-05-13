import * as React from "react";
import { EmailLayout, H1, P, PrimaryButton, Divider, Muted, InfoRow, AlertBox } from "./layout";

interface Props {
  numeClient: string;
  nrInmatriculare: string;
  marcaModel?: string;
  dataExpirare: string; // formatată: "15 martie 2025"
  zileRamase: number;   // negativ = expirat
  numeStatie: string;
  telefonStatie?: string;
  bookingUrl?: string;
  appUrl: string;
}

export function ReminderItpEmail({
  numeClient, nrInmatriculare, marcaModel,
  dataExpirare, zileRamase,
  numeStatie, telefonStatie, bookingUrl, appUrl,
}: Props) {
  const firstName = numeClient.split(" ")[0];
  const expirat = zileRamase < 0;
  const urgent = zileRamase >= 0 && zileRamase <= 7;

  const alertConfig = expirat
    ? { color: "#991B1B", bg: "#FEF2F2", border: "#FECACA", icon: "🚨" }
    : urgent
    ? { color: "#92400E", bg: "#FFFBEB", border: "#FDE68A", icon: "⚠️" }
    : { color: "#1E40AF", bg: "#EFF6FF", border: "#BFDBFE", icon: "📋" };

  const titleText = expirat
    ? `ITP expirat de ${Math.abs(zileRamase)} zile!`
    : zileRamase === 0
    ? "ITP expiră AZI!"
    : zileRamase === 1
    ? "ITP expiră mâine!"
    : `ITP expiră în ${zileRamase} zile`;

  const previewText = expirat
    ? `Atenție! ITP-ul pentru ${nrInmatriculare} a expirat. Programează-te urgent.`
    : `ITP-ul pentru ${nrInmatriculare} expiră în ${zileRamase} zile — ${dataExpirare}`;

  return (
    <EmailLayout preview={previewText}>
      <H1>{alertConfig.icon} {titleText}</H1>
      <P>Salut, <strong>{firstName}</strong>!</P>

      {expirat ? (
        <P>
          ITP-ul vehiculului <strong>{nrInmatriculare}</strong> a expirat pe <strong>{dataExpirare}</strong>.
          Circulația cu un vehicul fără ITP valabil este interzisă și se poate sancționa cu amendă și reținerea talonului.
        </P>
      ) : (
        <P>
          ITP-ul vehiculului <strong>{nrInmatriculare}</strong> expiră pe <strong>{dataExpirare}</strong>.
          {zileRamase <= 30 && " Te sfătuim să faci programare cât mai curând."}
        </P>
      )}

      <AlertBox color={alertConfig.color} bg={alertConfig.bg} border={alertConfig.border}>
        {alertConfig.icon} <strong>Data expirare ITP: {dataExpirare}</strong>
        {expirat && ` (expirat de ${Math.abs(zileRamase)} zile)`}
        {!expirat && zileRamase >= 0 && ` — mai sunt ${zileRamase} zile`}
      </AlertBox>

      <div style={{
        backgroundColor: "#F7F8FA",
        borderRadius: 10,
        padding: "16px 20px",
        margin: "16px 0",
        border: "1px solid #F3F4F6",
      }}>
        <InfoRow label="🚗 Vehicul" value={`${nrInmatriculare}${marcaModel ? ` — ${marcaModel}` : ""}`} />
        <InfoRow label="🏢 Stație" value={numeStatie} />
        {telefonStatie && <InfoRow label="📞 Contact" value={telefonStatie} />}
      </div>

      {bookingUrl && (
        <PrimaryButton href={bookingUrl}>
          Programează-te online acum
        </PrimaryButton>
      )}

      <Divider />

      {expirat ? (
        <AlertBox color="#991B1B" bg="#FEF2F2" border="#FECACA">
          ⚠️ Conform legii, circulația fără ITP valabil se sancționează cu amendă între 1.000 și 2.500 lei și reținerea certificatului de înmatriculare.
        </AlertBox>
      ) : (
        <P style={{ fontSize: 14 }}>
          <strong>Ce ai nevoie pentru ITP:</strong><br />
          ✔ Talon și CIV original<br />
          ✔ CI proprietar sau procură<br />
          ✔ RCA valabil<br />
          ✔ Vehiculul în stare de funcționare
        </P>
      )}

      <Muted>
        Ai primit acest reminder pentru că ești client al stației {numeStatie}.
        {telefonStatie && ` Contact: ${telefonStatie}`}
      </Muted>
    </EmailLayout>
  );
}

export default ReminderItpEmail;
