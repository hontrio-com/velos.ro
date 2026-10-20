import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { fetchAll } from "@/lib/fetch-all";
import { SmsAdminClient } from "@/components/admin/sms-admin-client";

export const metadata: Metadata = { title: "Admin - SMS Quota" };

/**
 * SMS-uri trimise luna aceasta, numărate din mesaje — și cele plătite din credit,
 * pe care sms_quota nu le numără (acolo intră doar cele incluse în plan). Pe
 * proprietar prin statii.owner_id. null dacă citirea eșuează.
 */
async function smsTrimiseLuna(supabase: ReturnType<typeof createServiceClient>, luna: string) {
  try {
    const [statii, mesaje] = await Promise.all([
      fetchAll((from, to) =>
        supabase.from("statii").select("id, owner_id").order("id", { ascending: true }).range(from, to)
      ),
      fetchAll((from, to) =>
        supabase
          .from("mesaje")
          .select("statie_id")
          .eq("tip", "sms")
          .eq("directie", "trimis")
          .in("status", ["trimis", "livrat"])
          .gte("created_at", `${luna}T00:00:00Z`) // luna în UTC, ca sms_quota
          .order("id", { ascending: true })
          .range(from, to)
      ),
    ]);
    const ownerStatie = new Map(statii.map((s) => [s.id, s.owner_id]));
    const peOwner: Record<string, number> = {};
    for (const m of mesaje) {
      const owner = ownerStatie.get(m.statie_id);
      if (owner) peOwner[owner] = (peOwner[owner] ?? 0) + 1;
    }
    return { total: mesaje.length, peOwner };
  } catch (err) {
    console.error("[admin] Nu am putut număra SMS-urile trimise din mesaje:", (err as Error).message);
    return null;
  }
}

export default async function AdminSmsPage() {
  const supabase = createServiceClient();
  const thisMonth = new Date().toISOString().substring(0, 7) + "-01";

  const [{ data: profiles }, { data: quotas }, { data: cohorta }, trimiseLuna] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, plan, sms_credit, trial_expires_at")
      .order("email"),
    (supabase as any)
      .from("sms_quota")
      .select("profile_id, sms_trimise, sms_limita, luna")
      .eq("luna", thisMonth),
    // Proprietarii din trialul nou (fără SMS incluse). Interogare separată: dacă
    // migrația 012 lipsește, întoarce eroare => listă goală, restul paginii merge.
    supabase
      .from("profiles")
      .select("id")
      .eq("trial_fara_sms", true)
      .eq("plan", "trial")
      .neq("role", "angajat"),
    smsTrimiseLuna(supabase, thisMonth),
  ]);
  const idsTrialFaraSms = new Set((cohorta ?? []).map((r) => r.id));

  const quotaMap: Record<string, { trimise: number; limita: number }> = {};
  (quotas as any[])?.forEach((q: any) => {
    quotaMap[q.profile_id] = { trimise: q.sms_trimise, limita: q.sms_limita };
  });

  const enriched = profiles?.map((p) => {
    const quota = quotaMap[p.id];
    return {
      ...p,
      trialFaraSms: idsTrialFaraSms.has(p.id),
      // Toate SMS-urile trimise luna aceasta (incluse + din credit), dar cel puțin cele
      // incluse din sms_quota: rândurile din mesaje dispar odată cu stația ștearsă (ON
      // DELETE CASCADE) sau lipsesc dacă salvarea lor a eșuat. Dacă mesaje nu a putut
      // fi citit: cifra din sms_quota, ca înainte.
      smsTrimise: trimiseLuna ? Math.max(trimiseLuna.peOwner[p.id] ?? 0, quota?.trimise ?? 0) : (quota?.trimise ?? 0),
      // Incluse în plan consumate luna aceasta (sms_quota). null = niciun rând pe luna
      // aceasta (ex. trialul vechi le numără pe luna lui), deci împărțirea nu se știe.
      smsIncluse: quota ? quota.trimise : null,
      smsLimita: quota?.limita ?? 0,
    };
  }) ?? [];

  // Din mesaje (toate stațiile), plus incluse din sms_quota care nu mai au rând în mesaje
  // (aceeași plasă ca pe rânduri): antetul nu arată mai puțin decât suma rândurilor.
  const totalTrimise = trimiseLuna
    ? trimiseLuna.total + enriched.reduce((sum, p) => sum + Math.max(0, (p.smsIncluse ?? 0) - (trimiseLuna.peOwner[p.id] ?? 0)), 0)
    : enriched.reduce((sum, p) => sum + p.smsTrimise, 0);
  const totalCredit = enriched.reduce((sum, p) => sum + (p.sms_credit ?? 0), 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111318]">SMS Quota</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          {totalTrimise.toLocaleString("ro-RO")} SMS trimise luna aceasta · {totalCredit.toLocaleString("ro-RO")} credite cumpărate în total
        </p>
      </div>
      <SmsAdminClient users={enriched} />
    </div>
  );
}
