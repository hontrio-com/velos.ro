import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/layout/page-transition";
import { StatieWizard } from "@/components/setari/statii/statie-wizard";

export default async function StatieNouaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <PageTransition>
      <div className="mb-6">
        <Link href="/setari/statii">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Înapoi la stații
          </Button>
        </Link>
      </div>

      <StatieWizard />
    </PageTransition>
  );
}
