import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { ProspectareClient } from "@/components/admin/prospectare-client";
import type { StatusCrm } from "@/lib/actions/prospectare";

export const metadata: Metadata = { title: "Admin - Prospectare" };

const STATUS_LIST: StatusCrm[] = [
  "necontactat", "contactat", "interesat", "client",
  "refuzat", "foloseste_alt_soft", "are_soft_custom",
];

async function fetchAllPages(supabase: any, table: string, select: string, filters?: (q: any) => any) {
  const PAGE = 1000;
  const all: any[] = [];
  let from = 0;
  while (true) {
    let q = supabase.from(table).select(select).range(from, from + PAGE - 1);
    if (filters) q = filters(q);
    const { data, error } = await q;
    if (error || !data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

export default async function ProspectarePage() {
  const supabase = createServiceClient();

  // Fetch statii + crm în paralel, join în cod (evită problema cache schema PostgREST)
  const [statiiRaw, crmRaw] = await Promise.all([
    fetchAllPages(
      supabase,
      "statii_rar",
      "id, cod_statie, denumire, localitate, judet, adresa, telefon, email, persoana_contact, clase_autorizare, nr_linii, data_valabilitate_sfarsit, status_autorizare",
      (q: any) => q.not("telefon", "is", null).not("telefon", "eq", "").order("denumire", { ascending: true })
    ),
    fetchAllPages(supabase, "statii_rar_crm", "statie_rar_id, status, canal_contact, note, data_contact, updated_at"),
  ]);

  // Build lookup map CRM by statie_rar_id
  const crmMap = new Map<string, any>();
  for (const c of crmRaw) {
    crmMap.set(c.statie_rar_id, c);
  }

  const statii = (statiiRaw ?? []).map((s: any) => ({
    ...s,
    crm: crmMap.get(s.id) ?? null,
  }));

  // Compute stats
  const stats = Object.fromEntries(STATUS_LIST.map((s) => [s, 0])) as Record<StatusCrm, number>;
  for (const s of statii) {
    const status: StatusCrm = s.crm?.status ?? "necontactat";
    stats[status] = (stats[status] ?? 0) + 1;
  }

  // Judete list
  const judete = Array.from(
    new Set(statii.map((s: any) => s.judet).filter(Boolean) as string[])
  ).sort();

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#111318]">Prospectare stații ITP</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          {statii.length.toLocaleString("ro-RO")} stații din baza RAR
        </p>
      </div>
      <ProspectareClient statii={statii} stats={stats} judete={judete} />
    </div>
  );
}
