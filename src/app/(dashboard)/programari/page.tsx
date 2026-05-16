import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getStatieForUser } from "@/lib/get-user-statie";
import { redirect } from "next/navigation";
import { ProgramariClient } from "@/components/programari/programari-client";

export const metadata: Metadata = { title: "Programări" };

export default async function ProgramariPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const statie = await getStatieForUser();

  if (!statie) redirect("/dashboard");

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
