import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/layout/page-transition";
import { SmartPageEditor } from "@/components/smart-page/smart-page-editor";
import { getSmartPageAction } from "@/lib/actions/smart-page";

interface Props {
  params: Promise<{ statieId: string }>;
}

export default async function SmartPageEditPage({ params }: Props) {
  const { statieId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: statie } = await supabase
    .from("statii")
    .select("id, nume, slug, localitate, judet")
    .eq("id", statieId)
    .eq("owner_id", user.id)
    .single();

  if (!statie) notFound();

  const smartPage = await getSmartPageAction(statieId);

  return (
    <PageTransition>
      {/* Header */}
      <div className="mb-6">
        <Link href="/smart-page">
          <Button variant="ghost" size="sm" className="-ml-2 text-[#6B7280] hover:text-[#111318] gap-1">
            <ChevronLeft className="h-4 w-4" />
            Smart Page
          </Button>
        </Link>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" fill="#BFDBFE" />
                <path d="M6 10h8M10 6v8" stroke="#1877F2" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="10" cy="10" r="2.5" fill="#1877F2" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#111318]">{statie.nume}</h1>
              <p className="text-sm text-[#6B7280]">
                Smart Page · velos.ro/<span className="font-mono">{statie.slug}</span>
              </p>
            </div>
          </div>
          {smartPage?.activa && (
            <a href={`/${statie.slug}`} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                Deschide pagina
              </Button>
            </a>
          )}
        </div>
      </div>

      <SmartPageEditor
        statieId={statieId}
        statieSlug={statie.slug}
        statieNume={statie.nume}
        initialData={smartPage}
      />
    </PageTransition>
  );
}
