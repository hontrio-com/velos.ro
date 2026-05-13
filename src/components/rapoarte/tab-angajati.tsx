"use client";

import { Users, UserCheck, CalendarDays, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRaportAngajati } from "@/hooks/use-rapoarte";
import { getAvatarStyle, getInitials } from "@/lib/avatar";

interface TabAngajatiProps {
  statieId: string;
  from: string;
  to: string;
}

export function TabAngajati({ statieId, from, to }: TabAngajatiProps) {
  const { data, isLoading } = useRaportAngajati(statieId, from, to);

  if (isLoading) return <AngajatiSkeleton />;
  if (!data) return null;

  const activi = data.angajati.filter((a) => a.activ);
  const totalProgramari = data.angajati.reduce((s, a) => s + a.programari_total, 0);
  const totalVenit = data.angajati.reduce((s, a) => s + a.venit, 0);

  if (data.angajati.length === 0) {
    return (
      <div className="bg-white border border-[#F3F4F6] rounded-xl py-16 flex flex-col items-center text-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF]">
          <Users className="h-6 w-6 text-[#1877F2]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#111318]">Niciun angajat configurat</p>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Adaugă angajați din <strong>Angajați</strong> pentru a urmări performanța individuală.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total angajați", value: data.angajati.length, icon: Users, color: "#6B7280", bg: "#F9FAFB" },
          { label: "Angajați activi", value: activi.length, icon: UserCheck, color: "#16A34A", bg: "#F0FDF4" },
          { label: "Programări atribuite", value: totalProgramari, icon: CalendarDays, color: "#1877F2", bg: "#EFF6FF" },
          { label: "Venit generat", value: `${totalVenit.toLocaleString("ro-RO")} RON`, icon: TrendingUp, color: "#7C3AED", bg: "#F5F3FF" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-[#F3F4F6] rounded-xl p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0" style={{ background: bg }}>
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-[#111318] leading-tight truncate">{value}</p>
              <p className="text-xs text-[#6B7280]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {data.angajati.map((a) => {
          const avatarStyle = getAvatarStyle(a.nume);
          const initials = getInitials(a.nume, "");
          const rataFinalizare = a.programari_total > 0
            ? Math.round((a.programari_finalizate / a.programari_total) * 100)
            : null;

          return (
            <div key={a.id} className={cn(
              "bg-white border border-[#F3F4F6] rounded-xl p-4 space-y-3",
              !a.activ && "opacity-60"
            )}>
              {/* Header */}
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
                  {a.telefon && <p className="text-[11px] text-[#9CA3AF] font-mono mt-0.5">{a.telefon}</p>}
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0",
                  a.activ ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#F3F4F6] text-[#9CA3AF]"
                )}>
                  {a.activ ? "Activ" : "Inactiv"}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#F9FAFB]">
                <div className="text-center">
                  <p className="text-base font-bold text-[#111318]">{a.programari_total}</p>
                  <p className="text-[10px] text-[#9CA3AF]">programări</p>
                </div>
                <div className="text-center border-x border-[#F3F4F6]">
                  <p className="text-base font-bold text-[#111318]">{a.programari_finalizate}</p>
                  <p className="text-[10px] text-[#9CA3AF]">finalizate</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-[#111318]">
                    {rataFinalizare !== null ? `${rataFinalizare}%` : "—"}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF]">rata</p>
                </div>
              </div>

              {/* Venit */}
              {a.venit > 0 && (
                <div className="flex items-center justify-between px-3 py-2 bg-[#F0FDF4] rounded-lg">
                  <span className="text-xs text-[#15803D]">Venit generat</span>
                  <span className="text-xs font-bold text-[#15803D]">
                    {a.venit.toLocaleString("ro-RO")} RON
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl">
        <div className="px-4 py-3 border-b border-[#F3F4F6]">
          <h3 className="text-sm font-semibold text-[#111318]">Statistici per angajat — intervalul selectat</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#F3F4F6] bg-[#F9FAFB]">
                <th className="text-left px-4 py-2.5 text-[#6B7280] font-medium">Angajat</th>
                <th className="text-left px-4 py-2.5 text-[#6B7280] font-medium">Funcție</th>
                <th className="text-right px-4 py-2.5 text-[#6B7280] font-medium">Programări</th>
                <th className="text-right px-4 py-2.5 text-[#6B7280] font-medium">Finalizate</th>
                <th className="text-right px-4 py-2.5 text-[#6B7280] font-medium">Venit (RON)</th>
                <th className="text-center px-4 py-2.5 text-[#6B7280] font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.angajati.map((a) => (
                <tr key={a.id} className="border-b border-[#F3F4F6] last:border-0 hover:bg-[#F9FAFB]">
                  <td className="px-4 py-2.5 font-medium text-[#111318]">{a.nume}</td>
                  <td className="px-4 py-2.5 text-[#6B7280]">{a.functie ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right text-[#374151]">{a.programari_total}</td>
                  <td className="px-4 py-2.5 text-right text-[#374151]">{a.programari_finalizate}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-[#111318]">
                    {a.venit > 0 ? a.venit.toLocaleString("ro-RO") : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                      a.activ ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#F3F4F6] text-[#9CA3AF]"
                    )}>
                      {a.activ ? "Activ" : "Inactiv"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AngajatiSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
      </div>
      <Skeleton className="h-[200px] rounded-xl" />
    </div>
  );
}
