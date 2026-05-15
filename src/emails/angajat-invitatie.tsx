import {
  Body,
  Button,
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
  numeStatie: string;
  email: string;
  parola: string;
  permisiuni: string[];
  appUrl: string;
}

export function AngajatInvitatieEmail({
  numeAngajat,
  numeStatie,
  email,
  parola,
  permisiuni,
  appUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Ai primit acces pe Velos.ro — {numeStatie}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={brand}>Velos.ro</Text>
          </Section>

          <Section style={content}>
            <Heading style={heading}>Bun venit pe Velos.ro!</Heading>
            <Text style={para}>
              Salut <strong>{numeAngajat}</strong>,
            </Text>
            <Text style={para}>
              Ai primit acces ca angajat pe platforma <strong>{numeStatie}</strong>.
              Folosește datele de mai jos pentru a te conecta.
            </Text>

            <Section style={credentialsBox}>
              <Text style={credLabel}>Email</Text>
              <Text style={credValue}>{email}</Text>
              <Hr style={credDivider} />
              <Text style={credLabel}>Parolă temporară</Text>
              <Text style={credValue}>{parola}</Text>
            </Section>

            <Text style={para}>
              Vei avea acces la secțiunile: <strong>{permisiuni.join(", ")}</strong>.
            </Text>

            <Button href={`${appUrl}/login`} style={button}>
              Intră în platformă
            </Button>

            <Text style={warning}>
              Te rugăm să îți schimbi parola după prima autentificare.
            </Text>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>Velos.ro — Platformă gestionare ITP</Text>
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

const headerSection = {
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
  fontSize: "20px",
  fontWeight: "700",
  margin: "0 0 16px",
};

const para = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 12px",
};

const credentialsBox = {
  backgroundColor: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
};

const credLabel = {
  color: "#9CA3AF",
  fontSize: "11px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 4px",
};

const credValue = {
  color: "#111318",
  fontSize: "15px",
  fontWeight: "600",
  fontFamily: "monospace",
  margin: "0 0 8px",
};

const credDivider = {
  borderColor: "#E5E7EB",
  margin: "8px 0",
};

const button = {
  backgroundColor: "#1877F2",
  borderRadius: "8px",
  color: "#ffffff",
  display: "block",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 24px",
  textAlign: "center" as const,
  textDecoration: "none",
  margin: "20px 0",
};

const warning = {
  color: "#9CA3AF",
  fontSize: "12px",
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
