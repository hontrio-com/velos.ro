import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/layout/page-transition";
import { StatieForm } from "@/components/setari/statii/statie-form";
import type { StatieExtinsa, SetariStatie } from "@/types/database.types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StatieConfigPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: statie } = await supabase
    .from("statii")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!statie) notFound();

  const { data: setari } = await supabase
    .from("setari_statie")
    .select("*")
    .eq("statie_id", id)
    .maybeSingle();

  return (
    <PageTransition>
      <div className="mb-6">
        <Link href="/setari/statii">
          <Button variant="ghost" size="sm" className="-ml-2">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Înapoi la stații
          </Button>
        </Link>
        <h1 className="text-xl font-semibold mt-2">{statie.nume}</h1>
        <p className="text-sm text-muted-foreground">Configurare stație</p>
      </div>

      <StatieForm
        statie={statie as StatieExtinsa}
        setari={setari as SetariStatie | null}
      />
    </PageTransition>
  );
}
