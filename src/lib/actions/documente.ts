"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface DocumentRow {
  id: string;
  vehicul_id: string;
  statie_id: string;
  categorie: string;
  tip_document: string;
  titlu: string;
  descriere: string | null;
  data_document: string | null;
  data_expirare: string | null;
  fisier_url: string | null;
  fisier_path: string | null;
  fisier_nume: string | null;
  fisier_marime: number | null;
  fisier_tip: string | null;
  created_at: string;
}

export interface SaveDocumentInput {
  vehiculId: string;
  statieId: string;
  categorie: string;
  tip_document: string;
  titlu: string;
  descriere?: string;
  data_document?: string;
  data_expirare?: string;
  fisier_url?: string;
  fisier_path?: string;
  fisier_nume?: string;
  fisier_marime?: number;
  fisier_tip?: string;
}

export interface DocActionResult {
  success: boolean;
  error?: string;
  id?: string;
  signedUrl?: string;
}

export async function saveDocumentAction(input: SaveDocumentInput): Promise<DocActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("documente_vehicule")
    .insert({
      vehicul_id: input.vehiculId,
      statie_id: input.statieId,
      categorie: input.categorie,
      tip_document: input.tip_document,
      titlu: input.titlu,
      descriere: input.descriere || null,
      data_document: input.data_document || null,
      data_expirare: input.data_expirare || null,
      fisier_url: input.fisier_url || null,
      fisier_path: input.fisier_path || null,
      fisier_nume: input.fisier_nume || null,
      fisier_marime: input.fisier_marime || null,
      fisier_tip: input.fisier_tip || null,
      creat_de: user.id,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, id: data.id };
}

export async function updateDocumentAction(
  id: string,
  input: Partial<SaveDocumentInput>
): Promise<DocActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("documente_vehicule")
    .update({
      ...(input.titlu !== undefined && { titlu: input.titlu }),
      ...(input.descriere !== undefined && { descriere: input.descriere || null }),
      ...(input.data_document !== undefined && { data_document: input.data_document || null }),
      ...(input.data_expirare !== undefined && { data_expirare: input.data_expirare || null }),
      ...(input.categorie !== undefined && { categorie: input.categorie }),
      ...(input.tip_document !== undefined && { tip_document: input.tip_document }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteDocumentAction(id: string): Promise<DocActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get document first to delete from storage
  const { data: doc } = await supabase
    .from("documente_vehicule")
    .select("fisier_path")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("documente_vehicule")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  // Delete from storage if path exists
  if (doc?.fisier_path) {
    const serviceSupabase = await createServiceClient();
    await serviceSupabase.storage
      .from("documente-vehicule")
      .remove([doc.fisier_path]);
  }

  return { success: true };
}

export async function getSignedUrlAction(path: string): Promise<DocActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.storage
    .from("documente-vehicule")
    .createSignedUrl(path, 3600); // 1 hour

  if (error || !data) return { success: false, error: error?.message };
  return { success: true, signedUrl: data.signedUrl };
}

export async function updateVehiculProfileAction(
  vehiculId: string,
  data: Record<string, string | number | null>
): Promise<DocActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("vehicule")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", vehiculId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
