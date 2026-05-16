"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { sendAngajatInvitatieEmail } from "@/lib/actions/email";
import type { Angajat, Permisiuni, ActionResult } from "@/lib/actions/angajati-types";

// Re-export for backwards-compatibility with existing imports
export type { Angajat, Permisiuni, ActionResult } from "@/lib/actions/angajati-types";
export { DEFAULT_PERMISIUNI } from "@/lib/actions/angajati-types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers (private)
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the authenticated user or null */
async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Verifies that `userId` is the owner of `statieId`.
 * Uses service client to bypass RLS — purely a logic check.
 */
async function assertOwnsStatie(
  userId: string,
  statieId: string
): Promise<boolean> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("statii")
    .select("id")
    .eq("id", statieId)
    .eq("owner_id", userId)
    .maybeSingle();
  return !error && !!data;
}

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

export async function getAngajatiAction(statieId: string): Promise<Angajat[]> {
  try {
    const user = await getUser();
    if (!user) return [];

    const owns = await assertOwnsStatie(user.id, statieId);
    if (!owns) return [];

    const db = createServiceClient();
    const { data, error } = await db
      .from("angajati")
      .select(
        "id, statie_id, profile_id, nume, functie, telefon, email, activ, permisiuni, created_at"
      )
      .eq("statie_id", statieId)
      .order("activ", { ascending: false })
      .order("nume");

    if (error) {
      console.error("[getAngajatiAction]", error.message);
      return [];
    }

    return (data ?? []) as unknown as Angajat[];
  } catch (err) {
    console.error("[getAngajatiAction] catch:", err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

export async function createAngajatAction(
  statieId: string,
  payload: {
    nume: string;
    functie: string | null;
    telefon: string | null;
    email: string | null;
    activ: boolean;
  }
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Neautentificat" };

    const owns = await assertOwnsStatie(user.id, statieId);
    if (!owns) return { success: false, error: "Acces interzis" };

    const db = createServiceClient();
    const { data, error } = await db
      .from("angajati")
      .insert({
        statie_id: statieId,
        nume: payload.nume,
        functie: payload.functie,
        telefon: payload.telefon,
        email: payload.email,
        activ: payload.activ,
      } as never)
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/angajati");
    return { success: true, data: { id: (data as any).id } };
  } catch (err) {
    console.error("[createAngajatAction] catch:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Eroare neașteptată",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────

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
): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Neautentificat" };

    const owns = await assertOwnsStatie(user.id, statieId);
    if (!owns) return { success: false, error: "Acces interzis" };

    const db = createServiceClient();
    const updateData: Record<string, unknown> = {
      nume: payload.nume,
      functie: payload.functie,
      telefon: payload.telefon,
      email: payload.email,
      activ: payload.activ,
      updated_at: new Date().toISOString(),
    };
    if (payload.permisiuni !== undefined) {
      updateData.permisiuni = payload.permisiuni;
    }

    const { error } = await db
      .from("angajati")
      .update(updateData as never)
      .eq("id", angajatId)
      .eq("statie_id", statieId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/angajati");
    return { success: true };
  } catch (err) {
    console.error("[updateAngajatAction] catch:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Eroare neașteptată",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE ACTIV
// ─────────────────────────────────────────────────────────────────────────────

export async function toggleAngajatActivAction(
  angajatId: string,
  statieId: string,
  activ: boolean
): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Neautentificat" };

    const owns = await assertOwnsStatie(user.id, statieId);
    if (!owns) return { success: false, error: "Acces interzis" };

    const db = createServiceClient();
    const { error } = await db
      .from("angajati")
      .update({ activ, updated_at: new Date().toISOString() } as never)
      .eq("id", angajatId)
      .eq("statie_id", statieId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/angajati");
    return { success: true };
  } catch (err) {
    console.error("[toggleAngajatActivAction] catch:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Eroare neașteptată",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE ANGAJAT ROW
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteAngajatAction(
  angajatId: string,
  statieId: string
): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Neautentificat" };

    const owns = await assertOwnsStatie(user.id, statieId);
    if (!owns) return { success: false, error: "Acces interzis" };

    const db = createServiceClient();
    const { error } = await db
      .from("angajati")
      .delete()
      .eq("id", angajatId)
      .eq("statie_id", statieId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/angajati");
    return { success: true };
  } catch (err) {
    console.error("[deleteAngajatAction] catch:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Eroare neașteptată",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE CONT (auth.admin — creează user în auth + linkuiește cu angajat)
// ─────────────────────────────────────────────────────────────────────────────

export async function createContAngajatAction(
  angajatId: string,
  statieId: string,
  statieNume: string,
  numeAngajat: string,
  email: string,
  parola: string,
  permisiuni: Permisiuni
): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Neautentificat" };

    const owns = await assertOwnsStatie(user.id, statieId);
    if (!owns) return { success: false, error: "Acces interzis" };

    const adminDb = createServiceClient();

    // 1. Crează contul în auth.users
    const { data: newAuthUser, error: authError } =
      await adminDb.auth.admin.createUser({
        email: email.trim(),
        password: parola,
        email_confirm: true,
      });

    if (authError || !newAuthUser.user) {
      return {
        success: false,
        error: authError?.message ?? "Eroare la crearea contului",
      };
    }

    const newUserId = newAuthUser.user.id;

    // 2. Crează profilul (sau actualizează dacă există deja)
    const { error: profileError } = await adminDb
      .from("profiles")
      .upsert(
        {
          id: newUserId,
          email: email.trim(),
          full_name: numeAngajat,
          role: "angajat",
          owner_profile_id: user.id,
          onboarding_completed: true,
          plan: "owner",
          subscription_status: "active",
          trial_expires_at: new Date(
            Date.now() + 10 * 365 * 24 * 60 * 60 * 1000
          ).toISOString(),
        } as never,
        { onConflict: "id" }
      );

    if (profileError) {
      // Rollback: șterge userul creat
      await adminDb.auth.admin.deleteUser(newUserId).catch(console.error);
      return { success: false, error: profileError.message };
    }

    // 3. Linkuiește angajatul cu noul cont
    const { error: linkError } = await adminDb
      .from("angajati")
      .update({
        profile_id: newUserId,
        email: email.trim(),
        permisiuni,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", angajatId)
      .eq("statie_id", statieId);

    if (linkError) {
      await adminDb.auth.admin.deleteUser(newUserId).catch(console.error);
      return { success: false, error: linkError.message };
    }

    // 4. Trimite email de invitație (fire-and-forget)
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
    console.error("[createContAngajatAction] catch:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Eroare neașteptată",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE CONT (auth.admin — șterge userul din auth)
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteContAngajatAction(
  profileId: string,
  statieId: string
): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Neautentificat" };

    const owns = await assertOwnsStatie(user.id, statieId);
    if (!owns) return { success: false, error: "Acces interzis" };

    const adminDb = createServiceClient();

    // Șterge din auth (profilul se șterge prin CASCADE din trigger)
    const { error: authErr } = await adminDb.auth.admin.deleteUser(profileId);
    if (authErr) return { success: false, error: authErr.message };

    // Delinkeaza angajatul
    const { error: unlinkErr } = await adminDb
      .from("angajati")
      .update({
        profile_id: null,
        permisiuni: null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("profile_id", profileId);

    if (unlinkErr) {
      console.error("[deleteContAngajatAction] unlink error:", unlinkErr.message);
      // Nu e fatal — userul e deja șters din auth
    }

    revalidatePath("/angajati");
    return { success: true };
  } catch (err) {
    console.error("[deleteContAngajatAction] catch:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Eroare neașteptată",
    };
  }
}
