"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import {
  Globe, Palette, Star, MessageCircle, Loader2, Plus, Trash2,
  Check, ExternalLink, Eye, EyeOff, Sparkles, Image as ImageIcon,
  ChevronUp, ChevronDown, GripVertical, CalendarDays, Clock,
  MapPin, Phone, X, Upload, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  upsertSmartPageAction, uploadSmartMediaAction,
  deleteSmartGalerieImageAction, deleteSmartMediaAction,
} from "@/lib/actions/smart-page";
import type { SmartPageData, SmartServicii, ChatbotQA } from "@/lib/actions/smart-page";
import { SmartPageStatsTab } from "./smart-page-stats-tab";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "prezentare", label: "Prezentare", icon: Globe },
  { id: "aspect", label: "Aspect", icon: Palette },
  { id: "media", label: "Galerie & Media", icon: ImageIcon },
  { id: "servicii", label: "Servicii", icon: Star },
  { id: "chatbot", label: "Chatbot", icon: MessageCircle },
  { id: "structura", label: "Structură", icon: GripVertical },
  { id: "statistici", label: "Statistici", icon: BarChart3 },
] as const;

type TabId = (typeof TABS)[number]["id"];

const ALL_SECTIONS = [
  { id: "programare", label: "Programare online", icon: CalendarDays, descriere: "Calendar booking sincronizat" },
  { id: "program", label: "Program de lucru", icon: Clock, descriere: "Orele de funcționare" },
  { id: "servicii", label: "Servicii", icon: Star, descriere: "Lista de servicii și prețuri" },
  { id: "galerie", label: "Galerie foto", icon: ImageIcon, descriere: "Fotografii din stație" },
  { id: "locatie", label: "Locație & Hartă", icon: MapPin, descriere: "Adresă, Google Maps, Waze" },
  { id: "contact", label: "Contact", icon: Phone, descriere: "Date de contact complete" },
];

const DEFAULT_ORDER = ALL_SECTIONS.map((s) => s.id);

interface Props {
  statieId: string;
  statieSlug: string;
  statieNume: string;
  initialData: SmartPageData | null;
}

export function SmartPageEditor({ statieId, statieSlug, statieNume, initialData }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("prezentare");
  const [isPending, startTransition] = useTransition();

  // Prezentare
  const [activa, setActiva] = useState(initialData?.activa ?? false);
  const [seoDes, setSeoDes] = useState(initialData?.seo_description ?? "");

  // Aspect
  const [culoare, setCuloare] = useState(initialData?.culoare_primara ?? "#1877F2");
  const [tagline, setTagline] = useState(initialData?.tagline ?? "");
  const [whatsapp, setWhatsapp] = useState(initialData?.whatsapp_nr ?? "");

  // Media
  const [logoUrl, setLogoUrl] = useState(initialData?.logo_url ?? null);
  const [bannerUrl, setBannerUrl] = useState(initialData?.banner_url ?? null);
  const [galerie, setGalerie] = useState<string[]>(initialData?.galerie_urls ?? []);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingGalerie, setUploadingGalerie] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const galerieInputRef = useRef<HTMLInputElement>(null);

  // Servicii
  const [servicii, setServicii] = useState<SmartServicii[]>(initialData?.servicii ?? []);

  // Chatbot
  const [chatbotQa, setChatbotQa] = useState<ChatbotQA[]>(initialData?.chatbot_qa ?? []);

  // Structura
  const [sectiuniOrdine, setSectiuniOrdine] = useState<string[]>(
    initialData?.sectiuni_ordine?.length ? initialData.sectiuni_ordine : DEFAULT_ORDER
  );

  const publicUrl = `/${statieSlug}`;

  async function save(partial: Partial<SmartPageData>) {
    startTransition(async () => {
      const r = await upsertSmartPageAction(statieId, partial);
      if ("error" in r) toast.error(r.error);
      else toast.success("Salvat!");
    });
  }

  // ── Upload helpers ──────────────────────────────────────────────────────────
  async function handleFileUpload(
    type: "logo" | "banner" | "galerie",
    file: File,
    setLoading: (v: boolean) => void
  ) {
    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const MAX_MB = 5;
    if (!ALLOWED.includes(file.type)) {
      toast.error("Format nesuportat. Folosiți JPG, PNG sau WebP.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Imaginea depășește ${MAX_MB}MB. Reduceți dimensiunea și reîncercați.`);
      return;
    }
    if (type === "banner" && file.size > 2 * 1024 * 1024) {
      toast.warning("Recomandăm banner-ul în format 16:9 (ex: 1200×675px), maxim 2MB.");
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await uploadSmartMediaAction(statieId, type, fd);
      if ("error" in r) {
        toast.error(r.error);
      } else {
        if (type === "logo") setLogoUrl(r.url);
        else if (type === "banner") setBannerUrl(r.url);
        else setGalerie((prev) => [...prev, r.url]);
        toast.success(type === "galerie" ? "Imagine adăugată!" : "Salvat!");
      }
    } catch {
      toast.error("Eroare la upload");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteGalerie(url: string) {
    const r = await deleteSmartGalerieImageAction(statieId, url);
    if ("error" in r) toast.error(r.error);
    else {
      setGalerie((prev) => prev.filter((u) => u !== url));
      toast.success("Imagine ștearsă");
    }
  }

  async function handleDeleteMedia(type: "logo" | "banner") {
    const r = await deleteSmartMediaAction(statieId, type);
    if ("error" in r) toast.error(r.error);
    else {
      if (type === "logo") setLogoUrl(null);
      else setBannerUrl(null);
      toast.success("Șters");
    }
  }

  // ── Servicii helpers ────────────────────────────────────────────────────────
  function addServiciu() {
    setServicii((prev) => [...prev, { id: crypto.randomUUID(), nume: "", pret: undefined, durata: undefined, descriere: "" }]);
  }
  function updateServiciu(id: string, field: keyof SmartServicii, value: string | number | undefined) {
    setServicii((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  }
  function removeServiciu(id: string) {
    setServicii((prev) => prev.filter((s) => s.id !== id));
  }

  // ── Chatbot helpers ─────────────────────────────────────────────────────────
  function addQA() {
    setChatbotQa((prev) => [...prev, { id: crypto.randomUUID(), intrebare: "", raspuns: "" }]);
  }
  function updateQA(id: string, field: keyof ChatbotQA, value: string) {
    setChatbotQa((prev) => prev.map((q) => q.id === id ? { ...q, [field]: value } : q));
  }
  function removeQA(id: string) {
    setChatbotQa((prev) => prev.filter((q) => q.id !== id));
  }

  // ── Structura helpers ───────────────────────────────────────────────────────
  function moveSection(idx: number, dir: "up" | "down") {
    const next = [...sectiuniOrdine];
    const swap = dir === "up" ? idx - 1 : idx + 1;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setSectiuniOrdine(next);
  }
  function toggleSection(id: string) {
    setSectiuniOrdine((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
      {/* Tab bar — scrollable on mobile */}
      <div className="flex overflow-x-auto border-b border-[#E5E7EB]" style={{ scrollbarWidth: "none" }}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button key={id} type="button" onClick={() => setActiveTab(id)}
              className={[
                "relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                "border-b-2 -mb-px focus-visible:outline-none",
                isActive
                  ? "text-[#1877F2] border-[#1877F2] bg-white"
                  : "text-[#6B7280] border-transparent hover:text-[#111318] hover:bg-[#F9FAFB]",
              ].join(" ")}>
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-5 sm:p-6">

        {/* ── PREZENTARE ── */}
        {activeTab === "prezentare" && (
          <div className="space-y-6 max-w-lg">
            <div>
              <h3 className="font-semibold text-[#111318]">Prezentare Smart Page</h3>
              <p className="text-sm text-[#6B7280] mt-0.5">Activează pagina publică a stației tale</p>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-4">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                  activa ? "bg-[#DCFCE7]" : "bg-[#F3F4F6]")}>
                  {activa ? <Eye className="h-4 w-4 text-[#16A34A]" /> : <EyeOff className="h-4 w-4 text-[#6B7280]" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111318]">Pagina este {activa ? "activă" : "inactivă"}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {activa ? `Vizibilă la velos.ro${publicUrl}` : "Clienții nu o pot accesa"}
                  </p>
                </div>
              </div>
              <Switch checked={activa} onCheckedChange={(v) => { setActiva(v); save({ activa: v }); }} />
            </div>

            {activa && (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF]">
                <Globe className="h-4 w-4 text-[#1877F2] shrink-0" />
                <p className="text-sm text-[#1877F2] flex-1 font-mono truncate">
                  velos.ro<span className="font-bold">{publicUrl}</span>
                </p>
                <a href={publicUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-[#1877F2] font-medium hover:underline shrink-0">
                  <ExternalLink className="h-3.5 w-3.5" />Deschide
                </a>
              </div>
            )}

            <div className="space-y-2">
              <Label>Descriere SEO</Label>
              <Textarea value={seoDes} onChange={(e) => setSeoDes(e.target.value)}
                placeholder={`Programare ITP online la ${statieNume}. Rapid, simplu, fără așteptare.`}
                rows={3} maxLength={160} />
              <p className="text-xs text-[#9CA3AF]">{seoDes.length}/160 caractere · Apare în Google</p>
            </div>

            <Button className="bg-[#1877F2] hover:bg-[#1565D8] text-white gap-2 w-full sm:w-auto"
              disabled={isPending}
              onClick={() => save({ activa, seo_description: seoDes || null })}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Salvează
            </Button>
          </div>
        )}

        {/* ── ASPECT ── */}
        {activeTab === "aspect" && (
          <div className="space-y-6 max-w-lg">
            <div>
              <h3 className="font-semibold text-[#111318]">Aspect și brand</h3>
              <p className="text-sm text-[#6B7280] mt-0.5">Culori, mesaj și date de contact</p>
            </div>

            <div className="space-y-2">
              <Label>Culoare accent</Label>
              <div className="flex items-center gap-3 flex-wrap">
                <input type="color" value={culoare} onChange={(e) => setCuloare(e.target.value)}
                  className="h-10 w-14 rounded-lg border border-[#E5E7EB] cursor-pointer p-1" />
                <input type="text" value={culoare} onChange={(e) => setCuloare(e.target.value)}
                  className="w-32 text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 font-mono outline-none focus:border-[#1877F2] text-[#111318]" />
                <div className="flex gap-1.5 flex-wrap">
                  {["#1877F2", "#16A34A", "#7C3AED", "#DC2626", "#EA580C", "#0891B2"].map((c) => (
                    <button key={c} type="button" onClick={() => setCuloare(c)}
                      className="h-7 w-7 rounded-full border-2 transition-all hover:scale-110"
                      style={{ backgroundColor: c, borderColor: culoare === c ? "#111318" : "transparent" }} />
                  ))}
                </div>
              </div>
              <div className="rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: `${culoare}15` }}>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: culoare }}>
                  {statieNume.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-xs" style={{ color: culoare }}>Butonul principal și accentele paginii</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tagline / Slogan</Label>
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)}
                placeholder="Programare ITP online, rapidă și ușoară" maxLength={100} />
              <p className="text-xs text-[#9CA3AF]">Apare sub numele stației în hero</p>
            </div>

            <div className="space-y-2">
              <Label>WhatsApp <span className="text-[#9CA3AF] font-normal text-xs">(opțional)</span></Label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+40712345678" type="tel" />
              <p className="text-xs text-[#9CA3AF]">Afișează buton verde WhatsApp în header</p>
            </div>

            <Button className="bg-[#1877F2] hover:bg-[#1565D8] text-white gap-2 w-full sm:w-auto"
              disabled={isPending}
              onClick={() => save({ culoare_primara: culoare, tagline: tagline || null, whatsapp_nr: whatsapp || null })}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Salvează aspectul
            </Button>
          </div>
        )}

        {/* ── MEDIA ── */}
        {activeTab === "media" && (
          <div className="space-y-8 max-w-2xl">
            <div>
              <h3 className="font-semibold text-[#111318]">Galerie & Media</h3>
              <p className="text-sm text-[#6B7280] mt-0.5">Logo, banner și galerie de fotografii pentru pagina publică</p>
            </div>

            {/* Logo */}
            <div className="space-y-3">
              <div>
                <Label>Logo stație</Label>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Apare în header-ul paginii publice</p>
              </div>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="relative group">
                    <img src={logoUrl} alt="Logo" className="h-20 w-20 rounded-xl object-cover border border-[#E5E7EB]" />
                    <button type="button" onClick={() => handleDeleteMedia("logo")}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-[#DC2626] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-xl border-2 border-dashed border-[#E5E7EB] flex items-center justify-center bg-[#F9FAFB]">
                    <ImageIcon className="h-7 w-7 text-[#D1D5DB]" />
                  </div>
                )}
                <div>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) await handleFileUpload("logo", f, setUploadingLogo);
                      e.target.value = "";
                    }} />
                  <Button size="sm" variant="outline" disabled={uploadingLogo}
                    onClick={() => logoInputRef.current?.click()} className="gap-1.5">
                    {uploadingLogo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {logoUrl ? "Schimbă logo" : "Încarcă logo"}
                  </Button>
                  <p className="text-xs text-[#9CA3AF] mt-1">PNG, JPG, WebP · max 5MB</p>
                </div>
              </div>
            </div>

            <div className="border-t border-[#F3F4F6]" />

            {/* Banner */}
            <div className="space-y-3">
              <div>
                <Label>Banner hero</Label>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Imagine de fundal în secțiunea hero. Dacă nu e setat, se folosește gradient din culoarea accentului.</p>
              </div>
              {bannerUrl ? (
                <div className="relative group rounded-xl overflow-hidden border border-[#E5E7EB]">
                  <img src={bannerUrl} alt="Banner" className="w-full h-36 object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <button type="button" onClick={() => handleDeleteMedia("banner")}
                      className="h-8 w-8 rounded-full bg-[#DC2626] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-28 rounded-xl border-2 border-dashed border-[#E5E7EB] flex flex-col items-center justify-center gap-2 bg-[#F9FAFB]">
                  <ImageIcon className="h-7 w-7 text-[#D1D5DB]" />
                  <p className="text-xs text-[#9CA3AF]">Niciun banner setat</p>
                </div>
              )}
              <input ref={bannerInputRef} type="file" accept="image/*" className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) await handleFileUpload("banner", f, setUploadingBanner);
                  e.target.value = "";
                }} />
              <Button size="sm" variant="outline" disabled={uploadingBanner}
                onClick={() => bannerInputRef.current?.click()} className="gap-1.5">
                {uploadingBanner ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {bannerUrl ? "Schimbă banner" : "Încarcă banner"}
              </Button>
            </div>

            <div className="border-t border-[#F3F4F6]" />

            {/* Gallery */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Galerie foto ({galerie.length} imagini)</Label>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Fotografii din interiorul/exteriorul stației</p>
                </div>
                <input ref={galerieInputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? []);
                    for (const f of files) {
                      await handleFileUpload("galerie", f, setUploadingGalerie);
                    }
                    e.target.value = "";
                  }} />
                <Button size="sm" variant="outline" disabled={uploadingGalerie}
                  onClick={() => galerieInputRef.current?.click()} className="gap-1.5">
                  {uploadingGalerie ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Adaugă
                </Button>
              </div>

              {galerie.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-[#E5E7EB] p-10 flex flex-col items-center gap-2 bg-[#F9FAFB]">
                  <ImageIcon className="h-8 w-8 text-[#D1D5DB]" />
                  <p className="text-sm text-[#6B7280]">Nicio fotografie adăugată</p>
                  <button type="button" onClick={() => galerieInputRef.current?.click()}
                    className="text-sm text-[#1877F2] hover:underline font-medium">
                    Adaugă prima fotografie
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {galerie.map((url) => (
                    <div key={url} className="relative group aspect-square rounded-xl overflow-hidden border border-[#E5E7EB]">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <button type="button" onClick={() => handleDeleteGalerie(url)}
                          className="h-7 w-7 rounded-full bg-[#DC2626] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Add more */}
                  <button type="button" onClick={() => galerieInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-[#E5E7EB] flex flex-col items-center justify-center gap-1 hover:bg-[#F9FAFB] transition-colors">
                    {uploadingGalerie
                      ? <Loader2 className="h-5 w-5 text-[#9CA3AF] animate-spin" />
                      : <Plus className="h-5 w-5 text-[#9CA3AF]" />}
                    <span className="text-[10px] text-[#9CA3AF]">Adaugă</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SERVICII ── */}
        {activeTab === "servicii" && (
          <div className="space-y-5 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#111318]">Servicii oferite</h3>
                <p className="text-sm text-[#6B7280] mt-0.5">Afișate cu prețuri pe pagina publică</p>
              </div>
              <Button size="sm" variant="outline" onClick={addServiciu} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />Adaugă
              </Button>
            </div>

            {servicii.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#E5E7EB] p-10 text-center">
                <Star className="h-8 w-8 text-[#D1D5DB] mx-auto mb-2" />
                <p className="text-sm text-[#6B7280]">Niciun serviciu adăugat</p>
                <button type="button" onClick={addServiciu} className="mt-2 text-sm text-[#1877F2] hover:underline font-medium">
                  Adaugă primul serviciu
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {servicii.map((s, i) => (
                  <div key={s.id} className="rounded-xl border border-[#E5E7EB] p-4 bg-[#F9FAFB] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Serviciu #{i + 1}</span>
                      <button type="button" onClick={() => removeServiciu(s.id)} className="text-[#DC2626] hover:text-[#B91C1C]">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label className="text-xs">Denumire *</Label>
                        <Input value={s.nume} onChange={(e) => updateServiciu(s.id, "nume", e.target.value)} placeholder="ex: ITP Auto" className="bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Preț (lei)</Label>
                        <Input type="number" value={s.pret ?? ""} onChange={(e) => updateServiciu(s.id, "pret", e.target.value ? Number(e.target.value) : undefined)} placeholder="200" className="bg-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label className="text-xs">Descriere scurtă</Label>
                        <Input value={s.descriere ?? ""} onChange={(e) => updateServiciu(s.id, "descriere", e.target.value)} placeholder="ex: Include certificat ITP" className="bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Durată (min)</Label>
                        <Input type="number" value={s.durata ?? ""} onChange={(e) => updateServiciu(s.id, "durata", e.target.value ? Number(e.target.value) : undefined)} placeholder="30" className="bg-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {servicii.length > 0 && (
              <Button className="bg-[#1877F2] hover:bg-[#1565D8] text-white gap-2 w-full sm:w-auto"
                disabled={isPending} onClick={() => save({ servicii })}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Salvează serviciile
              </Button>
            )}
          </div>
        )}

        {/* ── CHATBOT ── */}
        {activeTab === "chatbot" && (
          <div className="space-y-5 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#111318]">Chatbot cu răspunsuri preset</h3>
                <p className="text-sm text-[#6B7280] mt-0.5">Clienții primesc răspunsuri instant la întrebări frecvente</p>
              </div>
              <Button size="sm" variant="outline" onClick={addQA} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />Adaugă Q&A
              </Button>
            </div>

            <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-[#1877F2] shrink-0 mt-0.5" />
              <p className="text-xs text-[#1877F2]">
                Chatbot-ul apare ca buton flotant pe pagina publică. Dacă lista e goală, butonul nu apare.
              </p>
            </div>

            {chatbotQa.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#E5E7EB] p-10 text-center">
                <MessageCircle className="h-8 w-8 text-[#D1D5DB] mx-auto mb-2" />
                <p className="text-sm text-[#6B7280]">Nicio întrebare adăugată</p>
                <button type="button" onClick={addQA} className="mt-2 text-sm text-[#1877F2] hover:underline font-medium">
                  Adaugă prima întrebare
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {chatbotQa.map((q, i) => (
                  <div key={q.id} className="rounded-xl border border-[#E5E7EB] p-4 bg-[#F9FAFB] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Q&A #{i + 1}</span>
                      <button type="button" onClick={() => removeQA(q.id)} className="text-[#DC2626] hover:text-[#B91C1C]">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Întrebare</Label>
                      <Input value={q.intrebare} onChange={(e) => updateQA(q.id, "intrebare", e.target.value)} placeholder="ex: Care este prețul pentru ITP auto?" className="bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Răspuns</Label>
                      <Textarea value={q.raspuns} onChange={(e) => updateQA(q.id, "raspuns", e.target.value)} placeholder="ex: ITP auto costă 200 lei, include toate taxele." rows={2} className="bg-white resize-none text-sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {chatbotQa.length > 0 && (
              <Button className="bg-[#1877F2] hover:bg-[#1565D8] text-white gap-2 w-full sm:w-auto"
                disabled={isPending} onClick={() => save({ chatbot_qa: chatbotQa })}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Salvează chatbot-ul
              </Button>
            )}
          </div>
        )}

        {/* ── STRUCTURA ── */}
        {activeTab === "structura" && (
          <div className="space-y-5 max-w-lg">
            <div>
              <h3 className="font-semibold text-[#111318]">Ordinea secțiunilor</h3>
              <p className="text-sm text-[#6B7280] mt-0.5">
                Reordonează și activează/dezactivează secțiunile paginii publice
              </p>
            </div>

            <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3 flex items-start gap-2">
              <GripVertical className="h-4 w-4 text-[#1877F2] shrink-0 mt-0.5" />
              <p className="text-xs text-[#1877F2]">
                Secțiunile inactive (toggle dezactivat) nu apar pe pagina publică, dar ordinea se păstrează.
              </p>
            </div>

            <div className="space-y-2">
              {/* Show sections in current order */}
              {sectiuniOrdine.map((id, idx) => {
                const section = ALL_SECTIONS.find((s) => s.id === id);
                if (!section) return null;
                const Icon = section.icon;
                return (
                  <div key={id} className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-3 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF] shrink-0">
                      <Icon className="h-4 w-4 text-[#1877F2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111318]">{section.label}</p>
                      <p className="text-xs text-[#9CA3AF]">{section.descriere}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" disabled={idx === 0}
                        onClick={() => moveSection(idx, "up")}
                        className="h-7 w-7 flex items-center justify-center rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <ChevronUp className="h-4 w-4 text-[#374151]" />
                      </button>
                      <button type="button" disabled={idx === sectiuniOrdine.length - 1}
                        onClick={() => moveSection(idx, "down")}
                        className="h-7 w-7 flex items-center justify-center rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <ChevronDown className="h-4 w-4 text-[#374151]" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Sections not in order (disabled) */}
              {ALL_SECTIONS.filter((s) => !sectiuniOrdine.includes(s.id)).map((section) => {
                const Icon = section.icon;
                return (
                  <div key={section.id} className="flex items-center gap-3 rounded-xl border border-dashed border-[#E5E7EB] bg-[#F9FAFB] px-3 py-3 opacity-50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F3F4F6] shrink-0">
                      <Icon className="h-4 w-4 text-[#9CA3AF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#6B7280]">{section.label}</p>
                      <p className="text-xs text-[#9CA3AF]">Dezactivată</p>
                    </div>
                    <button type="button" onClick={() => toggleSection(section.id)}
                      className="text-xs text-[#1877F2] font-medium hover:underline shrink-0">
                      + Activează
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Toggle active sections */}
            <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Dezactivează secțiuni</p>
              {sectiuniOrdine.map((id) => {
                const section = ALL_SECTIONS.find((s) => s.id === id);
                if (!section) return null;
                return (
                  <div key={id} className="flex items-center justify-between">
                    <span className="text-sm text-[#374151]">{section.label}</span>
                    <button type="button" onClick={() => toggleSection(id)}
                      className="text-xs text-[#DC2626] hover:underline">
                      Dezactivează
                    </button>
                  </div>
                );
              })}
            </div>

            <Button className="bg-[#1877F2] hover:bg-[#1565D8] text-white gap-2 w-full sm:w-auto"
              disabled={isPending}
              onClick={() => save({ sectiuni_ordine: sectiuniOrdine })}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Salvează ordinea
            </Button>
          </div>
        )}

        {/* ── STATISTICI ── */}
        {activeTab === "statistici" && (
          <SmartPageStatsTab statieId={statieId} />
        )}
      </div>
    </div>
  );
}
