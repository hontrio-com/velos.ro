"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { clientSchema, type ClientForm } from "@/lib/validations/client";
import { createClientAction, updateClientAction } from "@/lib/actions/clienti";

export interface ClientData {
  id: string;
  nume: string;
  prenume?: string | null;
  telefon: string;
  email?: string | null;
  cnp?: string | null;
  adresa?: string | null;
  sms_optin?: boolean;
}

interface ClientDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (id: string) => void;
  initial?: ClientData | null;
}

export function ClientDrawer({ open, onClose, onSuccess, initial }: ClientDrawerProps) {
  const isEdit = !!initial;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nume: "", prenume: "", telefon: "", email: "",
      cnp: "", adresa: "", sms_optin: true,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        nume: initial?.nume ?? "",
        prenume: initial?.prenume ?? "",
        telefon: initial?.telefon ?? "",
        email: initial?.email ?? "",
        cnp: initial?.cnp ?? "",
        adresa: initial?.adresa ?? "",
        sms_optin: initial?.sms_optin ?? true,
      });
    }
  }, [open, initial, reset]);

  async function onSubmit(data: ClientForm) {
    const result = isEdit
      ? await updateClientAction(initial!.id, data)
      : await createClientAction(data);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Modificări salvate!" : "Client adăugat!");
    const id = isEdit ? initial!.id : (result as { id: string }).id;
    onSuccess(id);
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[460px] p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b border-[#F3F4F6] shrink-0">
          <SheetTitle className="text-[#111318]">
            {isEdit ? "Editează client" : "Client nou"}
          </SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

            {/* Informații principale */}
            <div className="space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Informații principale
              </p>

              <div className="space-y-1.5">
                <Label className="text-[#374151]">
                  Nume <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Popescu"
                  className="border-[#E5E7EB]"
                  {...register("nume")}
                />
                {errors.nume && (
                  <p className="text-xs text-red-500">{errors.nume.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[#374151]">Prenume</Label>
                  <Input
                    placeholder="Ion"
                    className="border-[#E5E7EB]"
                    {...register("prenume")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#374151]">
                    Telefon <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="0712345678"
                    type="tel"
                    className="border-[#E5E7EB]"
                    {...register("telefon")}
                  />
                  {errors.telefon && (
                    <p className="text-xs text-red-500">{errors.telefon.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#374151]">Email</Label>
                <Input
                  placeholder="ion@exemplu.ro"
                  type="email"
                  className="border-[#E5E7EB]"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Date suplimentare (accordion) */}
            <Accordion multiple={false}>
              <AccordionItem value="extra" className="border-[#F3F4F6]">
                <AccordionTrigger className="text-sm text-[#6B7280] py-2 hover:no-underline hover:text-[#374151]">
                  Date suplimentare
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-3">
                  <div className="space-y-1.5">
                    <Label className="text-[#374151]">CNP</Label>
                    <Input
                      placeholder="1900101123456"
                      className="border-[#E5E7EB] font-mono"
                      {...register("cnp")}
                    />
                    {errors.cnp && (
                      <p className="text-xs text-red-500">{errors.cnp.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#374151]">Adresă</Label>
                    <Input
                      placeholder="Str. Exemplu nr. 1, București"
                      className="border-[#E5E7EB]"
                      {...register("adresa")}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Preferințe */}
            <div className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Preferințe
              </p>
              <div className="flex items-center justify-between rounded-xl border border-[#F3F4F6] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[#111318]">Remindere SMS</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">
                    Clientul va primi notificări automate pentru ITP
                  </p>
                </div>
                <Controller
                  control={control}
                  name="sms_optin"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Footer sticky */}
          <div className="border-t border-[#F3F4F6] px-5 py-4 shrink-0 flex items-center justify-between gap-3">
            <p className="text-[11px] text-[#9CA3AF]">* câmpuri obligatorii</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-[#E5E7EB] text-[#374151]"
              >
                Anulează
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#1877F2] hover:bg-[#1565D8] text-white"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                {isEdit ? "Salvează" : "Adaugă clientul"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
