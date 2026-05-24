import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { ProspectareClient } from "@/components/admin/prospectare-client";
import type { StatusCrm } from "@/lib/actions/prospectare";

export const metadata: Metadata = { title: "Admin - Prospectare" };

const STATUS_LIST: StatusCrm[] = [
  "necontactat", "contactat", "interesat", "client",
  "refuzat", "foloseste_alt_soft", "are_soft_custom",
];

async function fetchAllStatii(supabase: any) {
  const PAGE = 1000;
  const all: any[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("statii_rar")
      .select(`
        id, cod_statie, denumire, localitate, judet, adresa,
        telefon, email, persoana_contact, clase_autorizare,
        nr_linii, data_valabilitate_sfarsit, status_autorizare,
        statii_rar_crm(status, canal_contact, note, data_contact, updated_at)
      `)
      .not("telefon", "is", null)
      .not("telefon", "eq", "")
      .order("denumire", { ascending: true })
      .range(from, from + PAGE - 1);

    if (error || !data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  return all;
}

export default async function ProspectarePage() {
  const supabase = createServiceClient();

  const statiiRaw = await fetchAllStatii(supabase);

  const statii = (statiiRaw ?? []).map((s: any) => {
    const crmArr = Array.isArray(s.statii_rar_crm) ? s.statii_rar_crm : [];
    const crm = crmArr[0] ?? null;
    return { ...s, statii_rar_crm: undefined, crm };
  });

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
