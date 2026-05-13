"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { differenceInDays, parseISO, format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  Car,
  Plus,
  AlertTriangle,
  ShieldCheck,
  Clock,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { vehiculSchema, type VehiculForm } from "@/lib/validations/vehicul";
import { createVehiculAction } from "@/lib/actions/vehicule";
import { cn } from "@/lib/utils";

interface Vehicul {
  id: string;
  nr_inmatriculare: string;
  marca: string | null;
  model: string | null;
  an_fabricatie: number | null;
  culoare: string | null;
  tip_vehicul: string | null;
  combustibil: string | null;
  expirare_itp: string | null;
  expirare_rca: string | null;
  expirare_rovinieta: string | null;
  serie_sasiu: string | null;
  observatii: string | null;
  created_at: string;
}

interface ClientTabVehiculeProps {
  clientId: string;
  statieId: string;
  vehicule: Vehicul[];
}

function itpStatus(expirare: string | null): {
  label: string;
  className: string;
  icon: typeof ShieldCheck;
  days: number | null;
} {
  if (!expirare) {
    return {
      label: "Necunoscut",
      className: "bg-[#F3F4F6] text-[#9CA3AF]",
      icon: Car,
      days: null,
    };
  }
  const days = differenceInDays(parseISO(expirare), new Date());
  if (days < 0) {
    return {
      label: `Expirat (${Math.abs(days)}z)`,
      className: "bg-red-50 text-red-600",
      icon: AlertTriangle,
      days,
    };
  }
  if (days <= 30) {
    return {
      label: `Expiră în ${days}z`,
      className: "bg-orange-50 text-orange-600",
      icon: AlertTriangle,
      days,
    };
  }
  if (days <= 90) {
    return {
      label: `Expiră în ${days}z`,
      className: "bg-amber-50 text-amber-600",
      icon: Clock,
      days,
    };
  }
  return {
    label: format(parseISO(expirare), "dd.MM.yyyy"),
    className: "bg-[#DCFCE7] text-[#15803D]",
    icon: ShieldCheck,
    days,
  };
}

export function ClientTabVehicule({
  clientId,
  statieId,
  vehicule,
}: ClientTabVehiculeProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehiculForm>({
    resolver: zodResolver(vehiculSchema),
    defaultValues: {
      client_id: clientId,
      nr_inmatriculare: "",
      marca: "",
      model: "",
      tip_vehicul: "autoturism",
      combustibil: "",
      serie_sasiu: "",
      culoare: "",
      expirare_itp: "",
      expirare_rca: "",
      expirare_rovinieta: "",
      observatii: "",
    },
  });

  async function onSubmit(data: VehiculForm) {
    const result = await createVehiculAction({ ...data, client_id: clientId });
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Vehicul adăugat");
      setSheetOpen(false);
      reset();
      router.refresh();
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-[#111318]">
          {vehicule.length === 0
            ? "Niciun vehicul"
            : `${vehicule.length} vehicul${vehicule.length !== 1 ? "e" : ""}`}
        </p>
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-1.5 h-8 px-3 bg-[#1877F2] text-white text-xs font-medium rounded-lg hover:bg-[#1565D8] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Adaugă vehicul
        </button>
      </div>

      {vehicule.length === 0 ? (
        <div className="bg-white border border-[#F3F4F6] rounded-xl py-16 flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6] mb-3">
            <Car className="h-5 w-5 text-[#9CA3AF]" />
          </div>
          <p className="text-sm font-medium text-[#374151]">
            Niciun vehicul înregistrat
          </p>
          <p className="text-xs text-[#9CA3AF] mt-1 mb-4">
            Adaugă primul vehicul al acestui client
          </p>
          <button
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-1.5 h-8 px-3 bg-[#1877F2] text-white text-xs font-medium rounded-lg hover:bg-[#1565D8]"
          >
            <Plus className="h-3.5 w-3.5" />
            Adaugă vehicul
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {vehicule.map((v) => {
            const itp = itpStatus(v.expirare_itp);
            const ItpIcon = itp.icon;
            const isUrgent = itp.days !== null && itp.days <= 30;
            return (
              <Link
                key={v.id}
                href={`/vehicule/${v.id}`}
                className={cn(
                  "group bg-white border rounded-xl p-4 hover:shadow-sm transition-all flex flex-col gap-3",
                  isUrgent
                    ? "border-orange-200 bg-orange-50/30"
                    : "border-[#F3F4F6]"
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono font-semibold text-sm text-[#111318] tracking-wide">
                      {v.nr_inmatriculare}
                    </p>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      {[v.marca, v.model, v.an_fabricatie]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#D1D5DB] group-hover:text-[#6B7280] transition-colors mt-0.5" />
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
                      itp.className
                    )}
                  >
                    <ItpIcon className="h-3 w-3" />
                    ITP: {itp.label}
                  </span>
                  {v.combustibil && (
                    <span className="text-xs text-[#9CA3AF]">{v.combustibil}</span>
                  )}
                </div>

                {(v.expirare_rca || v.expirare_rovinieta) && (
                  <div className="flex items-center gap-3 pt-2 border-t border-[#F3F4F6]">
                    {v.expirare_rca && (
                      <span className="text-[11px] text-[#9CA3AF]">
                        RCA:{" "}
                        {format(parseISO(v.expirare_rca + "T12:00:00"), "dd.MM.yyyy")}
                      </span>
                    )}
                    {v.expirare_rovinieta && (
                      <span className="text-[11px] text-[#9CA3AF]">
                        Rovinietă:{" "}
                        {format(
                          parseISO(v.expirare_rovinieta + "T12:00:00"),
                          "dd.MM.yyyy"
                        )}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Add vehicle sheet */}
      <Sheet open={sheetOpen} onOpenChange={(v) => !v && setSheetOpen(false)}>
        <SheetContent side="right" className="w-full sm:max-w-[460px] p-0 flex flex-col">
          <SheetHeader className="px-5 py-4 border-b border-[#F3F4F6] shrink-0">
            <SheetTitle className="text-[#111318]">Vehicul nou</SheetTitle>
          </SheetHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              <input type="hidden" {...register("client_id")} value={clientId} />

              <div className="space-y-1.5">
                <Label className="text-[#374151]">
                  Nr. înmatriculare <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("nr_inmatriculare")}
                  className="border-[#E5E7EB] font-mono uppercase"
                  placeholder="B 123 ABC"
                />
                {errors.nr_inmatriculare && (
                  <p className="text-xs text-red-500">
                    {errors.nr_inmatriculare.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[#374151]">
                    Marcă <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("marca")}
                    className="border-[#E5E7EB]"
                    placeholder="Dacia"
                  />
                  {errors.marca && (
                    <p className="text-xs text-red-500">{errors.marca.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#374151]">
                    Model <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("model")}
                    className="border-[#E5E7EB]"
                    placeholder="Logan"
                  />
                  {errors.model && (
                    <p className="text-xs text-red-500">{errors.model.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[#374151]">An fabricație</Label>
                  <Input
                    {...register("an_fabricatie", { valueAsNumber: true })}
                    type="number"
                    min={1970}
                    max={new Date().getFullYear() + 1}
                    className="border-[#E5E7EB]"
                    placeholder="2020"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#374151]">Culoare</Label>
                  <Input
                    {...register("culoare")}
                    className="border-[#E5E7EB]"
                    placeholder="Alb"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#374151]">Serie șasiu (VIN)</Label>
                <Input
                  {...register("serie_sasiu")}
                  className="border-[#E5E7EB] font-mono text-xs uppercase"
                  placeholder="WBA3A5..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[#374151]">Expirare ITP</Label>
                  <Input
                    {...register("expirare_itp")}
                    type="date"
                    className="border-[#E5E7EB]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#374151]">Expirare RCA</Label>
                  <Input
                    {...register("expirare_rca")}
                    type="date"
                    className="border-[#E5E7EB]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#374151]">Rovinieta</Label>
                  <Input
                    {...register("expirare_rovinieta")}
                    type="date"
                    className="border-[#E5E7EB]"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-[#F3F4F6] px-5 py-4 shrink-0 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
                className="border-[#E5E7EB] text-[#374151]"
              >
                Anulează
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#1877F2] hover:bg-[#1565D8] text-white"
              >
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                )}
                Adaugă vehicul
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
