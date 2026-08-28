import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShieldOff, Mail } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import Image from "next/image";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { getImpersonare } from "@/lib/impersonation";

export default async function SuspendatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("suspended_at, suspend_reason, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.suspended_at) redirect("/dashboard");

  const impersonare = await getImpersonare();

  return (
    <>
      {impersonare && (
        <ImpersonationBanner
          targetEmail={impersonare.target_email}
          targetName={impersonare.target_name}
          adminEmail={impersonare.admin_email}
          expiresAt={impersonare.expires_at}
        />
      )}
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Image src="/logo441x245.png" alt="Velos" width={140} height={78} className="h-10 w-auto" />
        </div>

        <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
            <ShieldOff className="h-8 w-8 text-red-500" />
          </div>

          <h1 className="text-xl font-bold text-[#111318] mb-2">Cont suspendat</h1>

          <p className="text-sm text-[#6B7280] mb-4">
            Contul tău a fost suspendat pe{" "}
            <span className="font-medium text-[#374151]">
              {format(new Date(profile.suspended_at), "d MMMM yyyy", { locale: ro })}
            </span>
            .
          </p>

          {profile.suspend_reason && (
            <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 mb-6 text-left">
              <p className="text-xs font-semibold text-red-700 mb-1">Motiv</p>
              <p className="text-sm text-red-600">{profile.suspend_reason}</p>
            </div>
          )}

          <p className="text-sm text-[#6B7280] mb-6">
            Dacă crezi că este o eroare sau dorești să contești această decizie,
            contactează-ne și vom analiza situația.
          </p>

          <a
            href="mailto:contact@itpbase.ro?subject=Contestatie%20suspendare%20cont"
            className="inline-flex items-center gap-2 bg-[#1877F2] hover:bg-[#1565D8] text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            <Mail className="h-4 w-4" />
            Contactează suportul
          </a>
        </div>
      </div>
    </div>
    </>
  );
}
