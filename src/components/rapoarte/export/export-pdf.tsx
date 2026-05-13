"use client";

// @react-pdf/renderer is always dynamically imported — this file is the document template
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type {
  RaportFinanciar,
  RaportProgramari,
  RaportItp,
  RaportSms,
  RaportAngajati,
} from "@/lib/actions/rapoarte";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";

Font.register({
  family: "Helvetica",
  fonts: [{ src: "Helvetica" }],
});

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: "#111318", padding: 40 },
  coverPage: { fontFamily: "Helvetica", fontSize: 10, color: "#111318", padding: 60, justifyContent: "center" },
  headerBar: { backgroundColor: "#1877F2", height: 4, marginBottom: 30 },
  logo: { fontSize: 22, fontWeight: "bold", color: "#1877F2", marginBottom: 4 },
  coverTitle: { fontSize: 28, fontWeight: "bold", color: "#111318", marginBottom: 8 },
  coverSubtitle: { fontSize: 13, color: "#6B7280", marginBottom: 4 },
  coverMeta: { fontSize: 10, color: "#9CA3AF", marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "bold", color: "#1877F2", marginBottom: 10, borderBottom: "1px solid #E5E7EB", paddingBottom: 4 },
  kpiRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  kpiBox: { flex: 1, backgroundColor: "#F7F8FA", borderRadius: 6, padding: 10 },
  kpiValue: { fontSize: 18, fontWeight: "bold", color: "#111318" },
  kpiLabel: { fontSize: 9, color: "#6B7280", marginTop: 2 },
  table: { width: "100%" },
  tableHeader: { flexDirection: "row", backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E7EB", paddingVertical: 5, paddingHorizontal: 8 },
  tableRow: { flexDirection: "row", borderBottom: "1px solid #F3F4F6", paddingVertical: 4, paddingHorizontal: 8 },
  tableRowTotal: { flexDirection: "row", borderTop: "2px solid #E5E7EB", paddingVertical: 5, paddingHorizontal: 8, fontWeight: "bold", backgroundColor: "#F9FAFB" },
  th: { fontSize: 8, fontWeight: "bold", color: "#6B7280" },
  td: { fontSize: 9, color: "#374151" },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: "#9CA3AF", borderTop: "1px solid #F3F4F6", paddingTop: 6 },
  mt8: { marginTop: 8 },
  mt16: { marginTop: 16 },
  summaryText: { fontSize: 11, color: "#374151", lineHeight: 1.6 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8 },
});

function fmtRon(v: number) {
  return `${v.toLocaleString("ro-RO", { maximumFractionDigits: 0 })} RON`;
}

function fmtDate(d: string) {
  try { return format(parseISO(d), "d MMM yyyy", { locale: ro }); } catch { return d; }
}

function Footer({ statie, from, to }: { statie: string; from: string; to: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>ITP CRM · {statie}</Text>
      <Text>{fmtDate(from)} — {fmtDate(to)}</Text>
      <Text render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} din ${totalPages}`} />
    </View>
  );
}

interface RaportPdfProps {
  statie: string;
  statieSlug: string;
  from: string;
  to: string;
  financiar: RaportFinanciar | null;
  programari: RaportProgramari | null;
  itp: RaportItp | null;
  sms: RaportSms | null;
  angajati: RaportAngajati | null;
}

export function RaportPdfDocument({
  statie,
  from,
  to,
  financiar,
  programari,
  itp,
  sms,
  angajati,
}: RaportPdfProps) {
  const genDate = format(new Date(), "d MMMM yyyy, HH:mm", { locale: ro });

  return (
    <Document>
      {/* ── COVER ── */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.headerBar} />
        <Text style={styles.logo}>ITP CRM</Text>
        <Text style={styles.coverTitle}>Raport Activitate</Text>
        <Text style={styles.coverSubtitle}>{statie}</Text>
        <Text style={styles.coverSubtitle}>
          {fmtDate(from)} — {fmtDate(to)}
        </Text>
        <Text style={styles.coverMeta}>Generat la: {genDate}</Text>
      </Page>

      {/* ── SUMAR EXECUTIV ── */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Sumar executiv</Text>
        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{financiar ? fmtRon(financiar.kpi.venit_total) : "—"}</Text>
            <Text style={styles.kpiLabel}>Venit total</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{programari?.kpi.total ?? "—"}</Text>
            <Text style={styles.kpiLabel}>Total programări</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{programari ? `${programari.kpi.rata_prezenta}%` : "—"}</Text>
            <Text style={styles.kpiLabel}>Rată prezență</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{sms?.kpi.total ?? "—"}</Text>
            <Text style={styles.kpiLabel}>SMS trimise</Text>
          </View>
        </View>
        {programari && financiar && (
          <Text style={styles.summaryText}>
            În perioada {fmtDate(from)} — {fmtDate(to)}, stația {statie} a înregistrat{" "}
            {programari.kpi.total} programări, cu o rată de prezență de{" "}
            {programari.kpi.rata_prezenta}%. Au fost finalizate {financiar.kpi.itp_platite} inspecții
            ITP, generând venituri totale de {fmtRon(financiar.kpi.venit_total)}.
            {itp ? ` Rata de admitere ITP: ${itp.kpi.rata_admitere}%.` : ""}
            {sms ? ` Au fost trimise ${sms.kpi.total} SMS-uri, cu o rată de livrare de ${sms.kpi.rata_livrare}%.` : ""}
          </Text>
        )}
        <Footer statie={statie} from={from} to={to} />
      </Page>

      {/* ── FINANCIAR ── */}
      {financiar && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Financiar</Text>
          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}><Text style={styles.kpiValue}>{fmtRon(financiar.kpi.venit_total)}</Text><Text style={styles.kpiLabel}>Venit total</Text></View>
            <View style={styles.kpiBox}><Text style={styles.kpiValue}>{financiar.kpi.itp_platite}</Text><Text style={styles.kpiLabel}>ITP-uri plătite</Text></View>
            <View style={styles.kpiBox}><Text style={styles.kpiValue}>{fmtRon(financiar.kpi.pret_mediu)}</Text><Text style={styles.kpiLabel}>Preț mediu</Text></View>
            <View style={styles.kpiBox}><Text style={styles.kpiValue}>{financiar.kpi.rata_colectare}%</Text><Text style={styles.kpiLabel}>Rată colectare</Text></View>
          </View>
          <View style={[styles.table, styles.mt8]}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.flex2]}>Data</Text>
              <Text style={[styles.th, styles.flex1]}>Total</Text>
              <Text style={[styles.th, styles.flex1]}>Finalizate</Text>
              <Text style={[styles.th, styles.flex1]}>Venit (RON)</Text>
            </View>
            {financiar.zilnic.slice(0, 40).map((z) => (
              <View key={z.data} style={styles.tableRow}>
                <Text style={[styles.td, styles.flex2]}>{fmtDate(z.data)}</Text>
                <Text style={[styles.td, styles.flex1]}>{z.total}</Text>
                <Text style={[styles.td, styles.flex1]}>{z.finalizate}</Text>
                <Text style={[styles.td, styles.flex1]}>{z.venit.toLocaleString("ro-RO")}</Text>
              </View>
            ))}
            <View style={styles.tableRowTotal}>
              <Text style={[styles.td, styles.flex2]}>TOTAL</Text>
              <Text style={[styles.td, styles.flex1]}>{financiar.zilnic.reduce((s, z) => s + z.total, 0)}</Text>
              <Text style={[styles.td, styles.flex1]}>{financiar.zilnic.reduce((s, z) => s + z.finalizate, 0)}</Text>
              <Text style={[styles.td, styles.flex1]}>{financiar.kpi.venit_total.toLocaleString("ro-RO")}</Text>
            </View>
          </View>
          <Footer statie={statie} from={from} to={to} />
        </Page>
      )}

      {/* ── PROGRAMĂRI ── */}
      {programari && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Programări</Text>
          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}><Text style={styles.kpiValue}>{programari.kpi.total}</Text><Text style={styles.kpiLabel}>Total</Text></View>
            <View style={styles.kpiBox}><Text style={styles.kpiValue}>{programari.kpi.finalizate}</Text><Text style={styles.kpiLabel}>Finalizate</Text></View>
            <View style={styles.kpiBox}><Text style={styles.kpiValue}>{programari.kpi.neprezent}</Text><Text style={styles.kpiLabel}>Neprezent</Text></View>
            <View style={styles.kpiBox}><Text style={styles.kpiValue}>{programari.kpi.rata_prezenta}%</Text><Text style={styles.kpiLabel}>Rată prezență</Text></View>
          </View>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.flex2]}>Data</Text>
              <Text style={[styles.th, styles.flex1]}>Total</Text>
              <Text style={[styles.th, styles.flex1]}>Finalizate</Text>
              <Text style={[styles.th, styles.flex1]}>Neprezent</Text>
              <Text style={[styles.th, styles.flex1]}>%</Text>
            </View>
            {programari.zilnic.slice(0, 40).map((z) => (
              <View key={z.data} style={styles.tableRow}>
                <Text style={[styles.td, styles.flex2]}>{fmtDate(z.data)}</Text>
                <Text style={[styles.td, styles.flex1]}>{z.total}</Text>
                <Text style={[styles.td, styles.flex1]}>{z.finalizate}</Text>
                <Text style={[styles.td, styles.flex1]}>{z.neprezent}</Text>
                <Text style={[styles.td, styles.flex1]}>{z.rata}%</Text>
              </View>
            ))}
          </View>
          <Footer statie={statie} from={from} to={to} />
        </Page>
      )}

      {/* ── ITP ── */}
      {itp && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Inspecții ITP</Text>
          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}><Text style={styles.kpiValue}>{itp.kpi.total}</Text><Text style={styles.kpiLabel}>Total ITP</Text></View>
            <View style={styles.kpiBox}><Text style={styles.kpiValue}>{itp.kpi.admise}</Text><Text style={styles.kpiLabel}>Admise</Text></View>
            <View style={styles.kpiBox}><Text style={styles.kpiValue}>{itp.kpi.respinse}</Text><Text style={styles.kpiLabel}>Respinse</Text></View>
            <View style={styles.kpiBox}><Text style={styles.kpiValue}>{itp.kpi.rata_admitere}%</Text><Text style={styles.kpiLabel}>Rată admitere</Text></View>
          </View>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 1.5 }]}>Data</Text>
              <Text style={[styles.th, styles.flex2]}>Vehicul</Text>
              <Text style={[styles.th, styles.flex2]}>Client</Text>
              <Text style={[styles.th, styles.flex1]}>Rezultat</Text>
              <Text style={[styles.th, styles.flex1]}>Inspector</Text>
            </View>
            {itp.lista.slice(0, 40).map((r) => (
              <View key={r.id} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 1.5 }]}>{fmtDate(r.data_inspectie)}</Text>
                <Text style={[styles.td, styles.flex2]}>{r.vehicul}</Text>
                <Text style={[styles.td, styles.flex2]}>{r.client}</Text>
                <Text style={[styles.td, styles.flex1]}>{r.rezultat}</Text>
                <Text style={[styles.td, styles.flex1]}>{r.inspector ?? "—"}</Text>
              </View>
            ))}
          </View>
          <Footer statie={statie} from={from} to={to} />
        </Page>
      )}

      {/* ── ANGAJAȚI ── */}
      {angajati && angajati.angajati.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Angajați</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.flex2]}>Nume</Text>
              <Text style={[styles.th, styles.flex1]}>Funcție</Text>
              <Text style={[styles.th, styles.flex2]}>Email</Text>
              <Text style={[styles.th, styles.flex1]}>Telefon</Text>
            </View>
            {angajati.angajati.map((a) => (
              <View key={a.id} style={styles.tableRow}>
                <Text style={[styles.td, styles.flex2]}>{a.nume}</Text>
                <Text style={[styles.td, styles.flex1]}>{a.functie ?? "—"}</Text>
                <Text style={[styles.td, styles.flex2]}>{a.email ?? "—"}</Text>
                <Text style={[styles.td, styles.flex1]}>{a.telefon ?? "—"}</Text>
              </View>
            ))}
          </View>
          <Footer statie={statie} from={from} to={to} />
        </Page>
      )}
    </Document>
  );
}
