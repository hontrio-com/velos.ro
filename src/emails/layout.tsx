import {
  Body, Container, Head, Html, Img, Preview,
  Section, Text, Hr, Font,
} from "@react-email/components";
import * as React from "react";

const BRAND = "#1877F2";
const BG = "#F7F8FA";
const TEXT = "#111318";
const MUTED = "#6B7280";

interface LayoutProps {
  preview: string;
  children: React.ReactNode;
  footer?: string;
}

export function EmailLayout({ preview, children, footer }: LayoutProps) {
  return (
    <Html lang="ro">
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: BG, margin: 0, padding: 0, fontFamily: "Inter, Helvetica, sans-serif" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "32px 16px" }}>

          {/* Logo / header */}
          <Section style={{ textAlign: "center", marginBottom: 24 }}>
            <Img
              src="https://velos.ro/logo.png"
              alt="Velos"
              width={140}
              height={36}
              style={{ margin: "0 auto", display: "block" }}
            />
          </Section>

          {/* Card */}
          <Section style={{
            backgroundColor: "#ffffff",
            borderRadius: 16,
            padding: "32px 32px 28px",
            border: "1px solid #F3F4F6",
          }}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={{ textAlign: "center", marginTop: 24 }}>
            <Text style={{ fontSize: 11, color: MUTED, margin: 0 }}>
              {footer ?? "Ai primit acest email deoarece ești înregistrat pe velos.ro"}
            </Text>
            <Text style={{ fontSize: 11, color: MUTED, margin: "4px 0 0" }}>
              © {new Date().getFullYear()} Velos.ro · Toate drepturile rezervate
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

// Reusable pieces
export const H1 = ({ children }: { children: React.ReactNode }) => (
  <Text style={{ fontSize: 22, fontWeight: 700, color: "#111318", margin: "0 0 8px", lineHeight: "1.3" }}>
    {children}
  </Text>
);

export const P = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <Text style={{ fontSize: 15, color: "#374151", lineHeight: "1.6", margin: "0 0 16px", ...style }}>
    {children}
  </Text>
);

export const Muted = ({ children }: { children: React.ReactNode }) => (
  <Text style={{ fontSize: 13, color: MUTED, lineHeight: "1.5", margin: "0 0 12px" }}>
    {children}
  </Text>
);

export const Divider = () => (
  <Hr style={{ borderColor: "#F3F4F6", margin: "20px 0" }} />
);

export const PrimaryButton = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Section style={{ textAlign: "center", margin: "24px 0 8px" }}>
    <a
      href={href}
      style={{
        display: "inline-block",
        backgroundColor: BRAND,
        color: "#ffffff",
        fontSize: 15,
        fontWeight: 600,
        padding: "12px 32px",
        borderRadius: 10,
        textDecoration: "none",
        letterSpacing: "-0.1px",
      }}
    >
      {children}
    </a>
  </Section>
);

export const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <Section style={{ marginBottom: 8 }}>
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <tbody>
        <tr>
          <td style={{ fontSize: 13, color: MUTED, width: "40%", paddingBottom: 6 }}>{label}</td>
          <td style={{ fontSize: 13, color: TEXT, fontWeight: 600, paddingBottom: 6 }}>{value}</td>
        </tr>
      </tbody>
    </table>
  </Section>
);

export const AlertBox = ({ color, bg, border, children }: {
  color: string; bg: string; border: string; children: React.ReactNode;
}) => (
  <Section style={{
    backgroundColor: bg,
    border: `1px solid ${border}`,
    borderRadius: 10,
    padding: "12px 16px",
    margin: "16px 0",
  }}>
    <Text style={{ fontSize: 14, color, margin: 0, lineHeight: "1.5" }}>
      {children}
    </Text>
  </Section>
);
