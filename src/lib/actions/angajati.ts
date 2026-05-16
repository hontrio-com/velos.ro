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

// ── CREATE ANGAJAT ROW ───────────────────────────────────────────────────────

export async function createAngajatAction(
  statieId: string,
  nume: string,
  functie: string | null,
  telefon: string | null,
  email: string | null,
  activ: boolean
): Promise<AngajatActionResult & { id?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Neautentificat" };

    const { data, error } = await (supabase as any)
      .from("angajati")
      .insert({ statie_id: statieId, nume, functie, telefon, email, activ })
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, id: (data as any).id };
  } catch (err) {
    console.error("[createAngajatAction]", err);
    return { success: false, error: err instanceof Error ? err.message : "Eroare neașteptată" };
  }
}

// ── UPDATE ANGAJAT ROW ───────────────────────────────────────────────────────

export async function updateAngajatAction(
  angajatId: string,
  statieId: string,
  payload: {
    nume: string;
    functie: string | null;
    telefon: string | null;
    email: string | null;
    activ: boolean;
    permisiuni?: Permisiuni;
  }
): Promise<AngajatActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Neautentificat" };

    const { error } = await (supabase as any)
      .from("angajati")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", angajatId)
      .eq("statie_id", statieId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    console.error("[updateAngajatAction]", err);
    return { success: false, error: err instanceof Error ? err.message : "Eroare neașteptată" };
  }
}

// ── TOGGLE ACTIV ─────────────────────────────────────────────────────────────

export async function toggleAngajatActivAction(
  angajatId: string,
  statieId: string,
  activ: boolean
): Promise<AngajatActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Neautentificat" };

    const { error } = await (supabase as any)
      .from("angajati")
      .update({ activ, updated_at: new Date().toISOString() })
      .eq("id", angajatId)
      .eq("statie_id", statieId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/angajati");
    return { success: true };
  } catch (err) {
    console.error("[toggleAngajatActivAction]", err);
    return { success: false, error: err instanceof Error ? err.message : "Eroare neașteptată" };
  }
}

// ── DELETE ANGAJAT ROW ───────────────────────────────────────────────────────

export async function deleteAngajatAction(
  angajatId: string,
  statieId: string
): Promise<AngajatActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Neautentificat" };

    const { error } = await (supabase as any)
      .from("angajati")
      .delete()
      .eq("id", angajatId)
      .eq("statie_id", statieId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/angajati");
    return { success: true };
  } catch (err) {
    console.error("[deleteAngajatAction]", err);
    return { success: false, error: err instanceof Error ? err.message : "Eroare neașteptată" };
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
