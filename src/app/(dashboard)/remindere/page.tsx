import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getStatieForUser } from "@/lib/get-user-statie";
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

  const statie = await getStatieForUser();

  if (!statie) redirect("/dashboard");

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
