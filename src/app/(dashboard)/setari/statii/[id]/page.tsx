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
      {/* Breadcrumb + header */}
      <div className="mb-6">
        <Link href="/setari/statii">
          <Button variant="ghost" size="sm" className="-ml-2 text-[#6B7280] hover:text-[#111318] gap-1">
            <ChevronLeft className="h-4 w-4" />
            Stațiile mele
          </Button>
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="1" y="9" width="18" height="10" rx="1.5" fill="#BFDBFE" />
              <rect x="4" y="5" width="12" height="5" rx="1" fill="#93C5FD" />
              <rect x="7" y="12" width="2.5" height="5" rx="0.5" fill="#1877F2" />
              <rect x="10.5" y="12" width="2.5" height="5" rx="0.5" fill="#1877F2" />
              <rect x="8.5" y="2" width="3" height="3" rx="0.5" fill="#1877F2" opacity="0.7" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#111318]">{statie.nume}</h1>
            <p className="text-sm text-[#6B7280]">Configurare stație · /{statie.slug}</p>
          </div>
        </div>
      </div>

      <StatieForm
        statie={statie as StatieExtinsa}
        setari={setari as SetariStatie | null}
      />
    </PageTransition>
  );
}
