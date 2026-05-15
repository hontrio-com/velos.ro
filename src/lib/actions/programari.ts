"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import {
  sendConfirmareProgramareEmail,
  sendProgramareAnulataEmail,
  sendRezultatItpEmail,
} from "@/lib/actions/email";

export async function deleteProgramareAction(
  id: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  // Verifică ownership prin statie
  const { data: p } = await supabase
    .from("programari")
    .select("statie_id")
    .eq("id", id)
    .single();

  if (!p) return { error: "Programarea nu a fost găsită" };

  const { data: statie } = await supabase
    .from("statii")
    .select("id")
    .eq("id", p.statie_id)
    .eq("owner_id", user.id)
    .single();

  if (!statie) return { error: "Acces interzis" };

  const { error } = await supabase
    .from("programari")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/programari");
  revalidatePath("/dashboard");
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

  const { data: statie } = await supabase
    .from("statii")
    .select("id, nume, adresa, telefon, durata_slot_minute")
    .eq("id", input.statieId)
    .eq("owner_id", user.id)
    .single();

  if (!statie) return { error: "Stație negăsită sau acces interzis" };

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

  // Send confirmation email if client has email
  const [{ data: client }, { data: vehicul }] = await Promise.all([
    supabase.from("clienti").select("email, nume, prenume").eq("id", input.clientId).single(),
    supabase.from("vehicule").select("nr_inmatriculare, marca, model").eq("id", input.vehiculId).single(),
  ]);

  if (client?.email) {
    const numeClient = `${client.nume}${client.prenume ? " " + client.prenume : ""}`;
    const marcaModel = [vehicul?.marca, vehicul?.model].filter(Boolean).join(" ") || vehicul?.nr_inmatriculare || "";
    await sendConfirmareProgramareEmail(client.email, {
      numeClient,
      nrInmatriculare: vehicul?.nr_inmatriculare ?? "",
      marcaModel,
      dataFormatata: format(parseISO(input.date), "d MMMM yyyy", { locale: ro }),
      ora: input.slot,
      tipServiciu: input.tipServiciu,
      numeStatie: statie.nume,
      adresaStatie: statie.adresa ?? undefined,
      telefonStatie: statie.telefon ?? undefined,
      pret: input.pret ? String(input.pret) : undefined,
      observatii: input.observatii ?? undefined,
    }).catch(console.error);
  }

  return { success: true, programareId: programare.id };
}

// ── updateProgramareStatusAction ─────────────────────────────────────────────

type ProgramareStatus = "programat" | "in_lucru" | "finalizat" | "anulat" | "neprezent";

export async function updateProgramareStatusAction(
  programareId: string,
  newStatus: ProgramareStatus
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const { data: p } = await supabase
    .from("programari")
    .select(`
      statie_id, data_programare, ora_start, tip_serviciu,
      client:clienti(email, nume, prenume),
      vehicul:vehicule(nr_inmatriculare, marca, model),
      statie:statii(nume, telefon, owner_id)
    `)
    .eq("id", programareId)
    .single();

  if (!p) return { error: "Programarea nu a fost găsită" };

  const statie = Array.isArray(p.statie) ? p.statie[0] : p.statie as { nume: string; telefon: string | null; owner_id: string } | null;
  if (!statie || statie.owner_id !== user.id) return { error: "Acces interzis" };

  const { error } = await supabase
    .from("programari")
    .update({ status: newStatus })
    .eq("id", programareId);

  if (error) return { error: error.message };

  revalidatePath("/programari");
  revalidatePath("/dashboard");

  // Send email on cancellation
  if (newStatus === "anulat") {
    const client = Array.isArray(p.client) ? p.client[0] : p.client as { email: string | null; nume: string; prenume: string | null } | null;
    const vehicul = Array.isArray(p.vehicul) ? p.vehicul[0] : p.vehicul as { nr_inmatriculare: string; marca: string | null; model: string | null } | null;

    if (client?.email) {
      const numeClient = `${client.nume}${client.prenume ? " " + client.prenume : ""}`;
      await sendProgramareAnulataEmail(client.email, {
        numeClient,
        nrInmatriculare: vehicul?.nr_inmatriculare ?? "",
        dataFormatata: format(parseISO(p.data_programare + "T12:00:00"), "d MMMM yyyy", { locale: ro }),
        ora: p.ora_start.slice(0, 5),
        tipServiciu: p.tip_serviciu ?? "ITP",
        numeStatie: statie.nume,
        telefonStatie: statie.telefon ?? undefined,
      }).catch(console.error);
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

  const { data: p } = await supabase
    .from("programari")
    .select(`
      statie_id, data_programare, tip_serviciu,
      client:clienti(email, nume, prenume),
      vehicul:vehicule(nr_inmatriculare, marca, model),
      statie:statii(nume, telefon, owner_id)
    `)
    .eq("id", input.programareId)
    .single();

  if (!p) return { error: "Programarea nu a fost găsită" };

  const statie = Array.isArray(p.statie) ? p.statie[0] : p.statie as { nume: string; telefon: string | null; owner_id: string } | null;
  if (!statie || statie.owner_id !== user.id) return { error: "Acces interzis" };

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

  // Send rezultat email to client
  const client = Array.isArray(p.client) ? p.client[0] : p.client as { email: string | null; nume: string; prenume: string | null } | null;
  const vehicul = Array.isArray(p.vehicul) ? p.vehicul[0] : p.vehicul as { nr_inmatriculare: string; marca: string | null; model: string | null } | null;

  if (client?.email) {
    const numeClient = `${client.nume}${client.prenume ? " " + client.prenume : ""}`;
    const marcaModel = [vehicul?.marca, vehicul?.model].filter(Boolean).join(" ") || vehicul?.nr_inmatriculare || "";
    await sendRezultatItpEmail(client.email, {
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

  return { success: true };
}
