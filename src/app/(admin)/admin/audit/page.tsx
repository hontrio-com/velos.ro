import type { Metadata } from "next";
import { getAuditLog } from "@/lib/actions/admin";
import { AuditClient } from "@/components/admin/audit-client";

export const metadata: Metadata = { title: "Admin - Audit Log" };

export default async function AdminAuditPage() {
  const logs = await getAuditLog(500);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111318]">Audit Log</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          Istoricul complet al acțiunilor efectuate de administratori.
        </p>
      </div>
      <AuditClient logs={logs} />
    </div>
  );
}
