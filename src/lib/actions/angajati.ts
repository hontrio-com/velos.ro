"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { sendAngajatInvitatieEmail } from "@/lib/actions/email";

export interface AngajatForm {
  nume: string;
  functie?: string;
  telefon?: string;
  email?: string;
  activ?: boolean;
}

export interface AngajatActionResult {
  success: boolean;
  error?: string;
  id?: string;
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

/** Returns the authenticated user ID, or null if not authenticated. */
async function getAuthUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

/** Verifies that a statie belongs to userId. Returns statieId if valid, null otherwise. */
async function verifyStatieOwnership(db: ReturnType<typeof createServiceClient>, statieId: string, userId: string): Promise<boolean> {
  const { data } = await db
    .from("statii")
    .select("id")
    .eq("id", statieId)
    .eq("owner_id", userId)
    .single();
  return !!data;
}

/** Gets the first active statie for a user. */
async function getOwnerStatieId(db: ReturnType<typeof createServiceClient>, userId: string): Promise<string | null> {
  const { data } = await db
    .from("statii")
    .select("id")
    .eq("owner_id", userId)
    .eq("activa", true)
    .order("created_at")
    .limit(1)
    .single();
  return data?.id ?? null;
}

// ── CREATE ──────────────────────────────────────────────────────────────────

export async function createAngajatAction(form: AngajatForm): Promise<AngajatActionResult> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: "Neautentificat" };

    const db = createServiceClient();
    const statieId = await getOwnerStatieId(db, userId);
    if (!statieId) return { success: false, error: "Nicio stație activă" };

    const { data, error } = await db
      .from("angajati")
      .insert({
        statie_id: statieId,
        nume: form.nume.trim(),
        functie: form.functie?.trim() || null,
        telefon: form.telefon?.trim() || null,
        email: form.email?.trim() || null,
        activ: form.activ ?? true,
      })
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath("/angajati");
    return { success: true, id: data.id };
  } catch (err) {
    console.error("[createAngajatAction]", err);
    return { success: false, error: "Eroare neașteptată" };
  }
}

// ── UPDATE ──────────────────────────────────────────────────────────────────

export async function updateAngajatAction(id: string, form: AngajatForm): Promise<AngajatActionResult> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: "Neautentificat" };

    const db = createServiceClient();

    const { data: angajat } = await db
      .from("angajati")
      .select("statie_id")
      .eq("id", id)
      .single();

    if (!angajat) return { success: false, error: "Angajat negăsit" };

    const owns = await verifyStatieOwnership(db, angajat.statie_id, userId);
    if (!owns) return { success: false, error: "Acces interzis" };

    const { error } = await db
      .from("angajati")
      .update({
        nume: form.nume.trim(),
        functie: form.functie?.trim() || null,
        telefon: form.telefon?.trim() || null,
        email: form.email?.trim() || null,
        activ: form.activ ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    revalidatePath("/angajati");
    return { success: true };
  } catch (err) {
    console.error("[updateAngajatAction]", err);
    return { success: false, error: "Eroare neașteptată" };
  }
}

// ── DELETE ──────────────────────────────────────────────────────────────────

export async function deleteAngajatAction(id: string): Promise<AngajatActionResult> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: "Neautentificat" };

    const db = createServiceClient();

    const { data: angajat } = await db
      .from("angajati")
      .select("statie_id, profile_id")
      .eq("id", id)
      .single();

    if (!angajat) return { success: false, error: "Angajat negăsit" };

    const owns = await verifyStatieOwnership(db, angajat.statie_id, userId);
    if (!owns) return { success: false, error: "Acces interzis" };

    // If angajat has an auth account, delete it
    const profileId = (angajat as any).profile_id as string | null;
    if (profileId) {
      await db.auth.admin.deleteUser(profileId).catch(console.error);
    }

    const { error } = await db.from("angajati").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/angajati");
    return { success: true };
  } catch (err) {
    console.error("[deleteAngajatAction]", err);
    return { success: false, error: "Eroare neașteptată" };
  }
}

// ── TOGGLE ACTIV ─────────────────────────────────────────────────────────────

export async function toggleAngajatActivAction(id: string, activ: boolean): Promise<AngajatActionResult> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: "Neautentificat" };

    const db = createServiceClient();

    const { data: angajat } = await db
      .from("angajati")
      .select("statie_id")
      .eq("id", id)
      .single();

    if (!angajat) return { success: false, error: "Angajat negăsit" };

    const owns = await verifyStatieOwnership(db, angajat.statie_id, userId);
    if (!owns) return { success: false, error: "Acces interzis" };

    const { error } = await db
      .from("angajati")
      .update({ activ, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    revalidatePath("/angajati");
    return { success: true };
  } catch (err) {
    console.error("[toggleAngajatActivAction]", err);
    return { success: false, error: "Eroare neașteptată" };
  }
}

// ── UPDATE PERMISIUNI ────────────────────────────────────────────────────────

export async function updateAngajatPermisiuniAction(
  angajatId: string,
  permisiuni: Permisiuni
): Promise<AngajatActionResult> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: "Neautentificat" };

    const db = createServiceClient();

    const { data: angajat } = await db
      .from("angajati")
      .select("statie_id")
      .eq("id", angajatId)
      .single();

    if (!angajat) return { success: false, error: "Angajat negăsit" };

    const owns = await verifyStatieOwnership(db, angajat.statie_id, userId);
    if (!owns) return { success: false, error: "Acces interzis" };

    const { error } = await (db as any)
      .from("angajati")
      .update({ permisiuni, updated_at: new Date().toISOString() })
      .eq("id", angajatId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/angajati");
    return { success: true };
  } catch (err) {
    console.error("[updateAngajatPermisiuniAction]", err);
    return { success: false, error: "Eroare neașteptată" };
  }
}

// ── CREATE CONT ──────────────────────────────────────────────────────────────

export async function createAngajatContAction(
  angajatId: string,
  email: string,
  parola: string,
  permisiuni: Permisiuni
): Promise<AngajatActionResult> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: "Neautentificat" };

    const db = createServiceClient();

    const { data: angajat } = await db
      .from("angajati")
      .select("id, nume, email, profile_id, statie_id")
      .eq("id", angajatId)
      .single();

    if (!angajat) return { success: false, error: "Angajat negăsit" };

    const { data: statie } = await db
      .from("statii")
      .select("id, nume")
      .eq("id", angajat.statie_id)
      .eq("owner_id", userId)
      .single();

    if (!statie) return { success: false, error: "Acces interzis" };

    if ((angajat as any).profile_id) {
      return { success: false, error: "Angajatul are deja un cont activ" };
    }

    // Create auth user (auto-confirmed)
    const { data: newUser, error: authError } = await db.auth.admin.createUser({
      email: email.trim(),
      password: parola,
      email_confirm: true,
    });

    if (authError || !newUser.user) {
      return { success: false, error: authError?.message ?? "Eroare la crearea contului" };
    }

    const newUserId = newUser.user.id;

    // The handle_new_user() trigger auto-creates a basic profile row.
    // We upsert to set the additional fields.
    const { error: profileError } = await (db as any)
      .from("profiles")
      .upsert({
        id: newUserId,
        email: email.trim(),
        full_name: (angajat as any).nume,
        role: "angajat",
        owner_profile_id: userId,
        onboarding_completed: true,
        plan: "owner",
        subscription_status: "active",
        trial_expires_at: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: "id" });

    if (profileError) {
      await db.auth.admin.deleteUser(newUserId).catch(console.error);
      return { success: false, error: profileError.message };
    }

    // Link angajat.profile_id and update email + permisiuni
    const { error: linkError } = await (db as any)
      .from("angajati")
      .update({
        profile_id: newUserId,
        email: email.trim(),
        permisiuni,
        updated_at: new Date().toISOString(),
      })
      .eq("id", angajatId);

    if (linkError) {
      await db.auth.admin.deleteUser(newUserId).catch(console.error);
      return { success: false, error: linkError.message };
    }

    // Send invitation email (fire-and-forget)
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
      numeAngajat: (angajat as any).nume,
      numeStatie: statie.nume ?? "",
      email: email.trim(),
      parola,
      permisiuni: permisiuniActive,
    }).catch(console.error);

    revalidatePath("/angajati");
    return { success: true };
  } catch (err) {
    console.error("[createAngajatContAction]", err);
    return { success: false, error: "Eroare neașteptată. Verificați că email-ul nu este deja folosit." };
  }
}

// ── DELETE CONT ──────────────────────────────────────────────────────────────

export async function deleteAngajatContAction(
  angajatId: string
): Promise<AngajatActionResult> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: "Neautentificat" };

    const db = createServiceClient();

    const { data: angajat } = await db
      .from("angajati")
      .select("statie_id, profile_id")
      .eq("id", angajatId)
      .single();

    if (!angajat) return { success: false, error: "Angajat negăsit" };

    const owns = await verifyStatieOwnership(db, angajat.statie_id, userId);
    if (!owns) return { success: false, error: "Acces interzis" };

    const profileId = (angajat as any).profile_id as string | null;
    if (!profileId) return { success: false, error: "Angajatul nu are cont" };

    const { error: authErr } = await db.auth.admin.deleteUser(profileId);
    if (authErr) return { success: false, error: authErr.message };

    // Unlink profile_id from angajat
    await (db as any)
      .from("angajati")
      .update({ profile_id: null, updated_at: new Date().toISOString() })
      .eq("id", angajatId);

    revalidatePath("/angajati");
    return { success: true };
  } catch (err) {
    console.error("[deleteAngajatContAction]", err);
    return { success: false, error: "Eroare neașteptată" };
  }
}
