import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: statii }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("statii")
      .select("id, nume, activa")
      .eq("owner_id", user.id)
      .order("created_at"),
  ]);

  return (
    <DashboardShell
      userEmail={user.email}
      userName={profile?.full_name ?? undefined}
      statii={statii ?? []}
    >
      {children}
    </DashboardShell>
  );
}
