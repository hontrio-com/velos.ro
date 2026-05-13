"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type SortingState,
  type RowSelectionState,
  flexRender,
} from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Trash2,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientDrawer, type ClientData } from "./client-drawer";
import { deleteClientAction } from "@/lib/actions/clienti";
import { getClientiColumns, type ClientRow } from "./clienti-columns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ClientiTableProps {
  data: ClientRow[];
  statieId: string;
}

function exportCsv(rows: ClientRow[]) {
  const headers = [
    "Nume", "Prenume", "Telefon", "Email", "Vehicule",
    "Programări", "Total RON", "SMS Optin", "Creat la",
  ];
  const lines = rows.map((r) =>
    [
      r.nume, r.prenume ?? "", r.telefon, r.email ?? "",
      r.nr_vehicule, r.nr_programari, r.total_cheltuit,
      r.sms_optin ? "Da" : "Nu",
      new Date(r.created_at).toLocaleDateString("ro-RO"),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clienti-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ClientiTable({ data, statieId }: ClientiTableProps) {
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editClient, setEditClient] = useState<ClientData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const callbacks = useMemo(
    () => ({
      onEdit: (c: ClientRow) => {
        setEditClient(c);
        setDrawerOpen(true);
      },
      onDelete: async (c: ClientRow) => {
        if (!confirm(`Șterge clientul ${c.nume}? Această acțiune nu poate fi anulată.`)) return;
        setDeletingId(c.id);
        const result = await deleteClientAction(c.id);
        setDeletingId(null);
        if ("error" in result) {
          toast.error(result.error);
        } else {
          toast.success("Client șters");
          router.refresh();
        }
      },
      onAddVehicul: (clientId: string) => {
        router.push(`/clienti/${clientId}?tab=vehicule`);
      },
      onProgramareNoua: (clientId: string) => {
        router.push(`/programari?client=${clientId}`);
      },
      onViewProfil: (clientId: string) => {
        router.push(`/clienti/${clientId}`);
      },
    }),
    [router]
  );

  const columns = useMemo(() => getClientiColumns(callbacks), [callbacks]);

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting, rowSelection },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
    globalFilterFn: "auto",
  });

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  const hasSelection = selectedRows.length > 0;

  const handleBulkDelete = async () => {
    if (!confirm(`Ștergi ${selectedRows.length} clienți? Acțiunea este permanentă.`)) return;
    for (const c of selectedRows) {
      await deleteClientAction(c.id);
    }
    setRowSelection({});
    router.refresh();
    toast.success(`${selectedRows.length} clienți șterși`);
  };

  const { rows } = table.getRowModel();
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const totalFiltered = table.getFilteredRowModel().rows.length;
  const pageSize = table.getState().pagination.pageSize;
  const from = pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalFiltered);

  return (
    <>
      {/* Toolbar */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <Input
              placeholder="Caută după nume, telefon, email..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 border-[#E5E7EB] bg-[#F9FAFB] focus-visible:bg-white text-sm"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCsv(table.getFilteredRowModel().rows.map((r) => r.original))}
              className="border-[#E5E7EB] text-[#374151] text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <button
              onClick={() => { setEditClient(null); setDrawerOpen(true); }}
              className="flex items-center gap-1.5 h-8 px-3 bg-[#1877F2] text-white text-xs font-medium rounded-lg hover:bg-[#1565D8] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Adaugă client
            </button>
          </div>
        </div>

        {/* Bulk actions */}
        <AnimatePresence>
          {hasSelection && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="flex items-center gap-3 overflow-hidden"
            >
              <span className="text-sm font-medium text-[#1877F2]">
                {selectedRows.length} selectați
              </span>
              <button
                onClick={() => exportCsv(selectedRows)}
                className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#374151] transition-colors"
              >
                <Download className="h-3 w-3" /> Exportă
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 className="h-3 w-3" /> Șterge
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl overflow-hidden">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F3F4F6] mb-4">
              <Users className="h-6 w-6 text-[#9CA3AF]" />
            </div>
            <p className="text-sm font-medium text-[#111318]">Niciun client înregistrat</p>
            <p className="text-xs text-[#9CA3AF] mt-1 mb-4">
              Adaugă primul client pentru a începe
            </p>
            <button
              onClick={() => { setEditClient(null); setDrawerOpen(true); }}
              className="flex items-center gap-1.5 h-8 px-3 bg-[#1877F2] text-white text-xs font-medium rounded-lg hover:bg-[#1565D8]"
            >
              <Plus className="h-3.5 w-3.5" />
              Adaugă client
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-[#374151]">
              Niciun client găsit pentru <strong>«{globalFilter}»</strong>
            </p>
            <button
              onClick={() => setGlobalFilter("")}
              className="mt-2 text-xs text-[#1877F2] hover:underline"
            >
              Șterge filtrele
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-[#F3F4F6] bg-[#F9FAFB]">
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        className="px-4 py-3 text-left text-xs font-medium text-[#6B7280] first:pl-5 last:pr-5 whitespace-nowrap"
                        style={{ width: h.getSize() }}
                      >
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "group/row border-b border-[#F9FAFB] cursor-pointer transition-colors",
                      row.getIsSelected() ? "bg-[#EFF6FF]" : "hover:bg-[#F9FAFB]",
                      deletingId === row.original.id && "opacity-50 pointer-events-none"
                    )}
                    onClick={() => router.push(`/clienti/${row.original.id}`)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 first:pl-5 last:pr-5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer / pagination */}
        {data.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#F3F4F6]">
            <p className="text-xs text-[#9CA3AF]">
              Afișând {from}–{to} din {totalFiltered} clienți
            </p>
            <div className="flex items-center gap-3">
              <Select
                value={String(pageSize)}
                onValueChange={(v) => table.setPageSize(Number(v))}
              >
                <SelectTrigger className="h-7 w-[110px] text-xs border-[#E5E7EB]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[25, 50, 100].map((s) => (
                    <SelectItem key={s} value={String(s)} className="text-xs">
                      {s} per pagină
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>

                {Array.from({ length: Math.min(pageCount, 7) }, (_, i) => {
                  const page = i;
                  return (
                    <button
                      key={page}
                      onClick={() => table.setPageIndex(page)}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors",
                        pageIndex === page
                          ? "bg-[#1877F2] text-white"
                          : "border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]"
                      )}
                    >
                      {page + 1}
                    </button>
                  );
                })}

                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ClientDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditClient(null); }}
        onSuccess={() => { setDrawerOpen(false); setEditClient(null); router.refresh(); }}
        initial={editClient}
      />
    </>
  );
}
