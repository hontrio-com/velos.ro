import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { SetariAdminClient } from "@/components/admin/setari-admin-client";

export const metadata: Metadata = { title: "Admin - Setări Platformă" };

export default async function AdminSetariPage() {
  const supabase = createServiceClient();
  const { data: settings } = await (supabase as any)
    .from("admin_settings")
    .select("cheie, valoare, descriere, updated_at")
    .order("cheie");

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111318]">Setări Platformă</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          Configurează parametrii globali ai platformei. Modificările intră în vigoare imediat.
        </p>
      </div>
      <SetariAdminClient settings={settings ?? []} />
    </div>
  );
}
