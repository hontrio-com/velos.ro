import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Globe, Plus, Eye, EyeOff, ExternalLink, Settings2 } from "lucide-react";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "ITP Smart Page" };

export default async function SmartPageDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: statii } = await supabase
    .from("statii")
    .select("id, nume, slug, activa, localitate, judet")
    .eq("owner_id", user.id)
    .order("created_at");

  const statiiList = statii ?? [];

  // Fetch smart_page status for all stations
  const { data: smartPages } = await (supabase as any)
    .from("smart_page")
    .select("statie_id, activa")
    .in("statie_id", statiiList.map((s) => s.id));

  const smartMap = new Map<string, boolean>(
    (smartPages ?? []).map((sp: { statie_id: string; activa: boolean }) => [sp.statie_id, sp.activa])
  );

  return (
    <PageTransition>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="ITP Smart Page"
          description="Mini-site-ul public al stației tale, optimizat pentru SEO local"
        />
      </div>

      {statiiList.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] mx-auto mb-4">
            <Globe className="h-7 w-7 text-[#1877F2]" />
          </div>
          <h2 className="text-base font-semibold text-[#111318] mb-2">
            Nicio stație configurată
          </h2>
          <p className="text-sm text-[#6B7280] mb-5 max-w-xs mx-auto">
            Adaugă mai întâi o stație ITP pentru a-i putea crea Smart Page-ul.
          </p>
          <Link href="/setari/statii/noua">
            <Button className="bg-[#1877F2] hover:bg-[#1565D8] text-white gap-2">
              <Plus className="h-4 w-4" />Adaugă stație
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Info banner */}
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 flex items-start gap-3">
            <Globe className="h-5 w-5 text-[#1877F2] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#1877F2]">Ce este ITP Smart Page?</p>
              <p className="text-sm text-[#374151] mt-0.5">
                Un mini-site optimizat SEO pentru fiecare stație, accesibil la <strong>velos.ro/slug-statie</strong>.
                Include programare online sincronizată, servicii, hartă, chatbot și buton WhatsApp.
              </p>
            </div>
          </div>

          {/* Station cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {statiiList.map((statie) => {
              const smartActiva = smartMap.get(statie.id) ?? false;
              const location = [statie.localitate, statie.judet].filter(Boolean).join(", ");

              return (
                <div key={statie.id} className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  {smartActiva && (
                    <div className="h-0.5 bg-gradient-to-r from-[#1877F2] to-[#60A5FA]" />
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-[#111318] truncate">{statie.nume}</h3>
                          {smartActiva ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] shrink-0">
                              <Eye className="h-3 w-3" />Live
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280] shrink-0">
                              <EyeOff className="h-3 w-3" />Inactivă
                            </span>
                          )}
                        </div>
                        {location && <p className="text-xs text-[#6B7280]">{location}</p>}
                        <p className="text-xs text-[#9CA3AF] font-mono mt-0.5">velos.ro/{statie.slug}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/smart-page/${statie.id}`} className="flex-1">
                        <Button size="sm" className="w-full bg-[#1877F2] hover:bg-[#1565D8] text-white gap-1.5">
                          <Settings2 className="h-3.5 w-3.5" />
                          {smartMap.has(statie.id) ? "Editează" : "Configurează"}
                        </Button>
                      </Link>
                      {smartActiva && (
                        <a href={`/${statie.slug}`} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline" className="gap-1.5">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Vezi
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageTransition>
  );
}
