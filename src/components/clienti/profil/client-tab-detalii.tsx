"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { clientSchema, type ClientForm } from "@/lib/validations/client";
import { updateClientAction } from "@/lib/actions/clienti";

interface ClientDetaliiData {
  id: string;
  nume: string;
  prenume?: string | null;
  telefon: string;
  email?: string | null;
  cnp?: string | null;
  adresa?: string | null;
  sms_optin?: boolean;
  created_at: string;
}

interface ClientTabDetaliiProps {
  client: ClientDetaliiData;
}

export function ClientTabDetalii({ client }: ClientTabDetaliiProps) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nume: client.nume,
      prenume: client.prenume ?? "",
      telefon: client.telefon,
      email: client.email ?? "",
      cnp: client.cnp ?? "",
      adresa: client.adresa ?? "",
      sms_optin: client.sms_optin ?? true,
    },
  });

  async function onSubmit(data: ClientForm) {
    const result = await updateClientAction(client.id, data);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Modificări salvate");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
          Informații principale
        </p>

        <div className="space-y-1.5">
          <Label className="text-[#374151]">
            Nume <span className="text-red-500">*</span>
          </Label>
          <Input {...register("nume")} className="border-[#E5E7EB]" />
          {errors.nume && (
            <p className="text-xs text-red-500">{errors.nume.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[#374151]">Prenume</Label>
            <Input {...register("prenume")} className="border-[#E5E7EB]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#374151]">
              Telefon <span className="text-red-500">*</span>
            </Label>
            <Input {...register("telefon")} type="tel" className="border-[#E5E7EB]" />
            {errors.telefon && (
              <p className="text-xs text-red-500">{errors.telefon.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[#374151]">Email</Label>
          <Input {...register("email")} type="email" className="border-[#E5E7EB]" />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[#374151]">CNP</Label>
            <Input
              {...register("cnp")}
              className="border-[#E5E7EB] font-mono"
              placeholder="1900101123456"
            />
            {errors.cnp && (
              <p className="text-xs text-red-500">{errors.cnp.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#374151]">Adresă</Label>
            <Input
              {...register("adresa")}
              className="border-[#E5E7EB]"
              placeholder="Str. Exemplu nr. 1"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[#111318]">Remindere SMS</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Notificări automate pentru ITP
            </p>
          </div>
          <Controller
            control={control}
            name="sms_optin"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-[#9CA3AF]">
            Client din{" "}
            {new Date(client.created_at).toLocaleDateString("ro-RO", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="bg-[#1877F2] hover:bg-[#1565D8] text-white disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            Salvează modificările
          </Button>
        </div>
      </div>
    </form>
  );
}
