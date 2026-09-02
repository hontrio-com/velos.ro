"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Building2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Profile, Statie } from "@/types/database.types";

const profileSchema = z.object({
  fullName: z.string().min(2, "Minim 2 caractere"),
  phone: z.string().optional(),
});

const statieSchema = z.object({
  nume: z.string().min(2, "Minim 2 caractere"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Doar litere mici, cifre și cratimă"),
  adresa: z.string().optional(),
  oras: z.string().optional(),
  judet: z.string().optional(),
  telefon: z.string().optional(),
  email: z.string().email("Email invalid").optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;
type StatieForm = z.infer<typeof statieSchema>;

interface SetariClientProps {
  profile: Profile | null;
  statii: Statie[];
  userId: string;
}

export function SetariClient({ profile, statii, userId }: SetariClientProps) {
  const [activeTab, setActiveTab] = useState<"profil" | "statii">("profil");
  const [savingProfile, setSavingProfile] = useState(false);
  const [addingStatie, setAddingStatie] = useState(false);
  const [showAddStatie, setShowAddStatie] = useState(false);
  const supabase = createClient();

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
    },
  });

  const statieForm = useForm<StatieForm>({
    resolver: zodResolver(statieSchema),
  });

  async function saveProfile(data: ProfileForm) {
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: data.fullName, phone: data.phone ?? null })
      .eq("id", userId);

    if (error) toast.error("Eroare la salvarea profilului");
    else toast.success("Profil actualizat!");
    setSavingProfile(false);
  }

  async function addStatie(data: StatieForm) {
    setAddingStatie(true);
    const { error } = await supabase.from("statii").insert({
      owner_id: userId,
      nume: data.nume,
      slug: data.slug,
      adresa: data.adresa ?? null,
      oras: data.oras ?? null,
      judet: data.judet ?? null,
      telefon: data.telefon ?? null,
      email: data.email || null,
    });

    if (error) {
      if (error.code === "23505") toast.error("Slug-ul există deja. Alege altul.");
      else toast.error("Eroare la adăugarea stației");
    } else {
      toast.success("Stație adăugată!");
      setShowAddStatie(false);
      statieForm.reset();
      window.location.reload();
    }
    setAddingStatie(false);
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-[#E5E7EB]">
        {([
          { value: "profil",  label: "Profil",  icon: User },
          { value: "statii",  label: "Stații",  icon: Building2 },
        ] as const).map(({ value, label, icon: Icon }) => {
          const isActive = activeTab === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value)}
              className={[
                "relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                "border-b-2 -mb-px focus-visible:outline-none",
                isActive
                  ? "text-[#1877F2] border-[#1877F2] bg-white"
                  : "text-[#6B7280] border-transparent hover:text-[#111318] hover:bg-[#F9FAFB]",
              ].join(" ")}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="p-5">
        {/* Profil */}
        {activeTab === "profil" && (
          <Card className="border-[#E5E7EB] shadow-none max-w-lg">
            <CardHeader>
              <CardTitle className="text-base">Datele tale</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={profileForm.handleSubmit(saveProfile)}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label>Nume complet</Label>
                  <Input {...profileForm.register("fullName")} />
                  {profileForm.formState.errors.fullName && (
                    <p className="text-xs text-destructive">
                      {profileForm.formState.errors.fullName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Telefon</Label>
                  <Input
                    placeholder="0722 123 456 sau +39 333 1234567"
                    {...profileForm.register("phone")}
                  />
                </div>
                <Button type="submit" disabled={savingProfile} size="sm">
                  {savingProfile && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvează
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Stații */}
        {activeTab === "statii" && (
          <div className="space-y-4 max-w-2xl">
            {statii.map((s) => (
              <Card key={s.id} className="border-[#E5E7EB] shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-[#111318]">{s.nume}</p>
                        <Badge
                          variant={s.activa ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {s.activa ? "Activă" : "Inactivă"}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#6B7280]">
                        slug: /{s.slug}
                      </p>
                      {(s.oras || s.judet) && (
                        <p className="text-xs text-[#6B7280]">
                          {[s.oras, s.judet].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      Editează
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {showAddStatie ? (
              <Card className="border-[#1877F2] shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">Stație nouă</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={statieForm.handleSubmit(addStatie)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Nume stație *</Label>
                        <Input
                          placeholder="Stația ITP București"
                          {...statieForm.register("nume")}
                        />
                        {statieForm.formState.errors.nume && (
                          <p className="text-xs text-destructive">
                            {statieForm.formState.errors.nume.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label>Slug URL *</Label>
                        <Input
                          placeholder="statia-itp-bucuresti"
                          {...statieForm.register("slug")}
                        />
                        {statieForm.formState.errors.slug && (
                          <p className="text-xs text-destructive">
                            {statieForm.formState.errors.slug.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Adresă</Label>
                      <Input
                        placeholder="Str. Exemplu nr. 1"
                        {...statieForm.register("adresa")}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Oraș</Label>
                        <Input
                          placeholder="București"
                          {...statieForm.register("oras")}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Județ</Label>
                        <Input
                          placeholder="Ilfov"
                          {...statieForm.register("judet")}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Telefon</Label>
                        <Input
                          placeholder="0722 123 456 sau +39 333 1234567"
                          {...statieForm.register("telefon")}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          placeholder="contact@statia.ro"
                          {...statieForm.register("email")}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddStatie(false)}
                      >
                        Anulează
                      </Button>
                      <Button type="submit" size="sm" disabled={addingStatie}>
                        {addingStatie && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Adaugă stația
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowAddStatie(true)}
              >
                <Plus className="h-4 w-4" />
                Adaugă stație nouă
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
