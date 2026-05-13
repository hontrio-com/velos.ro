import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageTransition } from "@/components/layout/page-transition";
import { AngajatiClient } from "@/components/angajati/angajati-client";

export const metadata: Metadata = { title: "Angajați" };

export default async function AngajatiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
    <PageTransition>
      <div className="px-4 lg:px-6 py-4">
        <AngajatiClient statieId={statie.id} statieNume={statie.nume} />
      </div>
    </PageTransition>
  );
}
