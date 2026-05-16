"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, Users, UserCheck, UserX, Pencil, Trash2, ToggleLeft, ToggleRight, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAvatarStyle, getInitials } from "@/lib/avatar";
import { AngajatDrawer } from "./angajat-drawer";
import { deleteAngajatContAction } from "@/lib/actions/angajati";

export interface Angajat {
  id: string;
  statie_id: string;
  profile_id: string | null;
  nume: string;
  functie: string | null;
  telefon: string | null;
  email: string | null;
  activ: boolean;
  permisiuni: Record<string, boolean> | null;
  created_at: string;
}

interface AngajatiClientProps {
  statieId: string;
  statieNume: string;
}

export function AngajatiClient({ statieId, statieNume }: AngajatiClientProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingAngajat, setEditingAngajat] = useState<Angajat | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: angajati = [], isLoading } = useQuery<Angajat[]>({
    queryKey: ["angajati", statieId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("angajati")
        .select("id, statie_id, profile_id, nume, functie, telefon, email, activ, permisiuni, created_at")
        .eq("statie_id", statieId)
        .order("activ", { ascending: false })
        .order("nume");
      return ((data as unknown) ?? []) as Angajat[];
    },
  });

  const activi = angajati.filter((a) => a.activ).length;
  const inactivi = angajati.length - activi;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["angajati", statieId] });
  }

  function handleAdd() {
    setEditingAngajat(null);
    setDrawerOpen(true);
  }

  function handleEdit(a: Angajat) {
    setEditingAngajat(a);
    setDrawerOpen(true);
  }

  async function handleDelete(a: Angajat) {
    if (!confirm(`Ștergi angajatul "${a.nume}"? Programările atribuite vor rămâne neschimbate.`)) return;
    setDeletingId(a.id);
    try {
      // If has auth account, delete it first via server action
      if (a.profile_id) {
        const result = await deleteAngajatContAction(a.profile_id);
        if (!result.success) {
          toast.error(result.error ?? "Eroare la ștergerea contului");
          setDeletingId(null);
          return;
        }
      }

      // Delete the angajat row client-side
      const { error } = await (supabase as any)
        .from("angajati")
        .delete()
        .eq("id", a.id)
        .eq("statie_id", statieId);

      if (error) {
        toast.error(error.message ?? "Eroare la ștergere");
      } else {
        toast.success("Angajat șters");
        invalidate();
      }
    } catch (err) {
      console.error("handleDelete error:", err);
      toast.error("Eroare la ștergere");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggle(a: Angajat) {
    setTogglingId(a.id);
    try {
      const { error } = await (supabase as any)
        .from("angajati")
        .update({ activ: !a.activ, updated_at: new Date().toISOString() })
        .eq("id", a.id)
        .eq("statie_id", statieId);

      if (error) {
        toast.error(error.message ?? "Eroare");
      } else {
        toast.success(a.activ ? `${a.nume} dezactivat` : `${a.nume} activat`);
        invalidate();
      }
    } catch (err) {
      console.error("handleToggle error:", err);
      toast.error("Eroare");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#111318]">Angajați</h1>
          <p className="text-sm text-[#9CA3AF] mt-0.5">{statieNume}</p>
        </div>
        <Button
          size="sm"
          className="bg-[#1877F2] hover:bg-[#1565D8] gap-1.5"
          onClick={handleAdd}
        >
          <Plus className="h-4 w-4" />
          Adaugă angajat
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total angajați", value: angajati.length, icon: Users, color: "#6B7280", bg: "#F9FAFB" },
          { label: "Activi", value: activi, icon: UserCheck, color: "#16A34A", bg: "#F0FDF4" },
          { label: "Inactivi", value: inactivi, icon: UserX, color: "#9CA3AF", bg: "#F9FAFB" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0" style={{ background: bg }}>
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-[#111318] leading-tight">{isLoading ? "—" : value}</p>
              <p className="text-xs text-[#6B7280]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-[#F9FAFB] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : angajati.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-xl py-16 flex flex-col items-center text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF]">
            <Users className="h-6 w-6 text-[#1877F2]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#111318]">Niciun angajat adăugat</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Adaugă primul angajat pentru a-l putea atribui la programări.</p>
          </div>
          <Button size="sm" className="bg-[#1877F2] hover:bg-[#1565D8] gap-1.5 mt-1" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            Adaugă angajat
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {angajati.map((a) => {
            const avatarStyle = getAvatarStyle(a.nume);
            const initials = getInitials(a.nume, "");
            const isDeleting = deletingId === a.id;
            const isToggling = togglingId === a.id;

            return (
              <div
                key={a.id}
                className={cn(
                  "bg-white border border-[#E5E7EB] rounded-xl p-4 flex flex-col gap-3 transition-opacity",
                  !a.activ && "opacity-60"
                )}
              >
                {/* Top row */}
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full shrink-0 text-sm font-bold"
                    style={{ background: avatarStyle.backgroundColor, color: avatarStyle.color }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111318] truncate">{a.nume}</p>
                    {a.functie && <p className="text-xs text-[#6B7280] mt-0.5">{a.functie}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                      a.activ ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#F7F8FA] text-[#9CA3AF]"
                    )}>
                      {a.activ ? "Activ" : "Inactiv"}
                    </span>
                    {a.profile_id && (
                      <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EFF6FF] text-[#1877F2]">
                        <KeyRound className="h-2.5 w-2.5" />
                        Cont
                      </span>
                    )}
                  </div>
                </div>

                {/* Contact info */}
                {(a.telefon || a.email) && (
                  <div className="space-y-0.5 pl-[56px]">
                    {a.telefon && (
                      <a href={`tel:${a.telefon}`} className="block text-xs text-[#6B7280] hover:text-[#1877F2] font-mono">
                        {a.telefon}
                      </a>
                    )}
                    {a.email && (
                      <a href={`mailto:${a.email}`} className="block text-xs text-[#6B7280] hover:text-[#1877F2] truncate">
                        {a.email}
                      </a>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-[#F9FAFB]">
                  <button
                    type="button"
                    onClick={() => handleEdit(a)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#111318] transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Editează
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle(a)}
                    disabled={isToggling}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#111318] transition-colors disabled:opacity-50"
                  >
                    {a.activ
                      ? <><ToggleLeft className="h-3 w-3" /> Dezactivează</>
                      : <><ToggleRight className="h-3 w-3 text-[#16A34A]" /> Activează</>
                    }
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(a)}
                    disabled={isDeleting}
                    className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[#DC2626] hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    Șterge
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer */}
      <AngajatDrawer
        open={drawerOpen}
        angajat={editingAngajat}
        statieId={statieId}
        statieNume={statieNume}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => {
          setDrawerOpen(false);
          invalidate();
        }}
      />
    </div>
  );
}
