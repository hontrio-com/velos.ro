import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/sms";
import { z } from "zod";

const schema = z.object({
  telefon: z.string().min(1),
  mesaj: z.string().min(1).max(600),
  statieId: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  reminderId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Date invalide" }, { status: 400 });
    }

    const { telefon, mesaj, statieId, clientId, reminderId } = parsed.data;

    // Verificare că stația aparține userului
    const { data: statie } = await supabase
      .from("statii")
      .select("id")
      .eq("id", statieId)
      .eq("owner_id", user.id)
      .single();
    if (!statie) return NextResponse.json({ error: "Acces interzis" }, { status: 403 });

    const result = await sendSms({
      telefon,
      mesaj,
      profileId: user.id,
      statieId,
      clientId,
    });

    if (reminderId) {
      await supabase
        .from("remindere")
        .update({
          status: result.success ? "trimis" : "eroare",
          trimis_la: result.success ? new Date().toISOString() : null,
          eroare: result.error ?? null,
          mesaj,
          trimis: result.success,
        })
        .eq("id", reminderId)
        .eq("statie_id", statieId);
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}
