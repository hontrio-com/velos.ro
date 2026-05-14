"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { subDays } from "date-fns";

export interface ScanVehiculInput {
  nrInmatriculare: string;
  marca?: string;
  model?: string;
  expirareItp?: string; // YYYY-MM-DD
  statieId: string;
}

export async function scanVehiculAction(input: ScanVehiculInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Neautentificat" };

  const { data: statie } = await supabase
    .from("statii")
    .select("id, owner_id")
    .eq("id", input.statieId)
    .single();

  if (!statie || statie.owner_id !== user.id)
    return { success: false as const, error: "Stație negăsită" };

  const { data: vehicul, error: vErr } = await supabase
    .from("vehicule")
    .insert({
      nr_inmatriculare: input.nrInmatriculare.trim().toUpperCase(),
      marca: input.marca || null,
      model: input.model || null,
      statie_id: input.statieId,
      expirare_itp: input.expirareItp || null,
    } as never)
    .select("id")
    .single();

  if (vErr || !vehicul)
    return { success: false as const, error: vErr?.message ?? "Eroare la creare vehicul" };

  // Create ITP reminders if expiry date is provided
  if (input.expirareItp) {
    const expiry = new Date(input.expirareItp);
    const now = new Date();

    const configs = [
      { tip: "30_zile" as const, days: 30, label: "30 de zile" },
      { tip: "7_zile" as const,  days: 7,  label: "7 zile" },
      { tip: "1_zi" as const,    days: 1,  label: "mâine" },
    ];

    const toInsert = configs
      .map(({ tip, days, label }) => {
        const dataTrimitere = subDays(expiry, days);
        // Don't create past reminders
        if (dataTrimitere <= now) return null;
        return {
          statie_id: input.statieId,
          vehicul_id: vehicul.id,
          tip,
          canal: "sms" as const,
          data_trimitere: dataTrimitere.toISOString().split("T")[0],
          programat_la: now.toISOString(),
          status: "pending" as const,
          mesaj: `ITP vehicul ${input.nrInmatriculare.toUpperCase()} expiră în ${label}.`,
          trimis: false,
        };
      })
      .filter(Boolean);

    if (toInsert.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("remindere") as any).insert(toInsert);
    }
  }

  revalidatePath("/vehicule");
  revalidatePath("/remindere");
  return { success: true as const, vehiculId: vehicul.id };
}
