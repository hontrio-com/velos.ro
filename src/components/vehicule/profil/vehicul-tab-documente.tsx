"use client";

import { useState, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format, parseISO, differenceInDays } from "date-fns";
import { ro } from "date-fns/locale";
import {
  Plus, Upload, FileText, File, Image, Trash2,
  Download, Calendar, X, Loader2,
  FolderOpen, ChevronDown, ChevronUp, ScanText, CheckCircle2,
} from "lucide-react";
import { runOcr } from "@/lib/ocr";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { saveDocumentAction, deleteDocumentAction, getSignedUrlAction } from "@/lib/actions/documente";
import type { DocumentRow } from "@/lib/actions/documente";

const CATEGORII: Record<string, { label: string; color: string; bg: string; types: string[] }> = {
  obligatorii: {
    label: "Documente obligatorii", color: "#1877F2", bg: "#EFF6FF",
    types: ["Talon", "CIV", "RCA", "CI Proprietar", "Contract leasing", "Procură", "Altul"],
  },
  tehnice: {
    label: "Documente tehnice", color: "#7C3AED", bg: "#F5F3FF",
    types: ["Fișă service", "Revizie", "Factură", "Diagnoză", "Certificare", "Altul"],
  },
  itp: {
    label: "ITP & Inspecții", color: "#16A34A", bg: "#F0FDF4",
    types: ["Certificat ITP", "Raport ITP", "Poze inspecție", "Altul"],
  },
  altele: {
    label: "Altele", color: "#6B7280", bg: "#F9FAFB",
    types: ["Document", "Imagine", "Altul"],
  },
};

interface Props {
  vehiculId: string;
  statieId: string;
}

interface AddFormState {
  open: boolean;
  categorie: string;
  tip_document: string;
  titlu: string;
  descriere: string;
  data_document: string;
  data_expirare: string;
  file: File | null;
}

const EMPTY_FORM: AddFormState = {
  open: false, categorie: "obligatorii", tip_document: "Talon",
  titlu: "", descriere: "", data_document: "", data_expirare: "", file: null,
};

function getExpiryBadge(date: string | null) {
  if (!date) return null;
  const days = differenceInDays(parseISO(date), new Date());
  if (days < 0) return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">Expirat</span>;
  if (days <= 7) return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-700">{days}z</span>;
  if (days <= 30) return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">{days}z</span>;
  return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#DCFCE7] text-[#15803D]">{format(parseISO(date), "dd.MM.yy")}</span>;
}

function fileIcon(tip: string | null) {
  if (!tip) return <FileText className="h-4 w-4" />;
  if (tip.startsWith("image/")) return <Image className="h-4 w-4" />;
  if (tip === "application/pdf") return <File className="h-4 w-4 text-red-600" />;
  return <FileText className="h-4 w-4" />;
}

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function VehiculTabDocumente({ vehiculId, statieId }: Props) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AddFormState>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [scanning, setScanning] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const { data: documente = [], isLoading } = useQuery<DocumentRow[]>({
    queryKey: ["documente", vehiculId],
    queryFn: async () => {
      const { data } = await supabase
        .from("documente_vehicule")
        .select("*")
        .eq("vehicul_id", vehiculId)
        .order("created_at", { ascending: false });
      return (data ?? []) as DocumentRow[];
    },
  });

  function setField<K extends keyof AddFormState>(k: K, v: AddFormState[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setField("file", f); setOcrDone(false); }
  }, []);

  async function handleCameraCapture(file: File) {
    // Open the form, set the file, then auto-run OCR
    setForm({ ...EMPTY_FORM, open: true, file });
    setOcrDone(false);
    setScanning(true);
    try {
      const result = await runOcr(file);
      let filled = 0;
      if (result.dataExpirare) {
        setForm((p) => ({ ...p, data_expirare: result.dataExpirare! }));
        filled++;
      }
      if (result.dataDocument) {
        setForm((p) => ({ ...p, data_document: result.dataDocument! }));
        filled++;
      }
      setOcrDone(true);
      if (filled > 0) {
        toast.success(`OCR: ${filled} câmp${filled > 1 ? "uri" : ""} completat${filled > 1 ? "e" : ""} automat`);
      } else {
        toast.info("Scanare completă — completează manual data expirării");
      }
    } catch {
      toast.error("Eroare la scanare OCR");
    } finally {
      setScanning(false);
    }
  }

  async function handleScan() {
    if (!form.file) return;
    const isImage = form.file.type.startsWith("image/");
    if (!isImage) {
      toast.error("Scanarea OCR funcționează doar pe imagini (JPG, PNG, WEBP)");
      return;
    }
    setScanning(true);
    try {
      const result = await runOcr(form.file);
      let filled = 0;
      if (result.dataExpirare && !form.data_expirare) {
        setField("data_expirare", result.dataExpirare);
        filled++;
      }
      if (result.dataDocument && !form.data_document) {
        setField("data_document", result.dataDocument);
        filled++;
      }
      setOcrDone(true);
      if (filled > 0) {
        toast.success(`OCR: ${filled} câmp${filled > 1 ? "uri" : ""} completat${filled > 1 ? "e" : ""} automat`);
      } else {
        toast.info("OCR finalizat — nu s-au detectat date noi (completează manual)");
      }
    } catch {
      toast.error("Eroare la scanare OCR");
    } finally {
      setScanning(false);
    }
  }

  async function handleSubmit() {
    if (!form.titlu.trim()) { toast.error("Titlul este obligatoriu"); return; }
    setUploading(true);

    let fisier_url: string | undefined;
    let fisier_path: string | undefined;
    let fisier_nume: string | undefined;
    let fisier_marime: number | undefined;
    let fisier_tip: string | undefined;

    if (form.file) {
      const ext = form.file.name.split(".").pop();
      const path = `${statieId}/${vehiculId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("documente-vehicule")
        .upload(path, form.file, { upsert: false });

      if (uploadErr) {
        toast.error("Eroare la upload: " + uploadErr.message);
        setUploading(false);
        return;
      }

      fisier_path = path;
      fisier_nume = form.file.name;
      fisier_marime = form.file.size;
      fisier_tip = form.file.type;
    }

    const result = await saveDocumentAction({
      vehiculId,
      statieId,
      categorie: form.categorie,
      tip_document: form.tip_document,
      titlu: form.titlu.trim(),
      descriere: form.descriere || undefined,
      data_document: form.data_document || undefined,
      data_expirare: form.data_expirare || undefined,
      fisier_url,
      fisier_path,
      fisier_nume,
      fisier_marime,
      fisier_tip,
    });

    setUploading(false);
    if (result.success) {
      toast.success("Document adăugat");
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ["documente", vehiculId] });
    } else {
      toast.error(result.error ?? "Eroare");
    }
  }

  async function handleDelete(doc: DocumentRow) {
    if (!confirm(`Ștergi documentul "${doc.titlu}"?`)) return;
    setDeletingId(doc.id);
    const result = await deleteDocumentAction(doc.id);
    setDeletingId(null);
    if (result.success) {
      toast.success("Document șters");
      queryClient.invalidateQueries({ queryKey: ["documente", vehiculId] });
    } else {
      toast.error(result.error ?? "Eroare");
    }
  }

  async function handleDownload(doc: DocumentRow) {
    if (!doc.fisier_path) return;
    const result = await getSignedUrlAction(doc.fisier_path);
    if (result.signedUrl) {
      window.open(result.signedUrl, "_blank");
    } else {
      toast.error("Nu s-a putut genera link-ul de descărcare");
    }
  }

  // Group docs by categorie
  const byCategorie = Object.keys(CATEGORII).reduce<Record<string, DocumentRow[]>>((acc, cat) => {
    acc[cat] = documente.filter((d) => d.categorie === cat);
    return acc;
  }, {});

  const totalDocs = documente.length;

  return (
    <div className="space-y-4">
      {/* Hidden camera input */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleCameraCapture(f);
          // reset so same file can be picked again
          e.target.value = "";
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-[#6B7280]" />
          <span className="text-sm font-semibold text-[#111318]">
            {totalDocs} {totalDocs === 1 ? "document" : "documente"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-[#1877F2] text-[#1877F2] hover:bg-[#EFF6FF]"
            onClick={() => cameraRef.current?.click()}
            disabled={scanning}
          >
            {scanning ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />Scanare...</>
            ) : (
              <><ScanText className="h-3.5 w-3.5" />Scanează document</>
            )}
          </Button>
          <Button
            size="sm"
            className="bg-[#1877F2] hover:bg-[#1565D8] gap-1.5"
            onClick={() => setField("open", true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Adaugă document
          </Button>
        </div>
      </div>

      {/* Add form */}
      {form.open && (
        <div className="bg-white border border-[#1877F2]/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#111318]">Document nou</p>
            <button type="button" onClick={() => setForm(EMPTY_FORM)} className="text-[#9CA3AF] hover:text-[#374151]">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">Categorie</label>
              <select value={form.categorie}
                onChange={(e) => { setField("categorie", e.target.value); setField("tip_document", CATEGORII[e.target.value].types[0]); }}
                className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] bg-white text-[#111318]">
                {Object.entries(CATEGORII).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">Tip document</label>
              <select value={form.tip_document} onChange={(e) => setField("tip_document", e.target.value)}
                className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] bg-white text-[#111318]">
                {CATEGORII[form.categorie].types.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#374151] mb-1.5">Titlu *</label>
              <input type="text" value={form.titlu} onChange={(e) => setField("titlu", e.target.value)}
                placeholder="ex: RCA Allianz 2025"
                className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 text-[#111318] placeholder:text-[#9CA3AF]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">Data document</label>
              <DatePicker value={form.data_document} onChange={(v) => setField("data_document", v)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">Data expirare</label>
              <DatePicker value={form.data_expirare} onChange={(v) => setField("data_expirare", v)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#374151] mb-1.5">Descriere (opțional)</label>
              <textarea value={form.descriere} onChange={(e) => setField("descriere", e.target.value)} rows={2}
                placeholder="Detalii suplimentare..."
                className="w-full text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#1877F2] resize-none text-[#111318] placeholder:text-[#9CA3AF]" />
            </div>
          </div>

          {/* File drop zone */}
          <div
            ref={dropRef}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
              dragging ? "border-[#1877F2] bg-[#EFF6FF]" : "border-[#E5E7EB] hover:border-[#1877F2]/50 hover:bg-[#F9FAFB]"
            )}
          >
            <input ref={fileRef} type="file" className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
              onChange={(e) => { setField("file", e.target.files?.[0] ?? null); setOcrDone(false); }} />
            {form.file ? (
              <div className="flex items-center justify-center gap-2">
                {fileIcon(form.file.type)}
                <span className="text-sm font-medium text-[#111318]">{form.file.name}</span>
                <span className="text-xs text-[#9CA3AF]">({formatSize(form.file.size)})</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); setField("file", null); setOcrDone(false); }}
                  className="ml-2 text-[#9CA3AF] hover:text-red-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="h-6 w-6 text-[#9CA3AF] mx-auto" />
                <p className="text-sm text-[#6B7280]">Trage fișierul aici sau <span className="text-[#1877F2]">selectează</span></p>
                <p className="text-xs text-[#9CA3AF]">PDF, JPG, PNG, WEBP — max 25 MB</p>
              </div>
            )}
          </div>

          {/* OCR button — shown when an image is selected */}
          {form.file?.type.startsWith("image/") && (
            <div className="flex items-center gap-3 px-1">
              {ocrDone ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Scanare OCR completă — câmpurile au fost completate automat
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleScan}
                  disabled={scanning}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] text-[#1877F2] text-sm font-medium hover:bg-[#DBEAFE] transition-colors disabled:opacity-60"
                >
                  {scanning ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Scanare în curs (~5s)...</>
                  ) : (
                    <><ScanText className="h-4 w-4" />Scanează document (OCR)</>
                  )}
                </button>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setForm(EMPTY_FORM)} disabled={uploading}>Anulează</Button>
            <Button size="sm" className="bg-[#1877F2] hover:bg-[#1565D8]" onClick={handleSubmit} disabled={uploading || !form.titlu.trim()}>
              {uploading ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Se încarcă...</> : <><Plus className="h-3.5 w-3.5 mr-1.5" />Adaugă</>}
            </Button>
          </div>
        </div>
      )}

      {/* Documents by category */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-[#F9FAFB] rounded-xl animate-pulse" />)}
        </div>
      ) : totalDocs === 0 && !form.open ? (
        <div className="bg-white border border-[#E5E7EB] rounded-xl py-16 flex flex-col items-center text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF]">
            <FileText className="h-6 w-6 text-[#1877F2]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#111318]">Niciun document adăugat</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Adaugă documente pentru a le gestiona centralizat.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(CATEGORII).map(([catKey, cat]) => {
            const docs = byCategorie[catKey] ?? [];
            if (docs.length === 0) return null;
            const isCollapsed = collapsed[catKey];

            return (
              <div key={catKey} className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setCollapsed((p) => ({ ...p, [catKey]: !p[catKey] }))}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F9FAFB] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm font-semibold text-[#111318]">{cat.label}</span>
                    <span className="text-xs text-[#9CA3AF] bg-[#F7F8FA] px-1.5 py-0.5 rounded-full">{docs.length}</span>
                  </div>
                  {isCollapsed ? <ChevronDown className="h-4 w-4 text-[#9CA3AF]" /> : <ChevronUp className="h-4 w-4 text-[#9CA3AF]" />}
                </button>

                {!isCollapsed && (
                  <div className="divide-y divide-[#F9FAFB] border-t border-[#E5E7EB]">
                    {docs.map((doc) => (
                      <div key={doc.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[#F9FAFB] transition-colors">
                        {/* Icon */}
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0" style={{ background: cat.bg }}>
                          <span style={{ color: cat.color }}>{fileIcon(doc.fisier_tip)}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-[#111318]">{doc.titlu}</p>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F7F8FA] text-[#6B7280]">{doc.tip_document}</span>
                            {getExpiryBadge(doc.data_expirare)}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-[11px] text-[#9CA3AF]">
                            {doc.data_document && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(parseISO(doc.data_document), "dd.MM.yyyy")}
                              </span>
                            )}
                            {doc.fisier_nume && <span>{doc.fisier_nume} {doc.fisier_marime ? `· ${formatSize(doc.fisier_marime)}` : ""}</span>}
                            {doc.descriere && <span className="truncate max-w-[200px]">{doc.descriere}</span>}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {doc.fisier_path && (
                            <button type="button" onClick={() => handleDownload(doc)}
                              className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#EFF6FF] hover:text-[#1877F2] transition-colors">
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button type="button" onClick={() => handleDelete(doc)} disabled={deletingId === doc.id}
                            className="p-1.5 rounded-lg text-[#9CA3AF] hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50">
                            {deletingId === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
