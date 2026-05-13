"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, ChevronLeft, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getAvatarStyle, getInitials } from "@/lib/avatar";
import { ClientDrawer, type ClientData } from "@/components/clienti/client-drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteClientAction } from "@/lib/actions/clienti";

interface ClientProfilHeaderProps {
  client: ClientData & {
    adresa?: string | null;
    sms_optin?: boolean;
    created_at: string;
  };
  stats: {
    nrVehicule: number;
    nrProgramari: number;
    totalCheltuit: number;
    ultimaVizita: string | null;
  };
  statieId: string;
}

export function ClientProfilHeader({ client, stats, statieId }: ClientProfilHeaderProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const numeFull = `${client.nume}${client.prenume ? " " + client.prenume : ""}`;
  const avatarStyle = getAvatarStyle(client.nume);
  const initials = getInitials(client.nume, client.prenume);

  async function handleDelete() {
    if (!confirm(`Ștergi clientul ${numeFull}? Acțiunea nu poate fi anulată.`)) return;
    setDeleting(true);
    const result = await deleteClientAction(client.id);
    if ("error" in result) {
      toast.error(result.error);
      setDeleting(false);
    } else {
      toast.success("Client șters");
      router.push("/clienti");
    }
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-[#9CA3AF] mb-4">
        <Link href="/clienti" className="hover:text-[#374151] flex items-center gap-1 transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" />
          Clienți
        </Link>
        <span>/</span>
        <span className="text-[#374151] font-medium">{numeFull}</span>
      </div>

      {/* Header card */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Left: avatar + info */}
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full text-base font-semibold shrink-0"
              style={avatarStyle}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="text-[22px] font-semibold text-[#111318] tracking-tight leading-tight">
                {numeFull}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                {client.telefon && (
                  <a
                    href={`tel:${client.telefon}`}
                    className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1877F2] transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {client.telefon}
                  </a>
                )}
                {client.email && (
                  <a
                    href={`mailto:${client.email}`}
                    className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1877F2] transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {client.email}
                  </a>
                )}
                {client.adresa && (
                  <span className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
                    <MapPin className="h-3 w-3" />
                    {client.adresa}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {client.sms_optin ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#DCFCE7] text-[#15803D]">
                    SMS activ
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F3F4F6] text-[#9CA3AF]">
                    SMS oprit
                  </span>
                )}
                <span className="text-xs text-[#9CA3AF]">
                  Client din {new Date(client.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* Right: stats + actions */}
          <div className="flex flex-col sm:items-end gap-3">
            {/* Stats row */}
            <div className="flex items-stretch divide-x divide-[#F3F4F6] border border-[#F3F4F6] rounded-xl overflow-hidden">
              {[
                { value: stats.nrVehicule, label: "Vehicule" },
                { value: stats.nrProgramari, label: "Vizite totale" },
                {
                  value: stats.totalCheltuit
                    ? `${stats.totalCheltuit.toLocaleString("ro-RO")} RON`
                    : "—",
                  label: "Total",
                },
                {
                  value: stats.ultimaVizita
                    ? new Date(stats.ultimaVizita + "T12:00:00").toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit" })
                    : "—",
                  label: "Ultima vizită",
                },
              ].map(({ value, label }) => (
                <div key={label} className="px-4 py-2.5 text-center">
                  <p className="text-xl font-semibold text-[#111318] leading-none">{value}</p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-1.5 h-8 px-3 border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-lg hover:bg-[#F9FAFB] transition-colors"
              >
                Editează
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors">
                  <MoreHorizontal className="h-4 w-4 text-[#6B7280]" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Șterge client
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <ClientDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => { setDrawerOpen(false); router.refresh(); }}
        initial={client}
      />
    </>
  );
}
