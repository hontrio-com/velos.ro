"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { parseISO, getDay } from "date-fns";

const ZILE_MAP: Record<number, string> = {
  1: "luni",
  2: "marti",
  3: "miercuri",
  4: "joi",
  5: "vineri",
  6: "sambata",
  0: "duminica",
};

export interface SlotInfo {
  slot: string;
  libere: number;
  total: number;
}

export interface BookingAvailabilityResult {
  slots: SlotInfo[];
  inchis: boolean;
  error?: string;
}

export async function getBookingAvailabilityAction(
  statieId: string,
  date: string
): Promise<BookingAvailabilityResult> {
  try {
    const supabase = await createServiceClient();

    const [{ data: statie }, { data: rawProgramari }] = await Promise.all([
      supabase
        .from("statii")
        .select("program_lucru, durata_slot_minute, nr_linii")
        .eq("id", statieId)
        .eq("activa", true)
        .single(),
      supabase
        .from("programari")
        .select("ora_start")
        .eq("statie_id", statieId)
        .eq("data_programare", date)
        .neq("status", "anulat"),
    ]);

    if (!statie) return { slots: [], inchis: true, error: "Stația nu a fost găsită" };

    const dayOfWeek = getDay(parseISO(date + "T12:00:00"));
    const dayKey = ZILE_MAP[dayOfWeek];
    const program = (
      statie.program_lucru as Record<string, { start: string; end: string } | null>
    )?.[dayKey];

    if (!program) return { slots: [], inchis: true };

    const durata = statie.durata_slot_minute ?? 30;
    const nrLinii = statie.nr_linii ?? 1;

    const [startH, startM] = program.start.split(":").map(Number);
    const [endH, endM] = program.end.split(":").map(Number);

    const allSlots: string[] = [];
    let current = startH * 60 + startM;
    const end = endH * 60 + endM;

    while (current + durata <= end) {
      const h = String(Math.floor(current / 60)).padStart(2, "0");
      const m = String(current % 60).padStart(2, "0");
      allSlots.push(`${h}:${m}`);
      current += durata;
    }

    const counts: Record<string, number> = {};
    for (const p of rawProgramari ?? []) {
      const key = p.ora_start.slice(0, 5);
      counts[key] = (counts[key] ?? 0) + 1;
    }

    const slots: SlotInfo[] = allSlots.map((slot) => ({
      slot,
      libere: Math.max(0, nrLinii - (counts[slot] ?? 0)),
      total: nrLinii,
    }));

    return { slots, inchis: false };
  } catch {
    return { slots: [], inchis: false, error: "Eroare la încărcarea sloturilor" };
  }
}

export interface CreateBookingInput {
  statieId: string;
  date: string;
  slot: string;
  nume: string;
  prenume: string;
  telefon: string;
  email?: string;
  nrInmatriculare: string;
  marcaModel?: string;
  observatii?: string;
}

export interface CreateBookingResult {
  success: boolean;
  error?: string;
  programareId?: string;
}

export async function createBookingAction(
  input: CreateBookingInput
): Promise<CreateBookingResult> {
  try {
    const supabase = await createServiceClient();

    // Fetch station to get durata_slot_minute + verify it exists
    const { data: statie } = await supabase
      .from("statii")
      .select("id, durata_slot_minute, owner_id")
      .eq("id", input.statieId)
      .eq("activa", true)
      .single();

    if (!statie) return { success: false, error: "Stația nu a fost găsită" };

    // Verify slot is still available
    const availability = await getBookingAvailabilityAction(input.statieId, input.date);
    const slotInfo = availability.slots.find((s) => s.slot === input.slot);
    if (!slotInfo || slotInfo.libere === 0) {
      return { success: false, error: "Slotul selectat nu mai este disponibil" };
    }

    // Find or create client by phone under station owner
    const normalizedPhone = input.telefon.replace(/\s/g, "");
    let clientId: string;

    const { data: existingClient } = await supabase
      .from("clienti")
      .select("id")
      .eq("statie_id", input.statieId)
      .eq("telefon", normalizedPhone)
      .maybeSingle();

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const { data: newClient, error: clientErr } = await supabase
        .from("clienti")
        .insert({
          statie_id: input.statieId,
          nume: input.nume,
          prenume: input.prenume,
          telefon: normalizedPhone,
          email: input.email || null,
          sms_optin: true,
        })
        .select("id")
        .single();

      if (clientErr || !newClient) {
        return { success: false, error: "Eroare la crearea profilului client" };
      }
      clientId = newClient.id;
    }

    // Find or create vehicle by plate under this client
    const normalizedPlate = input.nrInmatriculare.toUpperCase().replace(/\s/g, "");
    let vehiculId: string;

    const { data: existingVehicul } = await supabase
      .from("vehicule")
      .select("id")
      .eq("client_id", clientId)
      .eq("nr_inmatriculare", normalizedPlate)
      .maybeSingle();

    if (existingVehicul) {
      vehiculId = existingVehicul.id;
    } else {
      const { data: newVehicul, error: vehiculErr } = await supabase
        .from("vehicule")
        .insert({
          statie_id: input.statieId,
          client_id: clientId,
          nr_inmatriculare: normalizedPlate,
          marca: input.marcaModel || null,
        })
        .select("id")
        .single();

      if (vehiculErr || !newVehicul) {
        return { success: false, error: "Eroare la crearea vehiculului" };
      }
      vehiculId = newVehicul.id;
    }

    // Compute end time
    const durata = statie.durata_slot_minute ?? 30;
    const [h, m] = input.slot.split(":").map(Number);
    const endMin = h * 60 + m + durata;
    const oraEnd = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;

    // Create programare
    const { data: programare, error: progErr } = await supabase
      .from("programari")
      .insert({
        statie_id: input.statieId,
        client_id: clientId,
        vehicul_id: vehiculId,
        data_programare: input.date,
        ora_start: input.slot + ":00",
        ora_sfarsit: oraEnd + ":00",
        tip_serviciu: "ITP",
        observatii: input.observatii || null,
        status: "programat",
      })
      .select("id")
      .single();

    if (progErr || !programare) {
      return { success: false, error: "Eroare la crearea programării" };
    }

    return { success: true, programareId: programare.id };
  } catch (err) {
    console.error("createBookingAction error:", err);
    return { success: false, error: "Eroare neașteptată. Încearcă din nou." };
  }
}
