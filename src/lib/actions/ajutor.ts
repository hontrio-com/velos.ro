"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export type TichetCategorie = "ajutor" | "bug" | "sugestie" | "altele";
export type TichetStatus = "deschis" | "in_lucru" | "rezolvat" | "inchis";
export type TichetPrioritate = "normala" | "urgenta";

export type Tichet = {
  id: string;
  profile_id: string;
  titlu: string;
  categorie: TichetCategorie;
  status: TichetStatus;
  prioritate: TichetPrioritate;
  created_at: string;
  updated_at: string;
  profiles?: { email: string; full_name: string | null } | null;
};

export type TichetMesaj = {
  id: string;
  tichet_id: string;
  profile_id: string | null;
  mesaj: string;
  is_admin: boolean;
  created_at: string;
};

// ── User actions ──────────────────────────────────────────────────────────────

export async function getTicheteAction(): Promise<Tichet[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await (supabase as any)
    .from("tichete")
    .select("*")
    .eq("profile_id", user.id)
    .order("updated_at", { ascending: false });

  return (data ?? []) as Tichet[];
}

export async function getTichetDetailAction(
  tichetId: string
): Promise<{ tichet: Tichet; mesaje: TichetMesaj[] } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tichet } = await (supabase as any)
    .from("tichete")
    .select("*")
    .eq("id", tichetId)
    .eq("profile_id", user.id)
    .single();

  if (!tichet) return null;

  const { data: mesaje } = await (supabase as any)
    .from("tichete_mesaje")
    .select("*")
    .eq("tichet_id", tichetId)
    .order("created_at", { ascending: true });

  return { tichet: tichet as Tichet, mesaje: (mesaje ?? []) as TichetMesaj[] };
}

export async function createTichetAction(input: {
  titlu: string;
  categorie: TichetCategorie;
  mesaj: string;
}): Promise<{ success: true; id: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  if (!input.titlu.trim()) return { error: "Titlul este obligatoriu" };
  if (!input.mesaj.trim()) return { error: "Descrierea este obligatorie" };

  const { data: tichet, error } = await (supabase as any)
    .from("tichete")
    .insert({ profile_id: user.id, titlu: input.titlu.trim(), categorie: input.categorie })
    .select("id")
    .single();

  if (error || !tichet) return { error: "Eroare la crearea tichetului" };

  await (supabase as any).from("tichete_mesaje").insert({
    tichet_id: tichet.id,
    profile_id: user.id,
    mesaj: input.mesaj.trim(),
    is_admin: false,
  });

  revalidatePath("/ajutor");
  return { success: true, id: tichet.id };
}

export async function addMesajAction(input: {
  tichetId: string;
  mesaj: string;
}): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const { data: tichet } = await (supabase as any)
    .from("tichete")
    .select("id, status")
    .eq("id", input.tichetId)
    .eq("profile_id", user.id)
    .single();

  if (!tichet) return { error: "Tichet negăsit" };
  if (tichet.status === "inchis") return { error: "Tichetul este închis" };

  const { error } = await (supabase as any).from("tichete_mesaje").insert({
    tichet_id: input.tichetId,
    profile_id: user.id,
    mesaj: input.mesaj.trim(),
    is_admin: false,
  });

  if (error) return { error: "Eroare la trimiterea mesajului" };

  await (supabase as any)
    .from("tichete")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", input.tichetId);

  revalidatePath("/ajutor");
  return { success: true };
}

// ── Admin actions ─────────────────────────────────────────────────────────────

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  return profile?.is_admin ? user : null;
}

export async function adminGetTicheteAction(): Promise<Tichet[]> {
  const user = await verifyAdmin();
  if (!user) return [];

  const svc = createServiceClient();
  const { data } = await (svc as any)
    .from("tichete")
    .select("*, profiles(email, full_name)")
    .order("updated_at", { ascending: false });

  return (data ?? []) as Tichet[];
}

export async function adminGetTichetDetailAction(
  tichetId: string
): Promise<{ tichet: Tichet; mesaje: TichetMesaj[] } | null> {
  const user = await verifyAdmin();
  if (!user) return null;

  const svc = createServiceClient();
  const { data: tichet } = await (svc as any)
    .from("tichete")
    .select("*, profiles(email, full_name)")
    .eq("id", tichetId)
    .single();

  if (!tichet) return null;

  const { data: mesaje } = await (svc as any)
    .from("tichete_mesaje")
    .select("*")
    .eq("tichet_id", tichetId)
    .order("created_at", { ascending: true });

  return { tichet: tichet as Tichet, mesaje: (mesaje ?? []) as TichetMesaj[] };
}

export async function adminUpdateTichetAction(input: {
  tichetId: string;
  status?: TichetStatus;
  prioritate?: TichetPrioritate;
}): Promise<{ success: true } | { error: string }> {
  const user = await verifyAdmin();
  if (!user) return { error: "Acces interzis" };

  const svc = createServiceClient();
  const update: Record<string, string> = { updated_at: new Date().toISOString() };
  if (input.status) update.status = input.status;
  if (input.prioritate) update.prioritate = input.prioritate;

  const { error } = await (svc as any)
    .from("tichete")
    .update(update)
    .eq("id", input.tichetId);

  if (error) return { error: "Eroare la actualizare" };
  revalidatePath("/admin/suport");
  return { success: true };
}

export async function adminAddMesajAction(input: {
  tichetId: string;
  mesaj: string;
}): Promise<{ success: true } | { error: string }> {
  const user = await verifyAdmin();
  if (!user) return { error: "Acces interzis" };

  const svc = createServiceClient();
  const { error } = await (svc as any).from("tichete_mesaje").insert({
    tichet_id: input.tichetId,
    profile_id: user.id,
    mesaj: input.mesaj.trim(),
    is_admin: true,
  });

  if (error) return { error: "Eroare la trimiterea răspunsului" };

  // Move to in_lucru if was open
  await (svc as any)
    .from("tichete")
    .update({ status: "in_lucru", updated_at: new Date().toISOString() })
    .eq("id", input.tichetId)
    .eq("status", "deschis");

  revalidatePath("/admin/suport");
  return { success: true };
}
