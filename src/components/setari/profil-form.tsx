"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, User, Phone, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateProfilAction } from "@/lib/actions/profil";

const schema = z.object({
  full_name: z.string().min(1, "Numele este obligatoriu"),
  phone: z.string().min(10, "Număr de telefon invalid").regex(/^[0-9+\s\-()]+$/, "Număr invalid"),
});

type FormData = z.infer<typeof schema>;

interface ProfilFormProps {
  initialData: {
    full_name: string;
    phone: string;
    email: string;
  };
}

export function ProfilForm({ initialData }: ProfilFormProps) {
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: initialData.full_name,
      phone: initialData.phone,
    },
  });

  async function onSubmit(data: FormData) {
    const result = await updateProfilAction(data);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Profil actualizat!");
    setSaved(true);
    reset(data);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-lg">
      <div className="bg-white border border-[#F3F4F6] rounded-xl p-6 space-y-5">
        {/* Email (read-only) */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-[#374151]">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <Input
              value={initialData.email}
              disabled
              className="pl-9 bg-[#F7F8FA] text-[#9CA3AF]"
            />
          </div>
          <p className="text-xs text-[#9CA3AF]">Emailul nu poate fi modificat</p>
        </div>

        {/* Full name */}
        <div className="space-y-1.5">
          <Label htmlFor="full_name" className="text-sm font-medium text-[#374151]">
            Nume complet
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <Input
              id="full_name"
              {...register("full_name")}
              placeholder="Ion Popescu"
              className="pl-9"
            />
          </div>
          {errors.full_name && (
            <p className="text-xs text-red-500">{errors.full_name.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm font-medium text-[#374151]">
            Număr de telefon
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <Input
              id="phone"
              {...register("phone")}
              placeholder="07XX XXX XXX"
              className="pl-9"
            />
          </div>
          {errors.phone ? (
            <p className="text-xs text-red-500">{errors.phone.message}</p>
          ) : (
            <p className="text-xs text-[#6B7280]">
              Folosit pentru SMS-urile de test ale integrării SMSO
            </p>
          )}
        </div>

        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || !isDirty}
          className="gap-2 bg-[#1877F2] hover:bg-[#1565D8] text-white"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saved ? "Salvat!" : "Salvează"}
        </Button>
      </div>
    </div>
  );
}
