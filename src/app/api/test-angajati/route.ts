import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) return NextResponse.json({ step: "auth", error: authError.message }, { status: 500 });
    if (!user) return NextResponse.json({ step: "auth", error: "not authenticated" }, { status: 401 });

    const { data: statie, error: statieError } = await supabase
      .from("statii")
      .select("id, nume")
      .eq("owner_id", user.id)
      .eq("activa", true)
      .order("created_at")
      .limit(1)
      .single();

    if (statieError) return NextResponse.json({ step: "statie", error: statieError.message }, { status: 500 });
    if (!statie) return NextResponse.json({ step: "statie", error: "no statie found" }, { status: 404 });

    const { data: testInsert, error: insertError } = await supabase
      .from("angajati")
      .insert({ statie_id: statie.id, nume: "__TEST_DELETE_ME__", activ: false })
      .select("id")
      .single();

    if (insertError) return NextResponse.json({ step: "insert", error: insertError.message }, { status: 500 });

    await supabase.from("angajati").delete().eq("id", testInsert.id);

    return NextResponse.json({ success: true, userId: user.id, statieId: statie.id });
  } catch (err) {
    return NextResponse.json({ step: "catch", error: String(err) }, { status: 500 });
  }
}
