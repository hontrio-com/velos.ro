import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProgramariClient } from "@/components/programari/programari-client";

export const metadata: Metadata = { title: "Programări" };

export default async function ProgramariPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: statie } = await supabase
    .from("statii")
    .select("id, nume")
    .eq("owner_id", user.id)
    .eq("activa", true)
    .order("created_at")
    .limit(1)
    .single();

  if (!statie) redirect("/setari");

  return (
    <div className="space-y-1">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-[#111318] tracking-tight">
          Programări
        </h1>
        <p className="text-sm text-[#6B7280] mt-0.5">{statie.nume}</p>
      </div>
      <ProgramariClient statieId={statie.id} />
    </div>
  );
}
