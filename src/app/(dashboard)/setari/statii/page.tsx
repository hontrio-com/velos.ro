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
    <div className="flex flex-col items-center justify-center py-24 text-center">
      {/* SVG ilustrație stație */}
      <svg
        width="120"
        height="100"
        viewBox="0 0 120 100"
        fill="none"
        className="mb-6 opacity-40"
      >
        <rect x="10" y="40" width="100" height="50" rx="4" fill="#94a3b8" />
        <rect x="20" y="20" width="80" height="25" rx="3" fill="#cbd5e1" />
        <rect x="40" y="60" width="16" height="30" rx="2" fill="#64748b" />
        <rect x="64" y="60" width="16" height="30" rx="2" fill="#64748b" />
        <rect x="0" y="88" width="120" height="4" rx="2" fill="#e2e8f0" />
        <rect x="50" y="10" width="20" height="12" rx="2" fill="#1877F2" opacity="0.6" />
      </svg>

      <h2 className="text-xl font-semibold text-foreground mb-2">
        Nu ai nicio stație configurată
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Adaugă prima ta stație ITP pentru a începe să gestionezi programările
        și clienții.
      </p>
      <Link href="/setari/statii/noua">
        <Button size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Adaugă stație
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
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
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
