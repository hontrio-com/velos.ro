"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { statieBaseSchema, locatieSchema, programSchema } from "@/lib/validations/statie";
import type { Json } from "@/types/database.types";

// ── createStatieAction ───────────────────────────────────────────
export async function createStatieAction(data: {
  nume: string;
  slug: string;
  telefon: string;
  email?: string;
  website?: string;
  cui?: string;
  nr_autorizatie_rar?: string;
  judet: string;
  localitate: string;
  adresa: string;
  cod_postal?: string;
  lat?: number;
  lng?: number;
  program_lucru: Record<string, { start: string; end: string } | null>;
  durata_slot_minute: number;
  nr_linii: number;
  logo_url?: string;
}): Promise<{ id: string; slug: string } | { error: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const { data: existing } = await supabase
    .from("statii")
    .select("id")
    .eq("slug", data.slug)
    .maybeSingle();

  if (existing) return { error: "Slug-ul este deja folosit. Alege altul." };

  const { data: statie, error } = await supabase
    .from("statii")
    .insert({
      owner_id: user.id,
      nume: data.nume,
      slug: data.slug,
      telefon: data.telefon,
      email: data.email || null,
      website: data.website || null,
      cui: data.cui || null,
      nr_autorizatie_rar: data.nr_autorizatie_rar || null,
      judet: data.judet,
      localitate: data.localitate,
      adresa: data.adresa,
      oras: data.localitate,
      cod_postal: data.cod_postal || null,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      program_lucru: data.program_lucru as Json,
      durata_slot_minute: data.durata_slot_minute,
      nr_linii: data.nr_linii,
      logo_url: data.logo_url || null,
    })
    .select("id, slug")
    .single();

  if (error) return { error: error.message };

  await supabase.from("setari_statie").insert({ statie_id: statie.id });

  revalidatePath("/setari/statii");
  return { id: statie.id, slug: statie.slug };
}

// ── updateStatieAction ───────────────────────────────────────────
export async function updateStatieAction(
  id: string,
  section: "base" | "locatie" | "program" | "booking" | "avansat",
  data: Record<string, unknown>
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const { data: statie } = await supabase
    .from("statii")
    .select("id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!statie) return { error: "Stație negăsită sau acces interzis" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let updateData: Record<string, any> = {};

  if (section === "base") {
    const parsed = statieBaseSchema.safeParse(data);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    updateData = {
      ...parsed.data,
      email: parsed.data.email || null,
      website: parsed.data.website || null,
      cui: parsed.data.cui || null,
    };
  } else if (section === "locatie") {
    const parsed = locatieSchema.safeParse(data);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    updateData = {
      ...parsed.data,
      oras: parsed.data.localitate,
      cod_postal: parsed.data.cod_postal || null,
    };
  } else if (section === "program") {
    const parsed = programSchema.safeParse(data);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    updateData = {
      program_lucru: parsed.data.program_lucru as Json,
      durata_slot_minute: parsed.data.durata_slot_minute,
      nr_linii: parsed.data.nr_linii,
    };
  } else if (section === "booking") {
    updateData = {
      booking_activ: Boolean(data.booking_activ),
      slug: data.slug as string,
      mesaj_intampinare: (data.mesaj_intampinare as string) || null,
      instructiuni_client: (data.instructiuni_client as string) || null,
      afiseaza_tarife: Boolean(data.afiseaza_tarife),
      afiseaza_program: Boolean(data.afiseaza_program),
    };
  } else if (section === "avansat") {
    updateData = { activa: Boolean(data.activa) };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("statii").update(updateData as any).eq("id", id) as any);

  if (error) return { error: error.message };

  revalidatePath("/setari/statii");
  revalidatePath(`/setari/statii/${id}`);
  return { success: true };
}

// ── updateLogoAction ─────────────────────────────────────────────
export async function updateLogoAction(
  statieId: string,
  formData: FormData
): Promise<{ logo_url: string } | { error: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const file = formData.get("file") as File;
  if (!file) return { error: "Niciun fișier selectat" };

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${user.id}/${statieId}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("logo-statii")
    .upload(path, file, { upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage
    .from("logo-statii")
    .getPublicUrl(path);

  await supabase
    .from("statii")
    .update({ logo_url: publicUrl })
    .eq("id", statieId)
    .eq("owner_id", user.id);

  revalidatePath(`/setari/statii/${statieId}`);
  return { logo_url: publicUrl };
}

// ── deleteLogoAction ─────────────────────────────────────────────
export async function deleteLogoAction(
  statieId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const { data: statie } = await supabase
    .from("statii")
    .select("logo_url")
    .eq("id", statieId)
    .eq("owner_id", user.id)
    .single();

  if (statie?.logo_url) {
    const parts = statie.logo_url.split("/logo-statii/");
    if (parts[1]) {
      await supabase.storage.from("logo-statii").remove([parts[1]]);
    }
  }

  await supabase
    .from("statii")
    .update({ logo_url: null })
    .eq("id", statieId);

  revalidatePath(`/setari/statii/${statieId}`);
  return { success: true };
}

// ── checkSlugUnicAction ──────────────────────────────────────────
export async function checkSlugUnicAction(
  slug: string,
  excludeId?: string
): Promise<{ available: boolean }> {
  const supabase = await createClient();

  let query = supabase
    .from("statii")
    .select("id")
    .eq("slug", slug);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data } = await query.maybeSingle();
  return { available: !data };
}

// ── deleteStatieAction ───────────────────────────────────────────
export async function deleteStatieAction(
  id: string,
  confirmNume: string
): Promise<{ error: string } | never> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const { data: statie } = await supabase
    .from("statii")
    .select("nume")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!statie) return { error: "Stație negăsită" };
  if (confirmNume !== statie.nume) return { error: "Numele nu coincide" };

  const { error } = await supabase
    .from("statii")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/setari/statii");
  redirect("/setari/statii");
}

// ── updateTarifeAction ───────────────────────────────────────────
export async function updateTarifeAction(
  statieId: string,
  tarife: Record<string, { pret: number; durata_extra: number }>
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const { error } = await supabase
    .from("setari_statie")
    .upsert(
      { statie_id: statieId, tarife: tarife as Json },
      { onConflict: "statie_id" }
    );

  if (error) return { error: error.message };

  revalidatePath(`/setari/statii/${statieId}`);
  return { success: true };
}

// ── updateSetariSmsAction ────────────────────────────────────────
export async function updateSetariSmsAction(
  statieId: string,
  data: Record<string, unknown>
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const { error } = await supabase
    .from("setari_statie")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert({ statie_id: statieId, ...data } as any, { onConflict: "statie_id" });

  if (error) return { error: error.message };

  revalidatePath(`/setari/statii/${statieId}`);
  return { success: true };
}

// ── testSmsoAction ───────────────────────────────────────────────
export async function testSmsoAction(
  statieId: string,
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Neautentificat" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", user.id)
    .single();

  if (!profile?.phone) {
    return { success: false, message: "Adaugă un număr de telefon în profil" };
  }

  try {
    const res = await fetch("https://app.smso.ro/api/v1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Authorization": apiKey,
      },
      body: JSON.stringify({
        to: profile.phone,
        message: "Test SMS ITP CRM - cheia API funcționează corect.",
        sender: "ITPCRM",
      }),
    });

    if (res.ok) return { success: true, message: "SMS de test trimis!" };
    return { success: false, message: "Cheie API invalidă" };
  } catch {
    return { success: false, message: "Eroare de rețea" };
  }
}

// ── toggleStatieActivaAction ─────────────────────────────────────
export async function toggleStatieActivaAction(
  id: string,
  activa: boolean
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const { error } = await supabase
    .from("statii")
    .update({ activa })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/setari/statii");
  return { success: true };
}
