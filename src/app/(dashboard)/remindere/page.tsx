import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/layout/page-transition";
import { RemindereClient } from "@/components/remindere/remindere-client";

export const metadata: Metadata = { title: "Remindere" };

export default async function ReminderePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: statie } = await supabase
    .from("statii")
    .select("id")
    .eq("owner_id", user.id)
    .eq("activa", true)
    .order("created_at")
    .limit(1)
    .single();

  if (!statie) redirect("/setari");

  return (
    <PageTransition>
      <PageHeader
        title="Remindere"
        description="Notificari automate pentru expirarea ITP catre clientii tai"
      />
      <RemindereClient statieId={statie.id} />
    </PageTransition>
  );
}
