import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTicheteAction } from "@/lib/actions/ajutor";
import { AjutorClient } from "@/components/ajutor/ajutor-client";

export const metadata: Metadata = { title: "Ajutor & Suport" };

export default async function AjutorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const tichete = await getTicheteAction();

  return (
    <AjutorClient
      ticheteInitiale={tichete}
      userName={profile?.full_name ?? profile?.email ?? ""}
    />
  );
}
