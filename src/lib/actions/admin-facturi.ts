"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { emiteFactura } from "@/lib/smartbill";

const TIP_LABELS: Record<string, string> = {
  sms_purchase: "SMS-uri Velos CRM",
  subscription_new: "Abonament Velos CRM",
  subscription_renewal: "Reinnoire Abonament Velos CRM",
};

export async function retryFacturaAction(
  facturaId: string
): Promise<{ success: boolean; serie?: string; numar?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Neautentificat" };

  const serviceClient = createServiceClient();

  // Verifică is_admin
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!(profile as any)?.is_admin) return { success: false, error: "Acces interzis" };

  // Ia factura
  const { data: factura } = await (serviceClient as any)
    .from("facturi")
    .select("*")
    .eq("id", facturaId)
    .single();

  if (!factura) return { success: false, error: "Factura negăsită" };

  const profileId = factura.profile_id as string;

  // Date client: stație sau fallback profil
  const { data: statie } = await serviceClient
    .from("statii")
    .select("nume, cui, adresa, oras, judet, email")
    .eq("owner_id", profileId)
    .eq("activa", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: profil } = !statie
    ? await serviceClient.from("profiles").select("full_name, email").eq("id", profileId).single()
    : { data: null };

  const s = statie as any;
  const clientInfo = statie
    ? {
        name: s.nume ?? "Client Velos CRM",
        vatCode: s.cui ?? undefined,
        isTaxPayer: !!s.cui,
        address: s.adresa ?? undefined,
        city: s.oras ?? undefined,
        county: s.judet ?? undefined,
        email: s.email ?? undefined,
      }
    : {
        name: (profil as any)?.full_name ?? "Client Velos CRM",
        email: (profil as any)?.email ?? undefined,
      };

  const productName = TIP_LABELS[factura.tip as string] ?? "Serviciu Velos CRM";

  const result = await emiteFactura({
    client: clientInfo,
    productName,
    amount: factura.suma,
    currency: factura.moneda ?? "RON",
  });

  // Actualizează înregistrarea
  await (serviceClient as any)
    .from("facturi")
    .update({
      smartbill_serie: result.serie ?? null,
      smartbill_numar: result.numar ?? null,
      eroare: result.success ? null : (result.error ?? "Eroare necunoscuta"),
    })
    .eq("id", facturaId);

  return result.success
    ? { success: true, serie: result.serie, numar: result.numar }
    : { success: false, error: result.error };
}
