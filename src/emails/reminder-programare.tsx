import * as React from "react";
import { EmailLayout, H1, P, Divider, Muted, InfoRow, AlertBox } from "./layout";

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
  // "maine" | "azi" | "peste_X_zile"
  cand: "maine" | "azi";
}

export function ReminderProgramareEmail({
  numeClient, nrInmatriculare, marcaModel,
  dataFormatata, ora, tipServiciu,
  numeStatie, adresaStatie, telefonStatie,
  cand,
}: Props) {
  const firstName = numeClient.split(" ")[0];
  const isAzi = cand === "azi";

  return (
    <EmailLayout
      preview={`Reminder: programare ${isAzi ? "AZI" : "mâine"} la ${ora} — ${tipServiciu}`}
    >
      <H1>{isAzi ? "Programare azi! ⏰" : "Programare mâine! 📅"}</H1>
      <P>Salut, <strong>{firstName}</strong>!</P>
      <P>
        Îți amintim că ai o programare {isAzi ? "<strong>astăzi</strong>" : "<strong>mâine</strong>"} la stația <strong>{numeStatie}</strong>.
      </P>

      <AlertBox
        color={isAzi ? "#991B1B" : "#92400E"}
        bg={isAzi ? "#FEF2F2" : "#FFFBEB"}
        border={isAzi ? "#FECACA" : "#FDE68A"}
      >
        {isAzi ? "⏰" : "📅"} <strong>{isAzi ? "Astăzi" : "Mâine"}, {dataFormatata} la ora {ora}</strong>
      </AlertBox>

      <div style={{
        backgroundColor: "#F7F8FA",
        borderRadius: 10,
        padding: "16px 20px",
        margin: "16px 0",
        border: "1px solid #F3F4F6",
      }}>
        <InfoRow label="🔧 Serviciu" value={tipServiciu} />
        <InfoRow label="🚗 Vehicul" value={`${nrInmatriculare} — ${marcaModel}`} />
        <InfoRow label="🏢 Stație" value={numeStatie} />
        {adresaStatie && <InfoRow label="📍 Adresă" value={adresaStatie} />}
        {telefonStatie && <InfoRow label="📞 Telefon" value={telefonStatie} />}
      </div>

      <P style={{ fontSize: 14 }}>
        <strong>Nu uita:</strong><br />
        ✔ Actele vehiculului (talon, CIV, CI proprietar)<br />
        ✔ RCA valabil<br />
        ✔ Sosește cu 10 minute înainte
      </P>

      <Divider />

      <Muted>
        Trebuie să anulezi? Contactează stația la {telefonStatie || "numărul stației"} cât mai curând.
      </Muted>
    </EmailLayout>
  );
}

export default ReminderProgramareEmail;
