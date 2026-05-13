"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileText, MapPin, Clock, DollarSign, MessageSquare,
  Globe, Settings, Check, Loader2, Eye, EyeOff, Copy,
  ExternalLink, AlertTriangle, X, Power,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { slugify } from "@/lib/utils/slugify";
import {
  updateStatieAction,
  updateLogoAction,
  deleteLogoAction,
  checkSlugUnicAction,
  updateTarifeAction,
  updateSetariSmsAction,
  testSmsoAction,
  toggleStatieActivaAction,
} from "@/lib/actions/statii";
import { statieBaseSchema, locatieSchema, programSchema } from "@/lib/validations/statie";
import { ProgramEditor, type ProgramLucru } from "./program-editor";
import { LocationPicker } from "./location-picker";
import { LogoUploader } from "./logo-uploader";
import { TarifeEditor, type TarifeMap } from "./tarife-editor";
import { DeleteStatieDialog } from "./delete-statie-dialog";
import type { StatieExtinsa, SetariStatie } from "@/types/database.types";
import type { z } from "zod";

type BaseForm = z.infer<typeof statieBaseSchema>;
type LocatieFormType = z.infer<typeof locatieSchema>;
type ProgramFormType = z.infer<typeof programSchema>;

const TABS = [
  { id: "general", label: "Informații generale", icon: FileText },
  { id: "locatie", label: "Locație", icon: MapPin },
  { id: "program", label: "Program & Capacitate", icon: Clock },
  { id: "tarife", label: "Tarife", icon: DollarSign },
  { id: "sms", label: "Remindere SMS", icon: MessageSquare },
  { id: "booking", label: "Booking public", icon: Globe },
  { id: "avansat", label: "Avansat", icon: Settings },
] as const;

type TabId = (typeof TABS)[number]["id"];

const SMS_VARS = ["{{nume_client}}", "{{nr_inmatriculare}}", "{{data}}", "{{ora}}", "{{statie}}"];
const SMS_TEMPLATES_DEF = [
  { key: "template_itp_30_zile", label: "ITP expiră în 30 de zile" },
  { key: "template_itp_7_zile", label: "ITP expiră în 7 zile" },
  { key: "template_itp_1_zi", label: "ITP expiră mâine" },
  { key: "template_confirmare", label: "Confirmare programare" },
  { key: "template_reminder_zi", label: "Reminder ziua programării" },
];

function AutoSaveIndicator({ status }: { status: "idle" | "saving" | "saved" }) {
  if (status === "idle") return null;
  return (
    <span className="text-xs text-muted-foreground flex items-center gap-1">
      {status === "saving" ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Salvare...
        </>
      ) : (
        <>
          <Check className="h-3 w-3 text-green-500" />
          Salvat
        </>
      )}
    </span>
  );
}

function SmsCounter({ text }: { text: string }) {
  const chars = text.length;
  const sms = Math.ceil(chars / 160) || 1;
  const over = chars > 160;

  return (
    <p className={cn("text-xs mt-1 flex items-center gap-1.5", over ? "text-destructive" : "text-muted-foreground")}>
      <span>{chars} / 160 caractere ({sms} SMS)</span>
      {over && (
        <span className="text-amber-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> Va folosi {sms} SMS-uri
        </span>
      )}
    </p>
  );
}

interface StatieFormProps {
  statie: StatieExtinsa;
  setari: SetariStatie | null;
}

export function StatieForm({ statie: initialStatie, setari: initialSetari }: StatieFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [isPending, startTransition] = useTransition();
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [statie, setStatie] = useState(initialStatie);
  const [setari, setSetari] = useState(initialSetari);

  // Program state
  const [programLucru, setProgramLucru] = useState<ProgramLucru>(
    (statie.program_lucru as ProgramLucru | null) ?? {
      luni: { start: "08:00", end: "17:00" }, marti: { start: "08:00", end: "17:00" },
      miercuri: { start: "08:00", end: "17:00" }, joi: { start: "08:00", end: "17:00" },
      vineri: { start: "08:00", end: "17:00" }, sambata: null, duminica: null,
    }
  );
  const [durataSlot, setDurataSlot] = useState(statie.durata_slot_minute);
  const [nrLinii, setNrLinii] = useState(statie.nr_linii);

  // Tarife state
  const [tarife, setTarife] = useState<TarifeMap>(
    (setari?.tarife as TarifeMap | null) ?? {}
  );

  // SMS state
  const [smsActiv, setSmsActiv] = useState(false);
  const [smsToggles, setSmsToggles] = useState({
    reminder_30_zile: setari?.reminder_30_zile ?? true,
    reminder_7_zile: setari?.reminder_7_zile ?? true,
    reminder_1_zi: setari?.reminder_1_zi ?? true,
    reminder_confirmare: setari?.reminder_confirmare ?? true,
    reminder_ziua_programarii: setari?.reminder_ziua_programarii ?? true,
  });
  const [smsTemplates, setSmsTemplates] = useState({
    template_itp_30_zile: setari?.template_itp_30_zile ?? "",
    template_itp_7_zile: setari?.template_itp_7_zile ?? "",
    template_itp_1_zi: setari?.template_itp_1_zi ?? "",
    template_confirmare: setari?.template_confirmare ?? "",
    template_reminder_zi: setari?.template_reminder_zi ?? "",
  });

  // Booking state
  const [bookingActiv, setBookingActiv] = useState(statie.booking_activ);
  const [bookingSlug, setBookingSlug] = useState(statie.slug);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");
  const [mesajIntampinare, setMesajIntampinare] = useState(statie.mesaj_intampinare ?? "");
  const [instructiuni, setInstructiuni] = useState(statie.instructiuni_client ?? "");
  const [afisazaTarife, setAfisazaTarife] = useState(statie.afiseaza_tarife);
  const [afisazaProgram, setAfisazaProgram] = useState(statie.afiseaza_program);

  // General form
  const baseForm = useForm<BaseForm>({
    resolver: zodResolver(statieBaseSchema),
    defaultValues: {
      nume: statie.nume, slug: statie.slug, telefon: statie.telefon ?? "",
      email: statie.email ?? "", website: statie.website ?? "",
      cui: statie.cui ?? "", nr_autorizatie_rar: statie.nr_autorizatie_rar ?? "",
    },
  });

  // Locatie form
  const locatieForm = useForm<LocatieFormType>({
    resolver: zodResolver(locatieSchema),
    defaultValues: {
      judet: statie.judet ?? "", localitate: statie.localitate ?? "",
      adresa: statie.adresa ?? "", cod_postal: statie.cod_postal ?? "",
      lat: statie.lat ?? undefined, lng: statie.lng ?? undefined,
    },
  });

  // Slug checker
  useEffect(() => {
    if (bookingSlug === statie.slug || bookingSlug.length < 3) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const t = setTimeout(async () => {
      const r = await checkSlugUnicAction(bookingSlug, statie.id);
      setSlugStatus(r.available ? "ok" : "taken");
    }, 500);
    return () => clearTimeout(t);
  }, [bookingSlug, statie.id, statie.slug]);

  // Auto-save helper
  const triggerAutoSave = useCallback(
    (fn: () => Promise<void>) => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(async () => {
        setAutoSaveStatus("saving");
        await fn();
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 2000);
      }, 1500);
    },
    []
  );

  // ── Salvări ────────────────────────────────────────────────────

  async function saveGeneral(data: BaseForm) {
    startTransition(async () => {
      const r = await updateStatieAction(statie.id, "base", data);
      if ("error" in r) toast.error(r.error);
      else toast.success("Informații salvate!");
    });
  }

  async function saveLocatie(data: LocatieFormType) {
    startTransition(async () => {
      const r = await updateStatieAction(statie.id, "locatie", data);
      if ("error" in r) toast.error(r.error);
      else toast.success("Locație salvată!");
    });
  }

  async function saveProgram() {
    startTransition(async () => {
      const r = await updateStatieAction(statie.id, "program", {
        program_lucru: programLucru,
        durata_slot_minute: durataSlot,
        nr_linii: nrLinii,
      });
      if ("error" in r) toast.error(r.error);
      else toast.success("Program salvat!");
    });
  }

  async function saveTarife() {
    startTransition(async () => {
      const r = await updateTarifeAction(statie.id, tarife);
      if ("error" in r) toast.error(r.error);
      else toast.success("Tarife salvate!");
    });
  }

  async function saveSms() {
    startTransition(async () => {
      const r = await updateSetariSmsAction(statie.id, {
        sms_activ: smsActiv,
        ...smsToggles,
        ...smsTemplates,
      });
      if ("error" in r) toast.error(r.error);
      else toast.success("Setări SMS salvate!");
    });
  }

  async function saveBooking() {
    if (slugStatus === "taken") {
      toast.error("Slug-ul este deja folosit");
      return;
    }
    startTransition(async () => {
      const r = await updateStatieAction(statie.id, "booking", {
        booking_activ: bookingActiv,
        slug: bookingSlug,
        mesaj_intampinare: mesajIntampinare,
        instructiuni_client: instructiuni,
        afiseaza_tarife: afisazaTarife,
        afiseaza_program: afisazaProgram,
      });
      if ("error" in r) toast.error(r.error);
      else toast.success("Booking actualizat!");
    });
  }

  async function handleLogoUpload(blob: Blob) {
    const fd = new FormData();
    fd.append("file", blob, "logo.png");
    const r = await updateLogoAction(statie.id, fd);
    if ("error" in r) throw new Error(r.error);
  }

  async function handleLogoDelete() {
    const r = await deleteLogoAction(statie.id);
    if ("error" in r) throw new Error(r.error);
  }


  function insertVar(key: string, varName: string) {
    const ta = document.getElementById(`template-${key}`) as HTMLTextAreaElement;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const current = smsTemplates[key as keyof typeof smsTemplates] ?? "";
    const newVal = current.slice(0, start) + varName + current.slice(end);
    setSmsTemplates((prev) => ({ ...prev, [key]: newVal }));
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + varName.length, start + varName.length);
    }, 0);
  }

  const tabContent: Record<TabId, React.ReactNode> = {
    // ── Tab 1: General ─────────────────────────────────────────
    general: (
      <form onSubmit={baseForm.handleSubmit(saveGeneral)} className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base">Informatii generale</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Date principale ale statiei</p>
          </div>
          <AutoSaveIndicator status={autoSaveStatus} />
        </div>

        {/* Stare */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Stare</p>
          <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                statie.activa ? "bg-green-50" : "bg-muted"
              )}>
                <Power className={cn("h-4 w-4", statie.activa ? "text-green-600" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">Statie activa</p>
                <p className="text-xs text-muted-foreground mt-0.5">Vizibila in booking public</p>
              </div>
            </div>
            <Switch
              checked={statie.activa}
              onCheckedChange={async (v) => {
                await toggleStatieActivaAction(statie.id, v);
                setStatie((s) => ({ ...s, activa: v }));
              }}
            />
          </div>
        </div>

        {/* Identitate */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Identitate</p>
          <div className="space-y-2">
            <Label>Logo statie</Label>
            <div className="flex justify-start">
              <LogoUploader
                currentUrl={statie.logo_url}
                onUpload={handleLogoUpload}
                onDelete={handleLogoDelete}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Nume statie <span className="text-destructive">*</span></Label>
            <Input {...baseForm.register("nume")} />
            {baseForm.formState.errors.nume && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {baseForm.formState.errors.nume.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Slug URL <span className="text-destructive">*</span></Label>
            <Input {...baseForm.register("slug")} />
            <p className="text-xs text-muted-foreground">Folosit in link-ul de booking public</p>
            {baseForm.formState.errors.slug && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {baseForm.formState.errors.slug.message}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-[#E5E7EB]" />

        {/* Contact */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Contact</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Telefon <span className="text-destructive">*</span></Label>
              <Input {...baseForm.register("telefon")} placeholder="0712 345 678" />
              {baseForm.formState.errors.telefon && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {baseForm.formState.errors.telefon.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input {...baseForm.register("email")} type="email" placeholder="contact@statie.ro" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Website</Label>
            <Input {...baseForm.register("website")} placeholder="https://statie.ro" />
          </div>
        </div>

        <div className="border-t border-[#E5E7EB]" />

        {/* Date fiscale */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
            Date fiscale <span className="normal-case font-normal">(optional)</span>
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>CUI</Label>
              <Input {...baseForm.register("cui")} placeholder="RO12345678" />
              {baseForm.formState.errors.cui && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {baseForm.formState.errors.cui.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Nr. autorizatie RAR</Label>
              <Input {...baseForm.register("nr_autorizatie_rar")} placeholder="ITP-0000/2024" />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salveaza modificarile
        </Button>
      </form>
    ),

    // ── Tab 2: Locatie ──────────────────────────────────────────
    locatie: (
      <form onSubmit={locatieForm.handleSubmit(saveLocatie)} className="space-y-5">
        <h3 className="font-semibold mb-2">Locație</h3>
        <LocationPicker
          judet={locatieForm.watch("judet")}
          localitate={locatieForm.watch("localitate")}
          adresa={locatieForm.watch("adresa")}
          codPostal={locatieForm.watch("cod_postal") ?? ""}
          lat={statie.lat ?? undefined}
          lng={statie.lng ?? undefined}
          onJudetChange={(v) => locatieForm.setValue("judet", v, { shouldValidate: true })}
          onLocalitateChange={(v) => locatieForm.setValue("localitate", v)}
          onAdresaChange={(v) => locatieForm.setValue("adresa", v)}
          onCodPostalChange={(v) => locatieForm.setValue("cod_postal", v)}
          onCoordsChange={(lat, lng) => {
            locatieForm.setValue("lat", lat);
            locatieForm.setValue("lng", lng);
          }}
          errors={{
            judet: locatieForm.formState.errors.judet?.message,
            localitate: locatieForm.formState.errors.localitate?.message,
            adresa: locatieForm.formState.errors.adresa?.message,
          }}
        />
        <Button type="submit" disabled={isPending} className="w-full mt-4">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvează locația
        </Button>
      </form>
    ),

    // ── Tab 3: Program ──────────────────────────────────────────
    program: (
      <div className="space-y-8">
        <div>
          <h3 className="font-semibold text-base">Program si capacitate</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Orarul de lucru si numarul de linii de inspectie</p>
        </div>
        <ProgramEditor
          value={programLucru}
          onChange={setProgramLucru}
          durataSlot={durataSlot}
          nrLinii={nrLinii}
          onDurataChange={setDurataSlot}
          onNrLiniiChange={setNrLinii}
        />
        <Button onClick={saveProgram} disabled={isPending} className="w-full">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salveaza programul
        </Button>
      </div>
    ),

    // ── Tab 4: Tarife ───────────────────────────────────────────
    tarife: (
      <div className="space-y-8">
        <div>
          <h3 className="font-semibold text-base">Tarife per tip vehicul</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Preturile apar in pagina de booking public daca optiunea este activata</p>
        </div>
        <TarifeEditor value={tarife} onChange={setTarife} />
        <Button onClick={saveTarife} disabled={isPending} className="w-full">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salveaza tarifele
        </Button>
      </div>
    ),

    // ── Tab 5: SMS ──────────────────────────────────────────────
    sms: (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base">Remindere SMS</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Notificari automate catre clienti via SMSO.ro</p>
          </div>
          <Switch
            checked={smsActiv}
            onCheckedChange={setSmsActiv}
          />
        </div>

        {smsActiv && (
          <>
            {/* Info platformă */}
            <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-sm text-[#1877F2]">
              SMS-urile sunt trimise prin platforma ITP CRM. Quota disponibilă
              depinde de planul tău de abonament și se poate urmări în bara din
              meniul lateral.
            </div>

            {/* Toggleuri remindere ITP */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Reminder ITP expirat</p>
              {[
                { key: "reminder_30_zile", label: "Cu 30 de zile înainte" },
                { key: "reminder_7_zile", label: "Cu 7 zile înainte" },
                { key: "reminder_1_zi", label: "Cu 1 zi înainte" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="text-sm font-normal cursor-pointer">{label}</Label>
                  <Switch
                    checked={smsToggles[key as keyof typeof smsToggles]}
                    onCheckedChange={(v) =>
                      setSmsToggles((prev) => ({ ...prev, [key]: v }))
                    }
                  />
                </div>
              ))}
            </div>

            {/* Toggleuri programare */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Reminder programare</p>
              {[
                { key: "reminder_confirmare", label: "Confirmare programare (imediat)" },
                { key: "reminder_ziua_programarii", label: "Ziua programării (cu 2h înainte)" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="text-sm font-normal cursor-pointer">{label}</Label>
                  <Switch
                    checked={smsToggles[key as keyof typeof smsToggles]}
                    onCheckedChange={(v) =>
                      setSmsToggles((prev) => ({ ...prev, [key]: v }))
                    }
                  />
                </div>
              ))}
            </div>

            {/* Template-uri */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Mesaje SMS</p>
            </div>
            <Accordion multiple className="space-y-2">
              {SMS_TEMPLATES_DEF.map(({ key, label }) => (
                <AccordionItem key={key} value={key} className="border border-[#E5E7EB] rounded-lg px-4 bg-white">
                  <AccordionTrigger className="text-sm font-medium">
                    {label}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pb-2">
                      <div className="flex flex-wrap gap-1">
                        {SMS_VARS.map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => insertVar(key, v)}
                            className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono hover:bg-primary/10 hover:text-primary"
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                      <Textarea
                        id={`template-${key}`}
                        value={smsTemplates[key as keyof typeof smsTemplates]}
                        onChange={(e) =>
                          setSmsTemplates((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        rows={3}
                        className="text-sm resize-none"
                      />
                      <SmsCounter text={smsTemplates[key as keyof typeof smsTemplates] ?? ""} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </>
        )}

        <Button onClick={saveSms} disabled={isPending} className="w-full">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salveaza setarile SMS
        </Button>
      </div>
    ),

    // ── Tab 6: Booking ──────────────────────────────────────────
    booking: (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base">Booking public</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Permite clientilor sa se programeze online</p>
          </div>
          <Switch checked={bookingActiv} onCheckedChange={setBookingActiv} />
        </div>

        {bookingActiv && (
          <>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Link public</p>
            <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3">
              <p className="text-sm flex-1 font-mono truncate">
                itpcrm.ro/booking/<span className="text-primary">{bookingSlug}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/booking/${bookingSlug}`
                  );
                  toast.success("Link copiat!");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-4 w-4" />
              </button>
              <a
                href={`/booking/${bookingSlug}`}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            </div>

            <div className="space-y-1.5">
              <Label>Slug URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={bookingSlug}
                  onChange={(e) => setBookingSlug(e.target.value.toLowerCase())}
                  className="flex-1"
                />
                {slugStatus === "checking" && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                )}
                {slugStatus === "ok" && (
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                )}
                {slugStatus === "taken" && (
                  <span className="text-xs text-destructive shrink-0">Ocupat</span>
                )}
              </div>
            </div>

            <div className="border-t border-[#E5E7EB]" />
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Personalizare</p>
            <div className="space-y-1.5">
              <Label>Mesaj de intampinare</Label>
              <Textarea
                value={mesajIntampinare}
                onChange={(e) => setMesajIntampinare(e.target.value)}
                maxLength={200}
                rows={2}
                placeholder="Bine ați venit la stația noastră ITP..."
              />
              <p className="text-xs text-muted-foreground">{mesajIntampinare.length}/200</p>
            </div>

            <div className="space-y-1.5">
              <Label>Instructiuni pentru client</Label>
              <Textarea
                value={instructiuni}
                onChange={(e) => setInstructiuni(e.target.value)}
                rows={3}
                placeholder="Va rugam sa ajungeti cu 5 minute inainte..."
              />
            </div>
            </div>

            <div className="border-t border-[#E5E7EB]" />

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Optiuni afisare</p>
              {[
                { label: "Afiseaza tarife", state: afisazaTarife, set: setAfisazaTarife },
                { label: "Afiseaza program de lucru", state: afisazaProgram, set: setAfisazaProgram },
              ].map(({ label, state, set }) => (
                <div key={label} className="flex items-center justify-between">
                  <Label className="text-sm font-normal">{label}</Label>
                  <Switch checked={state} onCheckedChange={set} />
                </div>
              ))}
            </div>
          </>
        )}

        <Button onClick={saveBooking} disabled={isPending} className="w-full">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salveaza setarile booking
        </Button>
      </div>
    ),

    // ── Tab 7: Avansat ──────────────────────────────────────────
    avansat: (
      <div className="space-y-8">
        <div>
          <h3 className="font-semibold text-base">Setari avansate</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Actiuni care afecteaza starea statiei</p>
        </div>

        <Card className="border-destructive/30">
          <CardContent className="p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-destructive/70">Zona periculoasa</p>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Dezactiveaza statia</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Statia nu va mai fi vizibila in booking public
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const r = await toggleStatieActivaAction(statie.id, false);
                  if ("success" in r) {
                    setStatie((s) => ({ ...s, activa: false }));
                    toast.success("Statie dezactivata");
                  }
                }}
              >
                Dezactiveaza
              </Button>
            </div>

            <div className="border-t border-[#E5E7EB] pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-destructive">Sterge statia</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Actiune ireversibila. Toate datele vor fi sterse.
                </p>
              </div>
              <DeleteStatieDialog statieId={statie.id} statieNume={statie.nume} />
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  };

  return (
    <div className="flex gap-6 xl:gap-8">
      {/* Sidebar tabs */}
      <aside className="w-56 shrink-0 hidden md:block">
        <nav className="space-y-0.5 sticky top-20 rounded-xl border border-[#E5E7EB] bg-white p-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
                  isActive
                    ? "bg-[#EFF6FF] text-[#1877F2]"
                    : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111318]"
                )}
              >
                <div className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md shrink-0 transition-colors",
                  isActive ? "bg-[#1877F2]/10" : "bg-[#F3F4F6]"
                )}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile tabs */}
      <div className="md:hidden w-full mb-4">
        <Accordion>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <AccordionItem key={tab.id} value={tab.id}>
                <AccordionTrigger
                  onClick={() => setActiveTab(tab.id)}
                  className="text-sm font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-2">{tabContent[tab.id]}</div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* Tab content (desktop) */}
      <div className="flex-1 min-w-0 hidden md:block">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          {tabContent[activeTab]}
        </div>
      </div>
    </div>
  );
}
