"use client";

import { useState, useEffect, useTransition, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { esteTelefonValid } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2, Check, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { slugify } from "@/lib/utils/slugify";
import { checkSlugUnicAction, createStatieAction } from "@/lib/actions/statii";
import { ProgramEditor, type ProgramLucru } from "./program-editor";
import { LocationPicker } from "./location-picker";
import { LogoUploader } from "./logo-uploader";

const DRAFT_KEY = "statie_wizard_draft";

const PASII = [
  { nr: 1, titlu: "Informații de bază", subtitlu: "Datele principale ale stației" },
  { nr: 2, titlu: "Locație", subtitlu: "Unde se află stația ta" },
  { nr: 3, titlu: "Program & Capacitate", subtitlu: "Orarul și capacitatea de inspecție" },
  { nr: 4, titlu: "Logo & Finalizare", subtitlu: "Personalizare și confirmare" },
];

const DEFAULT_PROGRAM: ProgramLucru = {
  luni: { start: "08:00", end: "17:00" },
  marti: { start: "08:00", end: "17:00" },
  miercuri: { start: "08:00", end: "17:00" },
  joi: { start: "08:00", end: "17:00" },
  vineri: { start: "08:00", end: "17:00" },
  sambata: null,
  duminica: null,
};

interface WizardData {
  // Pas 1
  nume: string;
  slug: string;
  telefon: string;
  email: string;
  website: string;
  cui: string;
  nr_autorizatie_rar: string;
  // Pas 2
  judet: string;
  localitate: string;
  adresa: string;
  cod_postal: string;
  lat?: number;
  lng?: number;
  // Pas 3
  program_lucru: ProgramLucru;
  durata_slot_minute: number;
  nr_linii: number;
  // Pas 4
  logo_url?: string;
  logoBlob?: Blob;
}

const pas1Schema = z.object({
  nume: z.string().min(3, "Minim 3 caractere"),
  slug: z
    .string()
    .min(3, "Minim 3 caractere")
    .regex(/^[a-z0-9-]+$/, "Doar litere mici, cifre și cratime"),
  telefon: z
    .string()
    .refine(esteTelefonValid, "Număr invalid (ex: 0712345678 sau +39 333 1234567)")
    .or(z.literal(""))
    .optional(),
  email: z.string().email("Email invalid").or(z.literal("")).optional(),
  website: z.string().url("URL invalid").or(z.literal("")).optional(),
  cui: z
    .string()
    .regex(/^(RO)?[0-9]{6,10}$/, "CUI invalid")
    .or(z.literal(""))
    .optional(),
  nr_autorizatie_rar: z.string().optional(),
});

const pas2Schema = z.object({
  judet: z.string().min(2, "Selectează județul"),
  localitate: z.string().min(2, "Completează localitatea"),
  adresa: z.string().min(5, "Completează adresa"),
  cod_postal: z.string().regex(/^[0-9]{6}$/).or(z.literal("")).optional(),
});

type Pas1Form = z.infer<typeof pas1Schema>;
type Pas2Form = z.infer<typeof pas2Schema>;

function SlugPreview({
  slug,
  onEdit,
}: {
  slug: string;
  onEdit: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");

  useEffect(() => {
    if (!slug || slug.length < 3) return;
    setStatus("checking");
    const t = setTimeout(async () => {
      const r = await checkSlugUnicAction(slug);
      setStatus(r.available ? "ok" : "taken");
    }, 500);
    return () => clearTimeout(t);
  }, [slug]);

  return (
    <div className="mt-1.5 flex items-center gap-2">
      <p className="text-xs text-muted-foreground flex-1 truncate">
        Link booking:{" "}
        <span className="font-mono">itpcrm.ro/booking/{slug || "..."}</span>
      </p>
      {status === "checking" && (
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      )}
      {status === "ok" && (
        <span className="text-xs text-green-600 flex items-center gap-0.5">
          <Check className="h-3 w-3" /> Disponibil
        </span>
      )}
      {status === "taken" && (
        <span className="text-xs text-destructive flex items-center gap-0.5">
          <X className="h-3 w-3" /> Ocupat
        </span>
      )}
      <button
        type="button"
        onClick={onEdit}
        className="text-xs text-primary underline-offset-2 hover:underline"
      >
        Editează
      </button>
    </div>
  );
}

export function StatieWizard() {
  const router = useRouter();
  const [pas, setPas] = useState(1);
  const [direction, setDirection] = useState(1);
  const [slugManual, setSlugManual] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [hasDraft, setHasDraft] = useState(false);

  const [data, setData] = useState<WizardData>({
    nume: "", slug: "", telefon: "", email: "", website: "",
    cui: "", nr_autorizatie_rar: "", judet: "", localitate: "",
    adresa: "", cod_postal: "", program_lucru: DEFAULT_PROGRAM,
    durata_slot_minute: 30, nr_linii: 1,
  });

  const pas1 = useForm<Pas1Form>({
    resolver: zodResolver(pas1Schema),
    defaultValues: {
      nume: data.nume, slug: data.slug, telefon: data.telefon,
      email: data.email, website: data.website, cui: data.cui,
      nr_autorizatie_rar: data.nr_autorizatie_rar,
    },
  });

  const pas2 = useForm<Pas2Form>({
    resolver: zodResolver(pas2Schema),
    defaultValues: {
      judet: data.judet, localitate: data.localitate,
      adresa: data.adresa, cod_postal: data.cod_postal,
    },
  });

  // Încarcă draft din localStorage
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        setHasDraft(true);
        if (parsed) {
          setData((prev) => ({ ...prev, ...parsed }));
          pas1.reset({
            nume: parsed.nume ?? "", slug: parsed.slug ?? "",
            telefon: parsed.telefon ?? "", email: parsed.email ?? "",
            website: parsed.website ?? "", cui: parsed.cui ?? "",
            nr_autorizatie_rar: parsed.nr_autorizatie_rar ?? "",
          });
          pas2.reset({
            judet: parsed.judet ?? "", localitate: parsed.localitate ?? "",
            adresa: parsed.adresa ?? "", cod_postal: parsed.cod_postal ?? "",
          });
        }
      }
    } catch {
      // ignore
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Salvează draft în localStorage la orice schimbare
  const saveDraft = useCallback(
    (updates: Partial<WizardData>) => {
      const next = { ...data, ...updates };
      setData(next);
      try {
        const { logoBlob: _b, ...toSave } = next;
        localStorage.setItem(DRAFT_KEY, JSON.stringify(toSave));
      } catch {
        // ignore
      }
    },
    [data]
  );

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  }

  // Sincronizare slug din nume
  const watchNume = pas1.watch("nume");
  useEffect(() => {
    if (!slugManual && watchNume) {
      const generated = slugify(watchNume);
      pas1.setValue("slug", generated);
    }
  }, [watchNume, slugManual, pas1]);

  async function mergiInainte() {
    if (pas === 1) {
      const valid = await pas1.trigger();
      if (!valid) {
        toast.error("Completează câmpurile obligatorii marcate cu *");
        return;
      }
      saveDraft(pas1.getValues());
    } else if (pas === 2) {
      const valid = await pas2.trigger();
      if (!valid) {
        toast.error("Completează câmpurile obligatorii marcate cu *");
        return;
      }
      saveDraft(pas2.getValues());
    }
    setDirection(1);
    setPas((p) => p + 1);
  }

  function mergiInapoi() {
    setDirection(-1);
    setPas((p) => p - 1);
  }

  async function handleLogoUpload(blob: Blob) {
    saveDraft({ logoBlob: blob });
  }

  async function salveaza() {
    const p1 = pas1.getValues();
    const p2 = pas2.getValues();

    startTransition(async () => {
      // Upload logo dacă există
      let logoUrl: string | undefined;
      if (data.logoBlob) {
        const fd = new FormData();
        fd.append("file", data.logoBlob, "logo.png");
        const res = await fetch("/api/upload-logo-temp", { method: "POST", body: fd });
        if (res.ok) {
          const json = await res.json();
          logoUrl = json.url;
        }
      }

      const result = await createStatieAction({
        ...p1,
        telefon: p1.telefon ?? "",
        ...p2,
        lat: data.lat,
        lng: data.lng,
        program_lucru: data.program_lucru,
        durata_slot_minute: data.durata_slot_minute,
        nr_linii: data.nr_linii,
        logo_url: logoUrl,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      clearDraft();
      toast.success("Stație adăugată cu succes!");
      router.push(`/setari/statii/${result.id}`);
    });
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  const p1vals = pas1.getValues();
  const p2vals = pas2.getValues();

  return (
    <div className="mx-auto max-w-2xl">
      {/* Draft banner */}
      {hasDraft && pas === 1 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm">
          <span className="text-amber-800">Ai un draft nefinalizat. Continuă?</span>
          <button
            type="button"
            onClick={clearDraft}
            className="text-amber-600 underline-offset-2 hover:underline text-xs"
          >
            Discardă
          </button>
        </div>
      )}

      {/* Step indicator */}
      <div className="mb-10 flex items-start">
        {PASII.map((p, i) => (
          <Fragment key={p.nr}>
            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-200 bg-background",
                pas > p.nr
                  ? "border-primary bg-primary text-primary-foreground"
                  : pas === p.nr
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground"
              )}>
                {pas > p.nr ? <Check className="h-3.5 w-3.5" /> : p.nr}
              </div>
              <p className={cn(
                "hidden text-center text-[11px] font-medium leading-tight sm:block max-w-[72px]",
                pas === p.nr ? "text-foreground" : "text-muted-foreground"
              )}>
                {p.titlu}
              </p>
            </div>
            {i < PASII.length - 1 && (
              <div className={cn(
                "mt-4 h-px flex-1 min-w-[20px] mx-2 transition-colors duration-300",
                pas > p.nr ? "bg-primary" : "bg-border"
              )} />
            )}
          </Fragment>
        ))}
      </div>

      {/* Header pas */}
      <div className="mb-6">
        <p className="text-xs font-medium text-primary uppercase tracking-wider">
          Pas {pas} din {PASII.length}
        </p>
        <h2 className="text-xl font-semibold mt-0.5">
          {PASII[pas - 1].titlu}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {PASII[pas - 1].subtitlu}
        </p>
      </div>

      {/* Conținut animat */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={pas}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {/* ─── PAS 1 ─── */}
          {pas === 1 && (
            <div className="space-y-6">
              {/* Identificare */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Identificare
                </p>
                <div className="space-y-1.5">
                  <Label>
                    Nume stație <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...pas1.register("nume")}
                    placeholder="Auto Test Cluj"
                  />
                  {pas1.formState.errors.nume && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {pas1.formState.errors.nume.message}
                    </p>
                  )}
                  <SlugPreview
                    slug={pas1.watch("slug")}
                    onEdit={() => setSlugManual(true)}
                  />
                </div>
                {slugManual && (
                  <div className="space-y-1.5">
                    <Label>Slug URL</Label>
                    <Input
                      {...pas1.register("slug")}
                      placeholder="auto-test-cluj"
                    />
                    {pas1.formState.errors.slug && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {pas1.formState.errors.slug.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-border" />

              {/* Contact */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Date de contact
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Telefon</Label>
                    <Input
                      {...pas1.register("telefon")}
                      placeholder="0722 123 456 sau +39 333 1234567"
                    />
                    {pas1.formState.errors.telefon && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {pas1.formState.errors.telefon.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input
                      {...pas1.register("email")}
                      type="email"
                      placeholder="contact@statie.ro"
                    />
                    {pas1.formState.errors.email && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {pas1.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Website</Label>
                  <Input
                    {...pas1.register("website")}
                    placeholder="https://statie.ro"
                  />
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Date fiscale */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Date fiscale{" "}
                  <span className="normal-case font-normal">(optional)</span>
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>CUI</Label>
                    <Input
                      {...pas1.register("cui")}
                      placeholder="RO12345678"
                    />
                    {pas1.formState.errors.cui && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {pas1.formState.errors.cui.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nr. autorizatie RAR</Label>
                    <Input
                      {...pas1.register("nr_autorizatie_rar")}
                      placeholder="ITP-0000/2024"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── PAS 2 ─── */}
          {pas === 2 && (
            <LocationPicker
              judet={pas2.watch("judet")}
              localitate={pas2.watch("localitate")}
              adresa={pas2.watch("adresa")}
              codPostal={pas2.watch("cod_postal") ?? ""}
              lat={data.lat}
              lng={data.lng}
              onJudetChange={(v) => pas2.setValue("judet", v, { shouldValidate: true })}
              onLocalitateChange={(v) => pas2.setValue("localitate", v)}
              onAdresaChange={(v) => pas2.setValue("adresa", v)}
              onCodPostalChange={(v) => pas2.setValue("cod_postal", v)}
              onCoordsChange={(lat, lng) => saveDraft({ lat, lng })}
              errors={{
                judet: pas2.formState.errors.judet?.message,
                localitate: pas2.formState.errors.localitate?.message,
                adresa: pas2.formState.errors.adresa?.message,
                cod_postal: pas2.formState.errors.cod_postal?.message,
              }}
            />
          )}

          {/* ─── PAS 3 ─── */}
          {pas === 3 && (
            <ProgramEditor
              value={data.program_lucru}
              onChange={(v) => saveDraft({ program_lucru: v })}
              durataSlot={data.durata_slot_minute}
              nrLinii={data.nr_linii}
              onDurataChange={(v) => saveDraft({ durata_slot_minute: v })}
              onNrLiniiChange={(v) => saveDraft({ nr_linii: v })}
            />
          )}

          {/* ─── PAS 4 ─── */}
          {pas === 4 && (
            <div className="space-y-8">
              <div className="flex flex-col items-center">
                <LogoUploader
                  currentUrl={undefined}
                  onUpload={handleLogoUpload}
                />
              </div>

              {/* Rezumat */}
              <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3">
                <h3 className="font-semibold text-sm">Rezumat configurație</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Stație</dt>
                    <dd className="font-medium">{p1vals.nume}</dd>
                  </div>
                  {(p2vals.localitate || p2vals.judet) && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Adresă</dt>
                      <dd className="font-medium text-right max-w-[60%]">
                        {[p2vals.adresa, p2vals.localitate, p2vals.judet]
                          .filter(Boolean)
                          .join(", ")}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Capacitate</dt>
                    <dd className="font-medium">
                      {data.nr_linii} {data.nr_linii === 1 ? "linie" : "linii"} × {data.durata_slot_minute} min
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Link booking</dt>
                    <dd className="font-mono text-xs">
                      /booking/{p1vals.slug}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer navigare */}
      <div className="mt-8 flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={mergiInapoi}
          disabled={pas === 1}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Înapoi
        </Button>

        {pas < 4 ? (
          <Button type="button" onClick={mergiInainte}>
            Continuă
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={salveaza}
            disabled={isPending}
            className="min-w-36"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se salvează...
              </>
            ) : (
              "Salvează stația"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
