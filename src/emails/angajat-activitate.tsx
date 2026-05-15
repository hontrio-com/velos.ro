import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface Props {
  numeAngajat: string;
  functieAngajat?: string;
  actiune: string;
  detalii: { label: string; value: string }[];
  numeStatie: string;
}

export function AngajatActivitateEmail({
  numeAngajat,
  functieAngajat,
  actiune,
  detalii,
  numeStatie,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>
        {numeAngajat} — {actiune}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>Velos.ro</Text>
          </Section>

          <Section style={content}>
            <Heading style={heading}>Activitate angajat</Heading>
            <Text style={subtitle}>
              <strong>{numeAngajat}</strong>
              {functieAngajat ? ` (${functieAngajat})` : ""} a efectuat o
              acțiune pe platforma{" "}
              <strong>{numeStatie}</strong>.
            </Text>

            <Section style={actionBox}>
              <Text style={actionLabel}>Acțiune</Text>
              <Text style={actionValue}>{actiune}</Text>
            </Section>

            <Section style={detailsBox}>
              {detalii.map(({ label, value }) => (
                <Section key={label} style={detailRow}>
                  <Text style={detailLabel}>{label}</Text>
                  <Text style={detailValue}>{value}</Text>
                </Section>
              ))}
            </Section>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Velos.ro — Platformă gestionare ITP
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#F7F8FA",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const container = {
  maxWidth: "520px",
  margin: "0 auto",
  padding: "24px 16px",
};

const header = {
  backgroundColor: "#1877F2",
  borderRadius: "12px 12px 0 0",
  padding: "20px 24px",
};

const brand = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0",
};

const content = {
  backgroundColor: "#ffffff",
  padding: "24px",
  borderRadius: "0 0 12px 12px",
  border: "1px solid #E5E7EB",
  borderTop: "none",
};

const heading = {
  color: "#111318",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0 0 8px",
};

const subtitle = {
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 20px",
};

const actionBox = {
  backgroundColor: "#EFF6FF",
  borderRadius: "8px",
  padding: "12px 16px",
  marginBottom: "16px",
};

const actionLabel = {
  color: "#6B7280",
  fontSize: "11px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 4px",
};

const actionValue = {
  color: "#1877F2",
  fontSize: "15px",
  fontWeight: "600",
  margin: "0",
};

const detailsBox = {
  backgroundColor: "#F9FAFB",
  borderRadius: "8px",
  padding: "12px 16px",
};

const detailRow = {
  display: "flex" as const,
  marginBottom: "8px",
};

const detailLabel = {
  color: "#9CA3AF",
  fontSize: "12px",
  fontWeight: "500",
  width: "120px",
  margin: "0",
};

const detailValue = {
  color: "#111318",
  fontSize: "13px",
  fontWeight: "500",
  margin: "0",
};

const hr = {
  borderColor: "#E5E7EB",
  margin: "20px 0 12px",
};

const footer = {
  color: "#9CA3AF",
  fontSize: "12px",
  textAlign: "center" as const,
  margin: "0",
};
