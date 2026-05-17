import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendSms, getProfileIdForStatie, buildTemplateVars, interpolateTemplate } from "@/lib/sms";
import { DEFAULT_TEMPLATES } from "@/lib/remindere-generator";
import type { TipReminder } from "@/lib/remindere-generator";

export async function GET(request: Request) {
  // Support both Vercel native cron (Authorization: Bearer) and manual trigger (x-cron-secret)
  const bearerToken = request.headers.get("authorization")?.replace("Bearer ", "");
  const customHeader = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || (bearerToken !== expectedSecret && customHeader !== expectedSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data: remindere, error } = await supabase
    .from("remindere")
    .select(`
      id, tip, mesaj, statie_id,
      client:clienti(id, nume, telefon, sms_optin),
      vehicul:vehicule(nr_inmatriculare, expirare_itp),
      programare:programari(data_programare, ora_start),
      statie:statii(id, nume, telefon, slug, owner_id)
    `)
    .eq("status", "pending")
    .lte("programat_la", now)
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let trimise = 0;
  let erori = 0;

  for (const r of remindere ?? []) {
    const client = Array.isArray(r.client) ? r.client[0] : r.client;
    const vehicul = Array.isArray(r.vehicul) ? r.vehicul[0] : r.vehicul;
    const programare = Array.isArray(r.programare) ? r.programare[0] : r.programare;
    const statie = Array.isArray(r.statie) ? r.statie[0] : r.statie;

    if (!client?.sms_optin || !client?.telefon || !statie) {
      await supabase
        .from("remindere")
        .update({ status: "eroare", eroare: "Client fara telefon sau SMS dezactivat" })
        .eq("id", r.id);
      erori++;
      continue;
    }

    const profileId = (statie as Record<string, unknown>).owner_id as string;
    if (!profileId) {
      erori++;
      continue;
    }

    const { data: tmpl } = await supabase
      .from("sms_templates")
      .select("mesaj")
      .or(`statie_id.eq.${r.statie_id},statie_id.is.null`)
      .eq("tip", r.tip as TipReminder)
      .order("statie_id", { nullsFirst: false })
      .limit(1)
      .single();

    const templateText = tmpl?.mesaj ?? DEFAULT_TEMPLATES[r.tip as TipReminder] ?? r.mesaj ?? "";

    const vars = buildTemplateVars({
      clientNume: client.nume,
      nrInmatriculare: vehicul?.nr_inmatriculare ?? "",
      expirareItp: vehicul?.expirare_itp,
      dataProgramare: programare?.data_programare,
      oraProgramare: programare?.ora_start,
      statieNume: statie.nume,
      statieTelefon: statie.telefon,
      statieSlug: (statie as Record<string, unknown>).slug as string | null,
    });

    const mesajFinal = interpolateTemplate(templateText, vars);

    const result = await sendSms({
      telefon: client.telefon,
      mesaj: mesajFinal,
      profileId,
      statieId: r.statie_id,
      clientId: client.id,
    });

    if (result.success) {
      await supabase
        .from("remindere")
        .update({ status: "trimis", trimis: true, trimis_la: new Date().toISOString(), mesaj: mesajFinal, eroare: null })
        .eq("id", r.id);
      trimise++;
    } else {
      await supabase
        .from("remindere")
        .update({ status: "eroare", eroare: result.error ?? "Eroare necunoscuta" })
        .eq("id", r.id);
      if (result.quotaDepasita) {
        console.warn(`[CRON] Quota depășită pentru profile ${profileId}`);
      }
      erori++;
    }
  }

  return NextResponse.json({ trimise, erori, total: (remindere ?? []).length });
}
