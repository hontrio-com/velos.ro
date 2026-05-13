"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Globe, Palette, Star, MessageCircle, Loader2, Plus, Trash2,
  Check, ExternalLink, Eye, EyeOff, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { upsertSmartPageAction } from "@/lib/actions/smart-page";
import type { SmartPageData, SmartServicii, ChatbotQA } from "@/lib/actions/smart-page";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "prezentare", label: "Prezentare", icon: Globe },
  { id: "aspect", label: "Aspect", icon: Palette },
  { id: "servicii", label: "Servicii", icon: Star },
  { id: "chatbot", label: "Chatbot", icon: MessageCircle },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface Props {
  statieId: string;
  statieSlug: string;
  statieNume: string;
  initialData: SmartPageData | null;
}

export function SmartPageEditor({ statieId, statieSlug, statieNume, initialData }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("prezentare");
  const [isPending, startTransition] = useTransition();

  const [activa, setActiva] = useState(initialData?.activa ?? false);
  const [culoare, setCuloare] = useState(initialData?.culoare_primara ?? "#1877F2");
  const [tagline, setTagline] = useState(initialData?.tagline ?? "");
  const [whatsapp, setWhatsapp] = useState(initialData?.whatsapp_nr ?? "");
  const [seoDes, setSeoDes] = useState(initialData?.seo_description ?? "");
  const [servicii, setServicii] = useState<SmartServicii[]>(initialData?.servicii ?? []);
  const [chatbotQa, setChatbotQa] = useState<ChatbotQA[]>(initialData?.chatbot_qa ?? []);

  const publicUrl = `/${statieSlug}`;

  async function save(partial: Partial<SmartPageData>) {
    startTransition(async () => {
      const r = await upsertSmartPageAction(statieId, partial);
      if ("error" in r) toast.error(r.error);
      else toast.success("Salvat!");
    });
  }

  function addServiciu() {
    setServicii((prev) => [...prev, { id: crypto.randomUUID(), nume: "", pret: undefined, durata: undefined, descriere: "" }]);
  }
  function updateServiciu(id: string, field: keyof SmartServicii, value: string | number | undefined) {
    setServicii((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  }
  function removeServiciu(id: string) {
    setServicii((prev) => prev.filter((s) => s.id !== id));
  }

  function addQA() {
    setChatbotQa((prev) => [...prev, { id: crypto.randomUUID(), intrebare: "", raspuns: "" }]);
  }
  function updateQA(id: string, field: keyof ChatbotQA, value: string) {
    setChatbotQa((prev) => prev.map((q) => q.id === id ? { ...q, [field]: value } : q));
  }
  function removeQA(id: string) {
    setChatbotQa((prev) => prev.filter((q) => q.id !== id));
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-[#E5E7EB]" style={{ scrollbarWidth: "none" }}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button key={id} type="button" onClick={() => setActiveTab(id)}
              className={[
                "relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors shrink-0",
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

      <div className="p-6">

        {/* ── TAB: PREZENTARE ── */}
        {activeTab === "prezentare" && (
          <div className="space-y-6 max-w-lg">
            <div>
              <h3 className="font-semibold text-[#111318]">Prezentare Smart Page</h3>
              <p className="text-sm text-[#6B7280] mt-0.5">Activează și personalizează pagina publică a stației</p>
            </div>

            {/* Activate toggle */}
            <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-4">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                  activa ? "bg-[#DCFCE7]" : "bg-[#F3F4F6]")}>
                  {activa ? <Eye className="h-4 w-4 text-[#16A34A]" /> : <EyeOff className="h-4 w-4 text-[#6B7280]" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111318]">Pagina este {activa ? "activă" : "inactivă"}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {activa ? `Vizibilă la velos.ro${publicUrl}` : "Vizitatorii văd pagina de booking standard"}
                  </p>
                </div>
              </div>
              <Switch checked={activa} onCheckedChange={(v) => {
                setActiva(v);
                save({ activa: v });
              }} />
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

            {/* SEO description */}
            <div className="space-y-2">
              <Label>Descriere SEO</Label>
              <Textarea
                value={seoDes}
                onChange={(e) => setSeoDes(e.target.value)}
                placeholder={`Programare ITP online la ${statieNume}. Rapid, simplu, fără așteptare.`}
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-[#9CA3AF]">{seoDes.length}/160 caractere · Apare în rezultatele Google</p>
            </div>

            <Button
              className="bg-[#1877F2] hover:bg-[#1565D8] text-white gap-2"
              disabled={isPending}
              onClick={() => save({ activa, seo_description: seoDes || null })}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Salvează
            </Button>
          </div>
        )}

        {/* ── TAB: ASPECT ── */}
        {activeTab === "aspect" && (
          <div className="space-y-6 max-w-lg">
            <div>
              <h3 className="font-semibold text-[#111318]">Aspect și brand</h3>
              <p className="text-sm text-[#6B7280] mt-0.5">Personalizează culorile și mesajul stației tale</p>
            </div>

            {/* Color picker */}
            <div className="space-y-2">
              <Label>Culoare accent</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={culoare} onChange={(e) => setCuloare(e.target.value)}
                  className="h-10 w-14 rounded-lg border border-[#E5E7EB] cursor-pointer p-1" />
                <input type="text" value={culoare} onChange={(e) => setCuloare(e.target.value)}
                  className="flex-1 text-sm rounded-lg border border-[#E5E7EB] px-3 py-2 font-mono outline-none focus:border-[#1877F2] text-[#111318]" />
                {/* Preset colors */}
                <div className="flex gap-1.5">
                  {["#1877F2", "#16A34A", "#7C3AED", "#DC2626", "#EA580C", "#0891B2"].map((c) => (
                    <button key={c} type="button" onClick={() => setCuloare(c)}
                      className="h-6 w-6 rounded-full border-2 transition-all hover:scale-110"
                      style={{ backgroundColor: c, borderColor: culoare === c ? "#111318" : "transparent" }}
                    />
                  ))}
                </div>
              </div>
              {/* Preview */}
              <div className="rounded-xl p-3 mt-2 flex items-center gap-3" style={{ backgroundColor: `${culoare}15` }}>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: culoare }}>
                  {statieNume.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111318]">Previzualizare culoare</p>
                  <p className="text-xs" style={{ color: culoare }}>Butonul principal și accentele</p>
                </div>
              </div>
            </div>

            {/* Tagline */}
            <div className="space-y-2">
              <Label>Tagline / Slogan</Label>
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Programare ITP online, rapidă și ușoară"
                maxLength={100}
              />
              <p className="text-xs text-[#9CA3AF]">Apare sub numele stației în hero</p>
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                WhatsApp
                <span className="text-xs text-[#9CA3AF] font-normal">(opțional)</span>
              </Label>
              <Input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+40712345678"
                type="tel"
              />
              <p className="text-xs text-[#9CA3AF]">Afișează buton verde WhatsApp în header și contact</p>
            </div>

            <Button
              className="bg-[#1877F2] hover:bg-[#1565D8] text-white gap-2"
              disabled={isPending}
              onClick={() => save({
                culoare_primara: culoare,
                tagline: tagline || null,
                whatsapp_nr: whatsapp || null,
              })}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Salvează aspectul
            </Button>
          </div>
        )}

        {/* ── TAB: SERVICII ── */}
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

            {servicii.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#E5E7EB] p-8 text-center">
                <Star className="h-8 w-8 text-[#D1D5DB] mx-auto mb-2" />
                <p className="text-sm text-[#6B7280]">Niciun serviciu adăugat încă</p>
                <button type="button" onClick={addServiciu}
                  className="mt-2 text-sm text-[#1877F2] hover:underline font-medium">
                  Adaugă primul serviciu
                </button>
              </div>
            )}

            <div className="space-y-3">
              {servicii.map((s, i) => (
                <div key={s.id} className="rounded-xl border border-[#E5E7EB] p-4 bg-[#F9FAFB] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Serviciu #{i + 1}</span>
                    <button type="button" onClick={() => removeServiciu(s.id)}
                      className="text-[#DC2626] hover:text-[#B91C1C] transition-colors">
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

            {servicii.length > 0 && (
              <Button
                className="bg-[#1877F2] hover:bg-[#1565D8] text-white gap-2"
                disabled={isPending}
                onClick={() => save({ servicii })}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Salvează serviciile
              </Button>
            )}
          </div>
        )}

        {/* ── TAB: CHATBOT ── */}
        {activeTab === "chatbot" && (
          <div className="space-y-5 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#111318]">Chatbot cu răspunsuri preset</h3>
                <p className="text-sm text-[#6B7280] mt-0.5">Clientii pot pune întrebări și primesc răspunsuri instant</p>
              </div>
              <Button size="sm" variant="outline" onClick={addQA} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />Adaugă Q&A
              </Button>
            </div>

            <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-[#1877F2] shrink-0 mt-0.5" />
              <p className="text-xs text-[#1877F2]">
                Chatbot-ul apare ca un buton flotant pe pagina publică. Clienții aleg o întrebare și primesc răspunsul tău prestabilit instant.
              </p>
            </div>

            {chatbotQa.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#E5E7EB] p-8 text-center">
                <MessageCircle className="h-8 w-8 text-[#D1D5DB] mx-auto mb-2" />
                <p className="text-sm text-[#6B7280]">Nicio întrebare adăugată</p>
                <button type="button" onClick={addQA}
                  className="mt-2 text-sm text-[#1877F2] hover:underline font-medium">
                  Adaugă prima întrebare
                </button>
              </div>
            )}

            <div className="space-y-3">
              {chatbotQa.map((q, i) => (
                <div key={q.id} className="rounded-xl border border-[#E5E7EB] p-4 bg-[#F9FAFB] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Q&A #{i + 1}</span>
                    <button type="button" onClick={() => removeQA(q.id)}
                      className="text-[#DC2626] hover:text-[#B91C1C] transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Întrebare</Label>
                    <Input value={q.intrebare} onChange={(e) => updateQA(q.id, "intrebare", e.target.value)} placeholder="ex: Care este prețul pentru ITP auto?" className="bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Răspuns</Label>
                    <Textarea value={q.raspuns} onChange={(e) => updateQA(q.id, "raspuns", e.target.value)} placeholder="ex: Prețul pentru ITP auto este 200 lei, include toate taxele." rows={2} className="bg-white resize-none text-sm" />
                  </div>
                </div>
              ))}
            </div>

            {chatbotQa.length > 0 && (
              <Button
                className="bg-[#1877F2] hover:bg-[#1565D8] text-white gap-2"
                disabled={isPending}
                onClick={() => save({ chatbot_qa: chatbotQa })}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Salvează chatbot-ul
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
