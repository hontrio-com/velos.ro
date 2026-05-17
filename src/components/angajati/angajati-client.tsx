"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Users,
  UserCheck,
  UserX,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAvatarStyle, getInitials } from "@/lib/avatar";
import { type Angajat } from "@/lib/actions/angajati-types";
import {
  getAngajatiAction,
  deleteAngajatAction,
  deleteContAngajatAction,
  toggleAngajatActivAction,
} from "@/lib/actions/angajati";
import { AngajatDrawer } from "./angajat-drawer";

interface Props {
  statieId: string;
  statieNume: string;
}

export function AngajatiClient({ statieId, statieNume }: Props) {
  const queryClient = useQueryClient();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingAngajat, setEditingAngajat] = useState<Angajat | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: angajati = [], isLoading } = useQuery<Angajat[]>({
    queryKey: ["angajati", statieId],
    queryFn: () => getAngajatiAction(statieId),
    staleTime: 30_000,
  });

  const activi = angajati.filter((a) => a.activ).length;
  const inactivi = angajati.length - activi;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["angajati", statieId] });
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleAdd() {
    console.log("[AngajatiClient] handleAdd called, opening drawer");
    setEditingAngajat(null);
    setDrawerOpen(true);
  }

  function handleEdit(a: Angajat) {
    setEditingAngajat(a);
    setDrawerOpen(true);
  }

  async function handleToggle(a: Angajat) {
    setTogglingId(a.id);
    try {
      const result = await toggleAngajatActivAction(a.id, statieId, !a.activ);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success(a.activ ? `${a.nume} dezactivat` : `${a.nume} activat`);
        invalidate();
      }
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(a: Angajat) {
    if (
      !confirm(
        `Ștergi angajatul "${a.nume}"?\nProgramările atribuite vor rămâne neschimbate.`
      )
    )
      return;

    setDeletingId(a.id);
    try {
      // 1. Dacă are cont auth, șterge-l (și delinkeaza)
      if (a.profile_id) {
        const contResult = await deleteContAngajatAction(
          a.profile_id,
          statieId
        );
        if (!contResult.success) {
          toast.error(contResult.error);
          return;
        }
      }

      // 2. Șterge rândul angajat
      const result = await deleteAngajatAction(a.id, statieId);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("Angajat șters");
        invalidate();
      }
    } finally {
      setDeletingId(null);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: "Total angajați",
            value: angajati.length,
            icon: Users,
            color: "#6B7280",
            bg: "#F9FAFB",
          },
          {
            label: "Activi",
            value: activi,
            icon: UserCheck,
            color: "#16A34A",
            bg: "#F0FDF4",
          },
          {
            label: "Inactivi",
            value: inactivi,
            icon: UserX,
            color: "#9CA3AF",
            bg: "#F9FAFB",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-center gap-3"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
              style={{ background: bg }}
            >
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-[#111318] leading-tight">
                {isLoading ? "—" : value}
              </p>
              <p className="text-xs text-[#6B7280]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-36 bg-[#F9FAFB] rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : angajati.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-xl py-16 flex flex-col items-center text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF]">
            <Users className="h-6 w-6 text-[#1877F2]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#111318]">
              Niciun angajat adăugat
            </p>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Adaugă primul angajat pentru a-l atribui la programări.
            </p>
          </div>
          <Button
            size="sm"
            className="bg-[#1877F2] hover:bg-[#1565D8] gap-1.5 mt-1"
            onClick={handleAdd}
          >
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
                    style={{
                      background: avatarStyle.backgroundColor,
                      color: avatarStyle.color,
                    }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111318] truncate">
                      {a.nume}
                    </p>
                    {a.functie && (
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        {a.functie}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                        a.activ
                          ? "bg-[#DCFCE7] text-[#15803D]"
                          : "bg-[#F7F8FA] text-[#9CA3AF]"
                      )}
                    >
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
                      <a
                        href={`tel:${a.telefon}`}
                        className="block text-xs text-[#6B7280] hover:text-[#1877F2] font-mono"
                      >
                        {a.telefon}
                      </a>
                    )}
                    {a.email && (
                      <a
                        href={`mailto:${a.email}`}
                        className="block text-xs text-[#6B7280] hover:text-[#1877F2] truncate"
                      >
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
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#111318] transition-colors disabled:opacity-40"
                  >
                    {a.activ ? (
                      <>
                        <ToggleLeft className="h-3 w-3" />
                        Dezactivează
                      </>
                    ) : (
                      <>
                        <ToggleRight className="h-3 w-3 text-[#16A34A]" />
                        Activează
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(a)}
                    disabled={isDeleting}
                    className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[#DC2626] hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="h-3 w-3" />
                    {isDeleting ? "Se șterge..." : "Șterge"}
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
