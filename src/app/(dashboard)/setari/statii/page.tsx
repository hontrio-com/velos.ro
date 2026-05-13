import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Setari" };
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/layout/page-transition";
import { StatiiList } from "@/components/setari/statii/statii-list";
import type { StatieExtinsa } from "@/types/database.types";

function EmptyState() {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EFF6FF] mb-5">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="2" y="14" width="28" height="16" rx="2" fill="#BFDBFE" />
          <rect x="6" y="8" width="20" height="8" rx="1.5" fill="#93C5FD" />
          <rect x="11" y="18" width="4" height="8" rx="1" fill="#1877F2" />
          <rect x="17" y="18" width="4" height="8" rx="1" fill="#1877F2" />
          <rect x="13" y="4" width="6" height="5" rx="1" fill="#1877F2" opacity="0.7" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-[#111318] mb-2">
        Nu ai nicio stație configurată
      </h2>
      <p className="text-sm text-[#6B7280] mb-6 max-w-xs">
        Adaugă prima ta stație ITP pentru a începe să gestionezi programările și clienții.
      </p>
      <Link href="/setari/statii/noua">
        <Button className="bg-[#1877F2] hover:bg-[#1565D8] text-white gap-2">
          <Plus className="h-4 w-4" />
          Adaugă prima stație
        </Button>
      </Link>
    </div>
  );
}

export default async function StatiiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: statii } = await supabase
    .from("statii")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at");

  const statiiExtinse = (statii ?? []) as StatieExtinsa[];

  return (
    <PageTransition>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Stațiile mele"
          description="Configurează și gestionează stațiile tale ITP"
        />
        <Link href="/setari/statii/noua">
          <Button size="sm" className="bg-[#1877F2] hover:bg-[#1565D8] text-white gap-1.5">
            <Plus className="h-4 w-4" />
            Adaugă stație
          </Button>
        </Link>
      </div>

      {statiiExtinse.length === 0 ? (
        <EmptyState />
      ) : (
        <StatiiList statii={statiiExtinse} />
      )}
    </PageTransition>
  );
}
