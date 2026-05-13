import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/layout/page-transition";
import { ProfilForm } from "@/components/setari/profil-form";

export const metadata: Metadata = { title: "Profilul meu" };

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, email, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <PageTransition>
      <PageHeader
        title="Profilul meu"
        description="Informațiile tale de cont și preferințe"
      />
      <ProfilForm
        initialData={{
          full_name: profile?.full_name ?? "",
          phone: profile?.phone ?? "",
          email: profile?.email ?? user.email ?? "",
        }}
      />
    </PageTransition>
  );
}
