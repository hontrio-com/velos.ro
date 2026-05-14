"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

interface AdminUser { id: string; email: string }

async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Neautentificat");

  const { data: profile } = await supabase
    .from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) throw new Error("Acces interzis");
  return { id: user.id, email: user.email ?? "" };
}

async function logAudit(
  admin: AdminUser,
  actiune: string,
  targetType: string,
  targetId: string,
  targetLabel: string,
  detalii?: Record<string, unknown>
) {
  try {
    const supabase = createServiceClient();
    await (supabase as any).from("admin_audit_log").insert({
      admin_id: admin.id,
      admin_email: admin.email,
      actiune,
      target_type: targetType,
      target_id: targetId,
      target_label: targetLabel,
      detalii: detalii ?? null,
    });
  } catch { /* audit failure nu blochează acțiunea */ }
}

// ── Utilizatori ─────────────────────────────────────────────────

export async function updateUserPlan(profileId: string, plan: string) {
  const admin = await requireAdmin();
  const supabase = createServiceClient();
  const { data: old } = await supabase.from("profiles").select("plan, email").eq("id", profileId).single();
  const { error } = await supabase.from("profiles")
    .update({ plan: plan as "trial" | "basic" | "pro" | "enterprise" }).eq("id", profileId);
  if (error) throw new Error(error.message);
  await logAudit(admin, "change_plan", "user", profileId, old?.email ?? profileId, {
    old_plan: old?.plan, new_plan: plan,
  });
  revalidatePath("/admin/utilizatori");
}

export async function addSmsCredit(profileId: string, amount: number) {
  const admin = await requireAdmin();
  if (amount <= 0) throw new Error("Cantitate invalidă");
  const supabase = createServiceClient();
  const { data } = await supabase.from("profiles").select("sms_credit, email").eq("id", profileId).single();
  const newCredit = (data?.sms_credit ?? 0) + amount;
  await supabase.from("profiles").update({ sms_credit: newCredit }).eq("id", profileId);
  await logAudit(admin, "add_sms_credit", "user", profileId, data?.email ?? profileId, {
    amount, old_credit: data?.sms_credit, new_credit: newCredit,
  });
  revalidatePath("/admin/utilizatori");
  revalidatePath("/admin/sms");
}

export async function setSmsCredit(profileId: string, amount: number) {
  const admin = await requireAdmin();
  if (amount < 0) throw new Error("Cantitate invalidă");
  const supabase = createServiceClient();
  const { data } = await supabase.from("profiles").select("sms_credit, email").eq("id", profileId).single();
  await supabase.from("profiles").update({ sms_credit: amount }).eq("id", profileId);
  await logAudit(admin, "set_sms_credit", "user", profileId, data?.email ?? profileId, {
    old_credit: data?.sms_credit, new_credit: amount,
  });
  revalidatePath("/admin/utilizatori");
  revalidatePath("/admin/sms");
}

export async function toggleAdminRole(profileId: string, isAdmin: boolean) {
  const admin = await requireAdmin();
  const supabase = createServiceClient();
  const { data } = await supabase.from("profiles").select("email").eq("id", profileId).single();
  await supabase.from("profiles").update({ is_admin: isAdmin }).eq("id", profileId);
  await logAudit(admin, isAdmin ? "grant_admin" : "revoke_admin", "user", profileId, data?.email ?? profileId);
  revalidatePath("/admin/utilizatori");
}

export async function suspendUser(profileId: string, reason: string) {
  const admin = await requireAdmin();
  const supabase = createServiceClient();
  const { data } = await supabase.from("profiles").select("email").eq("id", profileId).single();
  await supabase.from("profiles").update({
    suspended_at: new Date().toISOString(),
    suspend_reason: reason,
  }).eq("id", profileId);
  await logAudit(admin, "suspend_user", "user", profileId, data?.email ?? profileId, { reason });
  revalidatePath("/admin/utilizatori");
}

export async function unsuspendUser(profileId: string) {
  const admin = await requireAdmin();
  const supabase = createServiceClient();
  const { data } = await supabase.from("profiles").select("email").eq("id", profileId).single();
  await supabase.from("profiles").update({
    suspended_at: null,
    suspend_reason: null,
  }).eq("id", profileId);
  await logAudit(admin, "unsuspend_user", "user", profileId, data?.email ?? profileId);
  revalidatePath("/admin/utilizatori");
}

// ── Stații ──────────────────────────────────────────────────────

export async function toggleStation(statieId: string, activa: boolean) {
  const admin = await requireAdmin();
  const supabase = createServiceClient();
  const { data } = await supabase.from("statii").select("nume").eq("id", statieId).single();
  await supabase.from("statii").update({ activa }).eq("id", statieId);
  await logAudit(admin, activa ? "activate_station" : "deactivate_station", "statie", statieId, data?.nume ?? statieId);
  revalidatePath("/admin/statii");
}

export async function deleteStation(statieId: string) {
  const admin = await requireAdmin();
  const supabase = createServiceClient();
  const { data } = await supabase.from("statii").select("nume").eq("id", statieId).single();
  const { error } = await supabase.from("statii").delete().eq("id", statieId);
  if (error) throw new Error(error.message);
  await logAudit(admin, "delete_station", "statie", statieId, data?.nume ?? statieId);
  revalidatePath("/admin/statii");
}

export async function getStatieStats(statieId: string): Promise<{
  programariCount: number;
  angajatiCount: number;
  clientiUnici: number;
  ultimaProgramare: string | null;
}> {
  await requireAdmin();
  const supabase = createServiceClient();
  const [
    { count: programariCount },
    { count: angajatiCount },
    { data: programariData },
  ] = await Promise.all([
    supabase.from("programari").select("*", { count: "exact", head: true }).eq("statie_id", statieId),
    supabase.from("angajati").select("*", { count: "exact", head: true }).eq("statie_id", statieId),
    supabase.from("programari").select("client_id, created_at")
      .eq("statie_id", statieId).order("created_at", { ascending: false }).limit(500),
  ]);
  const clientiUnici = new Set(programariData?.map((p) => p.client_id).filter(Boolean)).size;
  return {
    programariCount: programariCount ?? 0,
    angajatiCount: angajatiCount ?? 0,
    clientiUnici,
    ultimaProgramare: programariData?.[0]?.created_at ?? null,
  };
}

// ── Admin Settings ───────────────────────────────────────────────

export async function updateAdminSetting(cheie: string, valoare: string) {
  const admin = await requireAdmin();
  const supabase = createServiceClient();
  await (supabase as any).from("admin_settings").upsert(
    { cheie, valoare, updated_at: new Date().toISOString() },
    { onConflict: "cheie" }
  );
  await logAudit(admin, "update_setting", "setting", cheie, cheie, { valoare });
  revalidatePath("/admin/setari");
}

// ── Broadcast / Notificări ──────────────────────────────────────

export async function sendBroadcast(data: {
  titlu: string;
  mesaj: string;
  tip: string;
  target: string;
}): Promise<{ count: number }> {
  const admin = await requireAdmin();
  const supabase = createServiceClient();

  let query = supabase.from("profiles").select("id").is("suspended_at", null);
  if (data.target !== "all") {
    query = (query as any).eq("plan", data.target);
  }
  const { data: profiles } = await query;
  if (!profiles || profiles.length === 0) return { count: 0 };

  await supabase.from("notificari").insert(
    profiles.map((p) => ({
      profile_id: p.id,
      titlu: data.titlu,
      mesaj: data.mesaj,
      tip: data.tip as "info" | "warning" | "success" | "update",
    }))
  );

  await logAudit(admin, "send_broadcast", "broadcast", "all", data.titlu, {
    target: data.target,
    tip: data.tip,
    destinatari: profiles.length,
  });

  return { count: profiles.length };
}

// ── Audit Log ────────────────────────────────────────────────────

export async function getAuditLog(limit = 200): Promise<Array<{
  id: string;
  admin_email: string;
  actiune: string;
  target_type: string | null;
  target_label: string | null;
  detalii: Record<string, unknown> | null;
  created_at: string;
}>> {
  await requireAdmin();
  const supabase = createServiceClient();
  const { data } = await (supabase as any)
    .from("admin_audit_log")
    .select("id, admin_email, actiune, target_type, target_label, detalii, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as any[]) ?? [];
}
