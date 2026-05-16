"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendAngajatInvitatieEmail } from "@/lib/actions/email";

export interface AngajatActionResult {
  success: boolean;
  error?: string;
}

export type Permisiuni = {
  programari: boolean;
  clienti: boolean;
  vehicule: boolean;
  rapoarte: boolean;
  remindere: boolean;
};

export const DEFAULT_PERMISIUNI: Permisiuni = {
  programari: true,
  clienti: true,
  vehicule: false,
  rapoarte: false,
  remindere: false,
};

// ── CREATE CONT (needs auth.admin → server action) ───────────────────────────

export async function createAngajatContAction(
  angajatId: string,
  statieId: string,
  statieNume: string,
  numeAngajat: string,
  email: string,
  parola: string,
  permisiuni: Permisiuni
): Promise<AngajatActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Neautentificat" };

    const adminDb = createServiceClient();

    const { data: newUser, error: authError } = await adminDb.auth.admin.createUser({
      email: email.trim(),
      password: parola,
      email_confirm: true,
    });

    if (authError || !newUser.user) {
      return { success: false, error: authError?.message ?? "Eroare la crearea contului" };
    }

    const newUserId = newUser.user.id;

    const { error: profileError } = await (adminDb as any)
      .from("profiles")
      .upsert({
        id: newUserId,
        email: email.trim(),
        full_name: numeAngajat,
        role: "angajat",
        owner_profile_id: user.id,
        onboarding_completed: true,
        plan: "owner",
        subscription_status: "active",
        trial_expires_at: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: "id" });

    if (profileError) {
      await adminDb.auth.admin.deleteUser(newUserId).catch(console.error);
      return { success: false, error: profileError.message };
    }

    const { error: linkError } = await (adminDb as any)
      .from("angajati")
      .update({
        profile_id: newUserId,
        email: email.trim(),
        permisiuni,
        updated_at: new Date().toISOString(),
      })
      .eq("id", angajatId)
      .eq("statie_id", statieId);

    if (linkError) {
      await adminDb.auth.admin.deleteUser(newUserId).catch(console.error);
      return { success: false, error: linkError.message };
    }

    const permisiuniLabel: Record<keyof Permisiuni, string> = {
      programari: "Programări",
      clienti: "Clienți",
      vehicule: "Vehicule",
      rapoarte: "Rapoarte",
      remindere: "Remindere",
    };
    const permisiuniActive = (Object.keys(permisiuni) as (keyof Permisiuni)[])
      .filter((k) => permisiuni[k])
      .map((k) => permisiuniLabel[k]);

    sendAngajatInvitatieEmail(email.trim(), {
      numeAngajat,
      numeStatie: statieNume,
      email: email.trim(),
      parola,
      permisiuni: permisiuniActive,
    }).catch(console.error);

    revalidatePath("/angajati");
    return { success: true };
  } catch (err) {
    console.error("[createAngajatContAction]", err);
    return { success: false, error: "Eroare neașteptată la crearea contului" };
  }
}

// ── DELETE CONT (needs auth.admin → server action) ───────────────────────────

export async function deleteAngajatContAction(profileId: string): Promise<AngajatActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Neautentificat" };

    const adminDb = createServiceClient();
    const { error: authErr } = await adminDb.auth.admin.deleteUser(profileId);
    if (authErr) return { success: false, error: authErr.message };

    revalidatePath("/angajati");
    return { success: true };
  } catch (err) {
    console.error("[deleteAngajatContAction]", err);
    return { success: false, error: "Eroare neașteptată la ștergerea contului" };
  }
}
