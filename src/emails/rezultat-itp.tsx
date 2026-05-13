import * as React from "react";
import { EmailLayout, H1, P, Divider, Muted, InfoRow, AlertBox } from "./layout";

interface Props {
  numeClient: string;
  nrInmatriculare: string;
  marcaModel?: string;
  rezultat: "admis" | "respins" | "readmis";
  dataInspectie: string;
  expirareNoua?: string;
  inspector?: string;
  numeStatie: string;
  telefonStatie?: string;
  observatiiTehnice?: string;
}

const REZULTAT_CONFIG = {
  admis: {
    icon: "✅",
    title: "ITP Admis",
    color: "#166534",
    bg: "#F0FDF4",
    border: "#BBF7D0",
    mesaj: "Vehiculul tău a trecut inspecția tehnică periodică cu succes!",
  },
  respins: {
    icon: "❌",
    title: "ITP Respins",
    color: "#991B1B",
    bg: "#FEF2F2",
    border: "#FECACA",
    mesaj: "Din păcate, vehiculul tău nu a trecut inspecția tehnică. Sunt necesare remedieri.",
  },
  readmis: {
    icon: "🔄",
    title: "ITP Readmis",
    color: "#1E40AF",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    mesaj: "Vehiculul tău a fost readmis după remedierea defecțiunilor constatate anterior.",
  },
};

export function RezultatItpEmail({
  numeClient, nrInmatriculare, marcaModel,
  rezultat, dataInspectie, expirareNoua,
  inspector, numeStatie, telefonStatie, observatiiTehnice,
}: Props) {
  const firstName = numeClient.split(" ")[0];
  const cfg = REZULTAT_CONFIG[rezultat];

  return (
    <EmailLayout preview={`Rezultat ITP ${cfg.title} — ${nrInmatriculare} — ${dataInspectie}`}>
      <H1>{cfg.icon} {cfg.title} — {nrInmatriculare}</H1>
      <P>Salut, <strong>{firstName}</strong>!</P>
      <P>{cfg.mesaj}</P>

      <AlertBox color={cfg.color} bg={cfg.bg} border={cfg.border}>
        {cfg.icon} <strong>Rezultat: {cfg.title}</strong> — {dataInspectie}
      </AlertBox>

      <div style={{
        backgroundColor: "#F7F8FA",
        borderRadius: 10,
        padding: "16px 20px",
        margin: "16px 0",
        border: "1px solid #F3F4F6",
      }}>
        <InfoRow label="🚗 Vehicul" value={`${nrInmatriculare}${marcaModel ? ` — ${marcaModel}` : ""}`} />
        <InfoRow label="📅 Data inspecție" value={dataInspectie} />
        {expirareNoua && <InfoRow label="📋 ITP valabil până la" value={expirareNoua} />}
        {inspector && <InfoRow label="👨‍🔧 Inspector" value={inspector} />}
        <InfoRow label="🏢 Stație" value={numeStatie} />
      </div>

      {observatiiTehnice && (
        <AlertBox color="#374151" bg="#F9FAFB" border="#E5E7EB">
          🔧 <strong>Observații tehnice:</strong><br />{observatiiTehnice}
        </AlertBox>
      )}

      {rezultat === "respins" && (
        <>
          <Divider />
          <P style={{ fontSize: 14 }}>
            <strong>Ce trebuie să faci:</strong><br />
            1. Remediați defecțiunile constatate la un service auto autorizat<br />
            2. Reveniți la stație pentru reinspecție<br />
            3. Reinspecția se efectuează gratuit în termen de 30 de zile
          </P>
        </>
      )}

      <Divider />

      <Muted>
        {telefonStatie && `Contact stație: ${telefonStatie} · `}
        Vă mulțumim că ați ales {numeStatie}!
      </Muted>
    </EmailLayout>
  );
}

export default RezultatItpEmail;
