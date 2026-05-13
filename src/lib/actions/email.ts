"use server";

import { sendEmail } from "@/lib/resend";
import { BunVenitEmail } from "@/emails/bun-venit";
import { ResetParolaEmail } from "@/emails/reset-parola";
import { ConfirmareProgramareEmail } from "@/emails/confirmare-programare";
import { ReminderProgramareEmail } from "@/emails/reminder-programare";
import { ProgramareAnulataEmail } from "@/emails/programare-anulata";
import { ReminderItpEmail } from "@/emails/reminder-itp";
import { BookingOnlineEmail } from "@/emails/booking-online";
import { StatieNouaEmail } from "@/emails/statie-noua";
import { RezultatItpEmail } from "@/emails/rezultat-itp";
import * as React from "react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://velos.ro";

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function sendBunVenitEmail(to: string, numeComplet: string) {
  return sendEmail({
    to,
    subject: "Bun venit pe Velos.ro! 👋",
    react: React.createElement(BunVenitEmail, { numeComplet, email: to, appUrl: APP_URL }),
  });
}

export async function sendResetParolaEmail(to: string, numeComplet: string, resetUrl: string) {
  return sendEmail({
    to,
    subject: "Resetare parolă Velos.ro",
    react: React.createElement(ResetParolaEmail, { numeComplet, resetUrl }),
  });
}

// ── Programări ────────────────────────────────────────────────────────────────

export async function sendConfirmareProgramareEmail(
  to: string,
  params: {
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
  }
) {
  return sendEmail({
    to,
    subject: `Programare confirmată: ${params.tipServiciu} — ${params.dataFormatata}`,
    react: React.createElement(ConfirmareProgramareEmail, { ...params, appUrl: APP_URL }),
  });
}

export async function sendReminderProgramareEmail(
  to: string,
  params: {
    numeClient: string;
    nrInmatriculare: string;
    marcaModel: string;
    dataFormatata: string;
    ora: string;
    tipServiciu: string;
    numeStatie: string;
    adresaStatie?: string;
    telefonStatie?: string;
    cand: "maine" | "azi";
  }
) {
  const subject = params.cand === "azi"
    ? `Reminder: programare AZI la ${params.ora} — ${params.numeStatie}`
    : `Reminder: programare mâine la ${params.ora} — ${params.numeStatie}`;

  return sendEmail({
    to,
    subject,
    react: React.createElement(ReminderProgramareEmail, params),
  });
}

export async function sendProgramareAnulataEmail(
  to: string,
  params: {
    numeClient: string;
    nrInmatriculare: string;
    dataFormatata: string;
    ora: string;
    tipServiciu: string;
    numeStatie: string;
    telefonStatie?: string;
    motiv?: string;
  }
) {
  return sendEmail({
    to,
    subject: `Programare anulată — ${params.dataFormatata} la ${params.ora}`,
    react: React.createElement(ProgramareAnulataEmail, params),
  });
}

// ── ITP ───────────────────────────────────────────────────────────────────────

export async function sendReminderItpEmail(
  to: string,
  params: {
    numeClient: string;
    nrInmatriculare: string;
    marcaModel?: string;
    dataExpirare: string;
    zileRamase: number;
    numeStatie: string;
    telefonStatie?: string;
    bookingUrl?: string;
  }
) {
  const expirat = params.zileRamase < 0;
  const subject = expirat
    ? `🚨 ITP expirat — ${params.nrInmatriculare}`
    : params.zileRamase <= 7
    ? `⚠️ ITP expiră în ${params.zileRamase} zile — ${params.nrInmatriculare}`
    : `📋 Reminder ITP — ${params.nrInmatriculare} expiră în ${params.zileRamase} zile`;

  return sendEmail({
    to,
    subject,
    react: React.createElement(ReminderItpEmail, { ...params, appUrl: APP_URL }),
  });
}

export async function sendRezultatItpEmail(
  to: string,
  params: {
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
) {
  const labels = { admis: "Admis ✅", respins: "Respins ❌", readmis: "Readmis 🔄" };
  return sendEmail({
    to,
    subject: `Rezultat ITP ${labels[params.rezultat]} — ${params.nrInmatriculare}`,
    react: React.createElement(RezultatItpEmail, params),
  });
}

// ── Booking online ────────────────────────────────────────────────────────────

export async function sendBookingOnlineEmail(
  to: string,
  params: {
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
) {
  return sendEmail({
    to,
    subject: `Rezervare online confirmată: ${params.tipServiciu} — ${params.dataFormatata}`,
    react: React.createElement(BookingOnlineEmail, params),
  });
}

// ── Stație ────────────────────────────────────────────────────────────────────

export async function sendStatieNouaEmail(
  to: string,
  params: {
    numeProprietar: string;
    numeStatie: string;
    slugStatie: string;
  }
) {
  return sendEmail({
    to,
    subject: `Stație nouă creată: ${params.numeStatie}`,
    react: React.createElement(StatieNouaEmail, { ...params, appUrl: APP_URL }),
  });
}
