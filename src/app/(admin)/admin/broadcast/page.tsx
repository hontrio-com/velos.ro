import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { BroadcastClient } from "@/components/admin/broadcast-client";

export const metadata: Metadata = { title: "Admin - Broadcast" };

export default async function AdminBroadcastPage() {
  const supabase = createServiceClient();

  // Statistici destinatari potențiali per plan
  const { data: profiles } = await supabase
    .from("profiles")
    .select("plan")
    .is("suspended_at", null);

  const planCounts = (profiles ?? []).reduce((acc: Record<string, number>, p) => {
    acc[p.plan] = (acc[p.plan] ?? 0) + 1;
    acc.all = (acc.all ?? 0) + 1;
    return acc;
  }, {});

  // Ultimele broadcast-uri din audit log
  const { data: recentBroadcasts } = await (supabase as any)
    .from("admin_audit_log")
    .select("id, admin_email, detalii, created_at")
    .eq("actiune", "send_broadcast")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111318]">Broadcast & Notificări</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          Trimite notificări in-app către utilizatori. Mesajele apar în clopotelul din dashboard.
        </p>
      </div>
      <BroadcastClient planCounts={planCounts} recentBroadcasts={recentBroadcasts ?? []} />
    </div>
  );
}
