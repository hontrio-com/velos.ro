"use client";

import { useState, useTransition, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import { CheckCircle2, XCircle, RefreshCw, Search, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { retryFacturaAction } from "@/lib/actions/admin-facturi";
import type { FacturaRow } from "@/app/(admin)/admin/facturi/page";

const TIP_CONFIG = {
  sms_purchase:       { label: "SMS",           bg: "#FEF9C3", color: "#A16207" },
  subscription_new:   { label: "Abonament Nou", bg: "#DBEAFE", color: "#1D4ED8" },
  subscription_renewal: { label: "Reînnoire",   bg: "#EDE9FE", color: "#6D28D9" },
} as const;

export function FacturiAdminClient({ rows }: { rows: FacturaRow[] }) {
  const [search, setSearch] = useState("");
  const [filterTip, setFilterTip] = useState<"all" | FacturaRow["tip"]>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "emise" | "erori">("all");
  const [retrying, setRetrying] = useState<string | null>(null);
  const [retryResults, setRetryResults] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterTip !== "all" && r.tip !== filterTip) return false;
      if (filterStatus === "emise" && !!r.eroare) return false;
      if (filterStatus === "erori" && !r.eroare) return false;
      if (search) {
        const q = search.toLowerCase();
        const email = r.profiles?.email?.toLowerCase() ?? "";
        const ref = r.referinta.toLowerCase();
        const numar = (r.smartbill_numar ?? "").toLowerCase();
        if (!email.includes(q) && !ref.includes(q) && !numar.includes(q)) return false;
      }
      return true;
    });
  }, [rows, filterTip, filterStatus, search]);

  function handleRetry(facturaId: string) {
    setRetrying(facturaId);
    startTransition(async () => {
      const res = await retryFacturaAction(facturaId);
      setRetryResults((prev) => ({
        ...prev,
        [facturaId]: res.success
          ? { ok: true, msg: `Emisă: ${res.serie}-${res.numar}` }
          : { ok: false, msg: res.error ?? "Eroare" },
      }));
      setRetrying(null);
    });
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <Input
            placeholder="Caută email, referință Stripe, nr. factură..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Tip filter */}
        <div className="flex gap-1">
          {(["all", "sms_purchase", "subscription_new", "subscription_renewal"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterTip(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filterTip === t
                  ? "bg-[#1877F2] text-white"
                  : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
              )}
            >
              {t === "all" ? "Toate" : TIP_CONFIG[t].label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1">
          {(["all", "emise", "erori"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filterStatus === s
                  ? "bg-[#1877F2] text-white"
                  : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
              )}
            >
              {s === "all" ? "Toate" : s === "emise" ? "Emise" : "Erori"}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="px-4 py-2 bg-[#F9FAFB] border-b border-[#E5E7EB]">
        <p className="text-xs text-[#6B7280]">{filtered.length} facturi</p>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-2 text-[#9CA3AF]">
          <Receipt className="h-8 w-8" />
          <p className="text-sm">Nicio factură găsită</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                {["Data", "Utilizator", "Tip", "Suma", "Factură SmartBill", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#6B7280] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const tipCfg = TIP_CONFIG[row.tip];
                const isErr = !!row.eroare;
                const retryResult = retryResults[row.id];

                return (
                  <tr key={row.id} className="border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors">
                    {/* Data */}
                    <td className="px-4 py-3 text-[#374151] whitespace-nowrap">
                      {format(parseISO(row.created_at), "dd MMM yyyy, HH:mm", { locale: ro })}
                    </td>

                    {/* Utilizator */}
                    <td className="px-4 py-3 min-w-[180px]">
                      <p className="text-[#111318] font-medium truncate max-w-[200px]">
                        {row.profiles?.full_name ?? "—"}
                      </p>
                      <p className="text-xs text-[#9CA3AF] truncate max-w-[200px]">
                        {row.profiles?.email ?? "—"}
                      </p>
                    </td>

                    {/* Tip */}
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
                        style={{ background: tipCfg.bg, color: tipCfg.color }}
                      >
                        {tipCfg.label}
                      </span>
                    </td>

                    {/* Suma */}
                    <td className="px-4 py-3 text-[#111318] font-medium whitespace-nowrap">
                      {Number(row.suma).toFixed(2)} {row.moneda}
                    </td>

                    {/* Factură SmartBill */}
                    <td className="px-4 py-3">
                      {row.smartbill_serie && row.smartbill_numar ? (
                        <span className="font-mono text-[#1877F2] font-medium">
                          {row.smartbill_serie}-{row.smartbill_numar}
                        </span>
                      ) : (
                        <span className="text-[#9CA3AF]">—</span>
                      )}
                      <p className="text-[10px] text-[#9CA3AF] font-mono mt-0.5 max-w-[160px] truncate">
                        {row.referinta}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {retryResult ? (
                        <div className={cn("flex items-center gap-1.5 text-xs font-medium", retryResult.ok ? "text-[#059669]" : "text-[#DC2626]")}>
                          {retryResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          {retryResult.msg}
                        </div>
                      ) : isErr ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-[#DC2626]">
                            <XCircle className="h-4 w-4 shrink-0" />
                            <span className="text-xs font-semibold">Eroare</span>
                          </div>
                          <p className="text-[10px] text-[#9CA3AF] max-w-[180px] break-words">{row.eroare}</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[#059669]">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs font-semibold">Emisă</span>
                        </div>
                      )}
                    </td>

                    {/* Retry action */}
                    <td className="px-4 py-3">
                      {isErr && !retryResult?.ok && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs gap-1"
                          disabled={retrying === row.id || isPending}
                          onClick={() => handleRetry(row.id)}
                        >
                          <RefreshCw className={cn("h-3 w-3", retrying === row.id && "animate-spin")} />
                          Reîncearcă
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
