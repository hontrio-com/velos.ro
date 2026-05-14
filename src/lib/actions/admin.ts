"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Neautentificat");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) throw new Error("Acces interzis");
  return user;
}

export async function updateUserPlan(profileId: string, plan: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("profiles")
    .update({ plan: plan as "trial" | "basic" | "pro" | "enterprise" })
    .eq("id", profileId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/utilizatori");
}

export async function addSmsCredit(profileId: string, amount: number) {
  await requireAdmin();
  if (amount <= 0) throw new Error("Cantitate invalidă");
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("sms_credit")
    .eq("id", profileId)
    .single();
  if (error) throw new Error(error.message);
  await supabase
    .from("profiles")
    .update({ sms_credit: (data.sms_credit ?? 0) + amount })
    .eq("id", profileId);
  revalidatePath("/admin/utilizatori");
  revalidatePath("/admin/sms");
}

export async function setSmsCredit(profileId: string, amount: number) {
  await requireAdmin();
  if (amount < 0) throw new Error("Cantitate invalidă");
  const supabase = createServiceClient();
  await supabase
    .from("profiles")
    .update({ sms_credit: amount })
    .eq("id", profileId);
  revalidatePath("/admin/utilizatori");
  revalidatePath("/admin/sms");
}

export async function toggleAdminRole(profileId: string, isAdmin: boolean) {
  await requireAdmin();
  const supabase = createServiceClient();
  await supabase.from("profiles").update({ is_admin: isAdmin }).eq("id", profileId);
  revalidatePath("/admin/utilizatori");
}

export async function toggleStation(statieId: string, activa: boolean) {
  await requireAdmin();
  const supabase = createServiceClient();
  await supabase.from("statii").update({ activa }).eq("id", statieId);
  revalidatePath("/admin/statii");
}

export async function deleteStation(statieId: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase.from("statii").delete().eq("id", statieId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/statii");
}
