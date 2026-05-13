"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import { Search, ArrowUpDown, MessageSquare, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ReminderStatusBadge } from "./reminder-status-badge";
import { TrimiteSmsDialog } from "./trimite-sms-dialog";
import { retrimiteReminderAction } from "@/lib/actions/remindere";
import { TIP_CONFIG } from "@/lib/remindere-generator";
import type { TipReminder } from "@/lib/remindere-generator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface AllReminder {
  id: string;
  tip: TipReminder;
  status: string;
  mesaj: string | null;
  programat_la: string | null;
  trimis_la: string | null;
  eroare: string | null;
  client: { id: string; nume: string; telefon: string | null; sms_optin: boolean } | null;
  vehicul: { nr_inmatriculare: string; expirare_itp: string | null } | null;
}

interface TabToateProps {
  remindere: AllReminder[];
  isLoading: boolean;
  onUpdate: () => void;
}

export function TabToate({ remindere, isLoading, onUpdate }: TabToateProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "programat_la", desc: true },
  ]);
  const [smsDialog, setSmsDialog] = useState<{ id: string; telefon: string; numeClient: string; mesaj: string } | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  async function handleRetry(id: string) {
    setRetrying(id);
    const result = await retrimiteReminderAction(id);
    setRetrying(null);
    if (result.success) {
      toast.success("SMS retrimis cu succes!");
      onUpdate();
    } else {
      toast.error(result.error ?? "Eroare la retrimitere");
    }
  }

  const columns = useMemo<ColumnDef<AllReminder>[]>(
    () => [
      {
        id: "tip",
        accessorKey: "tip",
        header: "Tip",
        cell: ({ row }) => {
          const tip = row.original.tip;
          const cfg = TIP_CONFIG[tip];
          return (
            <Badge className={cn("border-0 text-xs font-bold", cfg.bgClass, cfg.colorClass)}>
              {cfg.label}
            </Badge>
          );
        },
      },
      {
        id: "client",
        accessorFn: (r) => r.client?.nume ?? "",
        header: "Client",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#111318] truncate">
                {r.client?.nume ?? "—"}
              </p>
              <p className="text-xs text-[#6B7280] font-mono">
                {r.client?.telefon ?? "—"}
              </p>
            </div>
          );
        },
      },
      {
        id: "vehicul",
        accessorFn: (r) => r.vehicul?.nr_inmatriculare ?? "",
        header: "Vehicul",
        cell: ({ row }) => (
          <span className="text-xs font-mono font-medium text-[#6B7280]">
            {row.original.vehicul?.nr_inmatriculare ?? "—"}
          </span>
        ),
      },
      {
        id: "programat_la",
        accessorKey: "programat_la",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 text-xs font-medium text-[#6B7280] hover:text-[#111318]"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Programat la
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) =>
          row.original.programat_la ? (
            <span className="text-xs text-[#6B7280]">
              {format(parseISO(row.original.programat_la), "d MMM yyyy HH:mm", { locale: ro })}
            </span>
          ) : (
            <span className="text-xs text-[#9CA3AF]">—</span>
          ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <ReminderStatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const r = row.original;
          const canSend = r.client?.sms_optin && r.client?.telefon;
          return (
            <div className="flex items-center gap-1 justify-end">
              {r.status === "eroare" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-50"
                  disabled={retrying === r.id}
                  onClick={() => handleRetry(r.id)}
                  title="Retrimite"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
              {canSend && r.status !== "trimis" && r.status !== "livrat" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-[#1877F2] hover:bg-[#EFF6FF]"
                  onClick={() =>
                    setSmsDialog({
                      id: r.id,
                      telefon: r.client!.telefon!,
                      numeClient: r.client!.nume,
                      mesaj: r.mesaj ?? "",
                    })
                  }
                  title="Trimite SMS"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [retrying]
  );

  const table = useReactTable({
    data: remindere,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = filterValue.toLowerCase();
      const r = row.original;
      return (
        (r.client?.nume ?? "").toLowerCase().includes(q) ||
        (r.client?.telefon ?? "").includes(q) ||
        (r.vehicul?.nr_inmatriculare ?? "").toLowerCase().includes(q)
      );
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
        <Input
          placeholder="Caută client, telefon, nr. înmatriculare..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-9 text-sm"
        />
      </div>

      <div className="rounded-xl border border-[#F3F4F6] overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[#F7F8FA] border-b border-[#F3F4F6]">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="px-3 py-2.5 text-left text-xs font-medium text-[#6B7280] first:pl-4 last:pr-4"
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 text-center text-sm text-[#9CA3AF]"
                >
                  Niciun reminder găsit
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#F3F4F6] last:border-0 hover:bg-[#F7F8FA] transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-3 py-3 first:pl-4 last:pr-4"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-[#6B7280]">
            {table.getFilteredRowModel().rows.length} remindere
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-[#6B7280]">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {smsDialog && (
        <TrimiteSmsDialog
          open={!!smsDialog}
          onOpenChange={(o) => !o && setSmsDialog(null)}
          reminderId={smsDialog.id}
          telefon={smsDialog.telefon}
          numeClient={smsDialog.numeClient}
          mesajInitial={smsDialog.mesaj}
          onSuccess={onUpdate}
        />
      )}
    </div>
  );
}
