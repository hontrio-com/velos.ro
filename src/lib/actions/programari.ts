"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import {
  sendConfirmareProgramareEmail,
  sendProgramareAnulataEmail,
  sendRezultatItpEmail,
  sendAngajatActivitateEmail,
} from "@/lib/actions/email";
import { getOwnerContext } from "@/lib/angajat-context";

// ── Helper: log activitate angajat + email proprietar ────────────────────────

async function logAngajatActivitate(params: {
  angajatId: string;
  angajatNume: string;
  angajatFunctie: string | null;
  statieId: string;
  ownerId: string;
  actiune: string;
  actiuneLabel: string;
  detalii: { label: string; value: string }[];
  numeStatie: string;
  ownerEmail: string;
}) {
  const serviceClient = createServiceClient();

  // Insert audit log (fire-and-forget, don't block)
  void (serviceClient as any)
    .from("angajat_activitati")
    .insert({
      angajat_id: params.angajatId,
      statie_id: params.statieId,
      owner_profile_id: params.ownerId,
      actiune: params.actiune,
      detalii: Object.fromEntries(params.detalii.map((d) => [d.label, d.value])),
    });

  // Send email to owner
  sendAngajatActivitateEmail(params.ownerEmail, {
    numeAngajat: params.angajatNume,
    functieAngajat: params.angajatFunctie ?? undefined,
    actiune: params.actiuneLabel,
    detalii: params.detalii,
    numeStatie: params.numeStatie,
  }).catch(console.error);
}

// ── deleteProgramareAction ─────────────────────────────────────────────────────

export async function deleteProgramareAction(
  id: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const ctx = await getOwnerContext(supabase as any, user.id);
  if (!ctx) return { error: "Neautentificat" };

  // Fetch programare + statie for ownership check and email
  const { data: p } = await supabase
    .from("programari")
    .select(`
      statie_id, data_programare, ora_start, tip_serviciu,
      client:clienti(email, nume, prenume),
      vehicul:vehicule(nr_inmatriculare, marca, model),
      statie:statii(id, nume, owner_id)
    `)
    .eq("id", id)
    .single();

  if (!p) return { error: "Programarea nu a fost găsită" };

  const statie = Array.isArray(p.statie) ? p.statie[0] : p.statie as { id: string; nume: string; owner_id: string } | null;
  if (!statie || statie.owner_id !== ctx.ownerId) return { error: "Acces interzis" };

  const { error } = await supabase.from("programari").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/programari");
  revalidatePath("/dashboard");

  // If angajat: log activity + notify owner
  if (ctx.role === "angajat" && ctx.angajatId) {
    const client = Array.isArray(p.client) ? p.client[0] : p.client as { email: string | null; nume: string; prenume: string | null } | null;
    const vehicul = Array.isArray(p.vehicul) ? p.vehicul[0] : p.vehicul as { nr_inmatriculare: string; marca: string | null; model: string | null } | null;

    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", ctx.ownerId)
      .single();

    if (ownerProfile?.email) {
      const numeClient = `${client?.nume ?? ""} ${client?.prenume ?? ""}`.trim();
      const marcaModel = [vehicul?.marca, vehicul?.model].filter(Boolean).join(" ") || vehicul?.nr_inmatriculare || "";
      const dataFormatata = format(parseISO(p.data_programare + "T12:00:00"), "d MMMM yyyy", { locale: ro });

      await logAngajatActivitate({
        angajatId: ctx.angajatId,
        angajatNume: ctx.angajatNume!,
        angajatFunctie: ctx.angajatFunctie,
        statieId: statie.id,
        ownerId: ctx.ownerId,
        actiune: "sters_programare",
        actiuneLabel: "A șters o programare",
        detalii: [
          { label: "Client", value: numeClient || "—" },
          { label: "Vehicul", value: vehicul?.nr_inmatriculare ?? "—" },
          { label: "Model", value: marcaModel || "—" },
          { label: "Data", value: `${dataFormatata}, ora ${p.ora_start.slice(0, 5)}` },
          { label: "Serviciu", value: p.tip_serviciu ?? "ITP" },
        ],
        numeStatie: statie.nume,
        ownerEmail: ownerProfile.email,
      });
    }
  }

  return { success: true };
}

// ── createProgramareStaffAction ──────────────────────────────────────────────

export async function createProgramareStaffAction(input: {
  statieId: string;
  clientId: string;
  vehiculId: string;
  date: string;
  slot: string;
  tipServiciu: string;
  pret: number | null;
  observatii: string | null;
  angajatId: string | null;
}): Promise<{ success: true; programareId: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const ctx = await getOwnerContext(supabase as any, user.id);
  if (!ctx) return { error: "Neautentificat" };

  const [{ data: statie }, { data: ownerProfile }] = await Promise.all([
    supabase
      .from("statii")
      .select("id, nume, adresa, telefon, durata_slot_minute")
      .eq("id", input.statieId)
      .eq("owner_id", ctx.ownerId)
      .single(),
    supabase
      .from("profiles")
      .select("email")
      .eq("id", ctx.ownerId)
      .single(),
  ]);

  if (!statie) return { error: "Stație negăsită sau acces interzis" };

  const ownerEmail = ownerProfile?.email ?? user.email;

  const durata = statie.durata_slot_minute ?? 30;
  const [h, m] = input.slot.split(":").map(Number);
  const endMin = h * 60 + m + durata;
  const oraEnd = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;

  const { data: programare, error } = await supabase
    .from("programari")
    .insert({
      statie_id: input.statieId,
      client_id: input.clientId,
      vehicul_id: input.vehiculId,
      data_programare: input.date,
      ora_start: input.slot + ":00",
      ora_sfarsit: oraEnd + ":00",
      tip_serviciu: input.tipServiciu,
      pret: input.pret,
      observatii: input.observatii,
      angajat_id: input.angajatId,
    })
    .select("id")
    .single();

  if (error || !programare) return { error: error?.message ?? "Eroare la creare" };

  revalidatePath("/programari");
  revalidatePath("/dashboard");

  // Fetch client + vehicul for emails
  const [{ data: client }, { data: vehicul }] = await Promise.all([
    supabase.from("clienti").select("email, nume, prenume").eq("id", input.clientId).single(),
    supabase.from("vehicule").select("nr_inmatriculare, marca, model").eq("id", input.vehiculId).single(),
  ]);

  const numeClient = `${client?.nume ?? ""}${client?.prenume ? " " + client.prenume : ""}`.trim() || "Client";
  const marcaModel = [vehicul?.marca, vehicul?.model].filter(Boolean).join(" ") || vehicul?.nr_inmatriculare || "";
  const dataFormatata = format(parseISO(input.date), "d MMMM yyyy", { locale: ro });

  const emailParams = {
    numeClient,
    nrInmatriculare: vehicul?.nr_inmatriculare ?? "",
    marcaModel,
    dataFormatata,
    ora: input.slot,
    tipServiciu: input.tipServiciu,
    numeStatie: statie.nume,
    adresaStatie: statie.adresa ?? undefined,
    telefonStatie: statie.telefon ?? undefined,
    pret: input.pret ? String(input.pret) : undefined,
    observatii: input.observatii ?? undefined,
  };

  // Always send confirmation to owner + client
  const recipients = [ownerEmail, client?.email].filter((e): e is string => !!e && e.length > 0);
  const uniqueRecipients = [...new Set(recipients)];

  for (const email of uniqueRecipients) {
    sendConfirmareProgramareEmail(email, emailParams).catch(console.error);
  }

  // If angajat: also log the activity
  if (ctx.role === "angajat" && ctx.angajatId && ownerEmail) {
    logAngajatActivitate({
      angajatId: ctx.angajatId,
      angajatNume: ctx.angajatNume!,
      angajatFunctie: ctx.angajatFunctie,
      statieId: input.statieId,
      ownerId: ctx.ownerId,
      actiune: "creat_programare",
      actiuneLabel: "A creat o programare nouă",
      detalii: [
        { label: "Client", value: numeClient },
        { label: "Vehicul", value: vehicul?.nr_inmatriculare ?? "—" },
        { label: "Model", value: marcaModel || "—" },
        { label: "Data", value: `${dataFormatata}, ora ${input.slot}` },
        { label: "Serviciu", value: input.tipServiciu },
        ...(input.pret ? [{ label: "Preț", value: `${input.pret} RON` }] : []),
      ],
      numeStatie: statie.nume,
      ownerEmail,
    }).catch(console.error);
  }

  return { success: true, programareId: programare.id };
}

// ── updateProgramareStatusAction ─────────────────────────────────────────────

type ProgramareStatus = "programat" | "in_lucru" | "finalizat" | "anulat" | "neprezent";

const STATUS_LABELS: Record<ProgramareStatus, string> = {
  programat: "Programat",
  in_lucru: "În lucru",
  finalizat: "Finalizat",
  anulat: "Anulat",
  neprezent: "Neprezent",
};

export async function updateProgramareStatusAction(
  programareId: string,
  newStatus: ProgramareStatus
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const ctx = await getOwnerContext(supabase as any, user.id);
  if (!ctx) return { error: "Neautentificat" };

  const { data: p } = await supabase
    .from("programari")
    .select(`
      statie_id, data_programare, ora_start, tip_serviciu,
      client:clienti(email, nume, prenume),
      vehicul:vehicule(nr_inmatriculare, marca, model),
      statie:statii(id, nume, telefon, owner_id)
    `)
    .eq("id", programareId)
    .single();

  if (!p) return { error: "Programarea nu a fost găsită" };

  const statie = Array.isArray(p.statie) ? p.statie[0] : p.statie as { id: string; nume: string; telefon: string | null; owner_id: string } | null;
  if (!statie || statie.owner_id !== ctx.ownerId) return { error: "Acces interzis" };

  const { error } = await supabase
    .from("programari")
    .update({ status: newStatus })
    .eq("id", programareId);

  if (error) return { error: error.message };

  revalidatePath("/programari");
  revalidatePath("/dashboard");

  const client = Array.isArray(p.client) ? p.client[0] : p.client as { email: string | null; nume: string; prenume: string | null } | null;
  const vehicul = Array.isArray(p.vehicul) ? p.vehicul[0] : p.vehicul as { nr_inmatriculare: string; marca: string | null; model: string | null } | null;
  const dataFormatata = format(parseISO(p.data_programare + "T12:00:00"), "d MMMM yyyy", { locale: ro });

  // Send anulare email to client
  if (newStatus === "anulat" && client?.email) {
    const numeClient = `${client.nume}${client.prenume ? " " + client.prenume : ""}`;
    sendProgramareAnulataEmail(client.email, {
      numeClient,
      nrInmatriculare: vehicul?.nr_inmatriculare ?? "",
      dataFormatata,
      ora: p.ora_start.slice(0, 5),
      tipServiciu: p.tip_serviciu ?? "ITP",
      numeStatie: statie.nume,
      telefonStatie: statie.telefon ?? undefined,
    }).catch(console.error);
  }

  // If angajat: log activity + notify owner
  if (ctx.role === "angajat" && ctx.angajatId) {
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", ctx.ownerId)
      .single();

    if (ownerProfile?.email) {
      const numeClient = `${client?.nume ?? ""} ${client?.prenume ?? ""}`.trim();
      await logAngajatActivitate({
        angajatId: ctx.angajatId,
        angajatNume: ctx.angajatNume!,
        angajatFunctie: ctx.angajatFunctie,
        statieId: statie.id,
        ownerId: ctx.ownerId,
        actiune: "actualizat_status",
        actiuneLabel: `A actualizat statusul → ${STATUS_LABELS[newStatus]}`,
        detalii: [
          { label: "Client", value: numeClient || "—" },
          { label: "Vehicul", value: vehicul?.nr_inmatriculare ?? "—" },
          { label: "Data", value: `${dataFormatata}, ora ${p.ora_start.slice(0, 5)}` },
          { label: "Status nou", value: STATUS_LABELS[newStatus] },
        ],
        numeStatie: statie.nume,
        ownerEmail: ownerProfile.email,
      });
    }
  }

  return { success: true };
}

// ── saveRezultatItpAction ─────────────────────────────────────────────────────

export async function saveRezultatItpAction(input: {
  programareId: string;
  vehiculId: string;
  rezultat: "admis" | "respins" | "readmis";
  dataInspectie: string;
  expirareNoua: string | null;
  inspector: string | null;
  observatiiTehnice: string | null;
}): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const ctx = await getOwnerContext(supabase as any, user.id);
  if (!ctx) return { error: "Neautentificat" };

  const { data: p } = await supabase
    .from("programari")
    .select(`
      statie_id, data_programare, tip_serviciu,
      client:clienti(email, nume, prenume),
      vehicul:vehicule(nr_inmatriculare, marca, model),
      statie:statii(id, nume, telefon, owner_id)
    `)
    .eq("id", input.programareId)
    .single();

  if (!p) return { error: "Programarea nu a fost găsită" };

  const statie = Array.isArray(p.statie) ? p.statie[0] : p.statie as { id: string; nume: string; telefon: string | null; owner_id: string } | null;
  if (!statie || statie.owner_id !== ctx.ownerId) return { error: "Acces interzis" };

  const { error } = await supabase
    .from("rezultate_itp")
    .upsert(
      {
        programare_id: input.programareId,
        rezultat: input.rezultat,
        data_inspectie: input.dataInspectie,
        expirare_noua: input.expirareNoua || null,
        inspector: input.inspector || null,
        observatii_tehnice: input.observatiiTehnice || null,
      },
      { onConflict: "programare_id" }
    );

  if (error) return { error: error.message };

  if ((input.rezultat === "admis" || input.rezultat === "readmis") && input.expirareNoua) {
    await supabase
      .from("vehicule")
      .update({ expirare_itp: input.expirareNoua })
      .eq("id", input.vehiculId);
  }

  revalidatePath("/programari");
  revalidatePath("/vehicule");

  const client = Array.isArray(p.client) ? p.client[0] : p.client as { email: string | null; nume: string; prenume: string | null } | null;
  const vehicul = Array.isArray(p.vehicul) ? p.vehicul[0] : p.vehicul as { nr_inmatriculare: string; marca: string | null; model: string | null } | null;

  // Send result email to client
  if (client?.email) {
    const numeClient = `${client.nume}${client.prenume ? " " + client.prenume : ""}`;
    const marcaModel = [vehicul?.marca, vehicul?.model].filter(Boolean).join(" ") || vehicul?.nr_inmatriculare || "";
    sendRezultatItpEmail(client.email, {
      numeClient,
      nrInmatriculare: vehicul?.nr_inmatriculare ?? "",
      marcaModel,
      rezultat: input.rezultat,
      dataInspectie: format(parseISO(input.dataInspectie + "T12:00:00"), "d MMMM yyyy", { locale: ro }),
      expirareNoua: input.expirareNoua
        ? format(parseISO(input.expirareNoua + "T12:00:00"), "d MMMM yyyy", { locale: ro })
        : undefined,
      inspector: input.inspector || undefined,
      numeStatie: statie.nume,
      telefonStatie: statie.telefon ?? undefined,
      observatiiTehnice: input.observatiiTehnice || undefined,
    }).catch(console.error);
  }

  // If angajat: log activity + notify owner
  if (ctx.role === "angajat" && ctx.angajatId) {
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", ctx.ownerId)
      .single();

    if (ownerProfile?.email) {
      const REZULTAT_LABELS = { admis: "Admis ✓", respins: "Respins ✗", readmis: "Readmis" };
      const numeClient = `${client?.nume ?? ""} ${client?.prenume ?? ""}`.trim();
      await logAngajatActivitate({
        angajatId: ctx.angajatId,
        angajatNume: ctx.angajatNume!,
        angajatFunctie: ctx.angajatFunctie,
        statieId: statie.id,
        ownerId: ctx.ownerId,
        actiune: "salvat_rezultat_itp",
        actiuneLabel: `A salvat rezultatul ITP — ${REZULTAT_LABELS[input.rezultat]}`,
        detalii: [
          { label: "Client", value: numeClient || "—" },
          { label: "Vehicul", value: vehicul?.nr_inmatriculare ?? "—" },
          { label: "Rezultat", value: REZULTAT_LABELS[input.rezultat] },
          { label: "Data inspecție", value: format(parseISO(input.dataInspectie + "T12:00:00"), "d MMMM yyyy", { locale: ro }) },
          ...(input.expirareNoua ? [{ label: "Expiră la", value: format(parseISO(input.expirareNoua + "T12:00:00"), "d MMMM yyyy", { locale: ro }) }] : []),
          ...(input.inspector ? [{ label: "Inspector", value: input.inspector }] : []),
        ],
        numeStatie: statie.nume,
        ownerEmail: ownerProfile.email,
      });
    }
  }

  return { success: true };
}
