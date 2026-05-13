"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import { Phone, MoreHorizontal, ArrowUpDown, Car, UserRound } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAvatarStyle, getInitials } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export interface ClientRow {
  id: string;
  statie_id: string;
  nume: string;
  prenume: string | null;
  telefon: string;
  email: string | null;
  sms_optin: boolean;
  created_at: string;
  nr_vehicule: number;
  nr_programari: number;
  ultima_programare: string | null;
  total_cheltuit: number;
}

interface ActionsCallbacks {
  onEdit: (client: ClientRow) => void;
  onDelete: (client: ClientRow) => void;
  onAddVehicul: (clientId: string) => void;
  onProgramareNoua: (clientId: string) => void;
  onViewProfil: (clientId: string) => void;
}

export function getClientiColumns(callbacks: ActionsCallbacks): ColumnDef<ClientRow>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          className="border-[#D1D5DB]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          onClick={(e) => e.stopPropagation()}
          className="border-[#D1D5DB]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },

    {
      accessorKey: "nume",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#111318] transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Client
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => {
        const c = row.original;
        const numeFull = `${c.nume}${c.prenume ? " " + c.prenume : ""}`;
        const style = getAvatarStyle(c.nume);
        const initials = getInitials(c.nume, c.prenume);
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold shrink-0"
              style={style}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#111318] truncate">{numeFull}</p>
              {c.email && (
                <p className="text-xs text-[#9CA3AF] truncate">{c.email}</p>
              )}
            </div>
          </div>
        );
      },
      filterFn: (row, _, filterValue: string) => {
        const q = filterValue.toLowerCase();
        const c = row.original;
        return (
          c.nume.toLowerCase().includes(q) ||
          (c.prenume?.toLowerCase().includes(q) ?? false) ||
          c.telefon.includes(q) ||
          (c.email?.toLowerCase().includes(q) ?? false)
        );
      },
    },

    {
      accessorKey: "telefon",
      header: () => <span className="text-xs font-medium text-[#6B7280]">Telefon</span>,
      cell: ({ row }) => (
        <a
          href={`tel:${row.original.telefon}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 text-sm text-[#374151] hover:text-[#1877F2] transition-colors"
        >
          <Phone className="h-3 w-3 text-[#9CA3AF]" />
          {row.original.telefon}
        </a>
      ),
    },

    {
      accessorKey: "nr_vehicule",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#111318]"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <Car className="h-3 w-3" />
          Vehicule
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => {
        const n = row.original.nr_vehicule;
        if (n === 0) return <span className="text-[#D1D5DB]">—</span>;
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#EFF6FF] text-[#1877F2]">
            {n} {n === 1 ? "vehicul" : "vehicule"}
          </span>
        );
      },
    },

    {
      accessorKey: "nr_programari",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#111318]"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Programări
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => {
        const { nr_programari, ultima_programare } = row.original;
        if (nr_programari === 0) return <span className="text-[#D1D5DB]">—</span>;
        return (
          <div>
            <span className="text-sm text-[#374151]">{nr_programari}</span>
            {ultima_programare && (
              <span className="text-xs text-[#9CA3AF] ml-1.5">
                · {format(parseISO(ultima_programare + "T12:00:00"), "dd.MM.yy")}
              </span>
            )}
          </div>
        );
      },
    },

    {
      accessorKey: "total_cheltuit",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#111318]"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total cheltuit
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => {
        const v = row.original.total_cheltuit;
        if (!v) return <span className="text-[#D1D5DB]">—</span>;
        return (
          <span className="text-sm text-[#374151]">
            {v.toLocaleString("ro-RO")} RON
          </span>
        );
      },
    },

    {
      accessorKey: "sms_optin",
      header: () => <span className="text-xs font-medium text-[#6B7280]">SMS</span>,
      cell: ({ row }) =>
        row.original.sms_optin ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#DCFCE7] text-[#15803D]">
            Activ
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F7F8FA] text-[#9CA3AF]">
            Oprit
          </span>
        ),
    },

    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#111318]"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Creat
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-xs text-[#9CA3AF]">
          {format(parseISO(row.original.created_at), "d MMM yyyy", { locale: ro })}
        </span>
      ),
    },

    {
      id: "actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div
            className="opacity-0 group-hover/row:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[#F7F8FA] transition-colors">
                <MoreHorizontal className="h-4 w-4 text-[#6B7280]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => callbacks.onViewProfil(c.id)}>
                  <UserRound className="h-3.5 w-3.5 mr-2" />
                  Deschide profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => callbacks.onEdit(c)}>
                  Editează
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => callbacks.onAddVehicul(c.id)}>
                  <Car className="h-3.5 w-3.5 mr-2" />
                  Adaugă vehicul
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => callbacks.onProgramareNoua(c.id)}>
                  Programare nouă
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={() => callbacks.onDelete(c)}
                >
                  Șterge client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
