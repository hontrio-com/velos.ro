"use client";

import { useState } from "react";
import { useQueryState } from "nuqs";
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays, subMonths, startOfYear, endOfYear, startOfQuarter, endOfQuarter, subQuarters, isAfter, isBefore, isValid } from "date-fns";
import { ro } from "date-fns/locale";
import { CalendarDays, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  className?: string;
}

const today = () => new Date();

const SHORTCUTS = [
  { label: "Azi", fn: () => ({ from: today(), to: today() }) },
  { label: "Ieri", fn: () => { const y = subDays(today(), 1); return { from: y, to: y }; } },
  { label: "Săptămâna aceasta", fn: () => ({ from: startOfWeek(today(), { weekStartsOn: 1 }), to: endOfWeek(today(), { weekStartsOn: 1 }) }) },
  { label: "Luna aceasta", fn: () => ({ from: startOfMonth(today()), to: endOfMonth(today()) }) },
  { label: "Luna trecută", fn: () => { const lp = subMonths(today(), 1); return { from: startOfMonth(lp), to: endOfMonth(lp) }; } },
  { label: "Ultimele 7 zile", fn: () => ({ from: subDays(today(), 6), to: today() }) },
  { label: "Ultimele 30 zile", fn: () => ({ from: subDays(today(), 29), to: today() }) },
  { label: "Trim. I", fn: () => { const q = startOfYear(today()); return { from: startOfQuarter(q), to: endOfQuarter(q) }; } },
  { label: "Trim. II", fn: () => { const q = subQuarters(startOfYear(today()), -1); return { from: startOfQuarter(q), to: endOfQuarter(q) }; } },
  { label: "Anul acesta", fn: () => ({ from: startOfYear(today()), to: endOfYear(today()) }) },
];

export function DateRangePicker({ className }: DateRangePickerProps) {
  const [fromParam, setFromParam] = useQueryState("from");
  const [toParam, setToParam] = useQueryState("to");
  const [open, setOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange | undefined>();
  const [error, setError] = useState<string | null>(null);

  const fromDate = fromParam && isValid(parseISO(fromParam)) ? parseISO(fromParam) : undefined;
  const toDate = toParam && isValid(parseISO(toParam)) ? parseISO(toParam) : undefined;

  const displayRange = fromDate
    ? `${format(fromDate, "d MMM yyyy", { locale: ro })}${toDate ? ` — ${format(toDate, "d MMM yyyy", { locale: ro })}` : ""}`
    : null;

  const days = fromDate && toDate ? differenceInDays(toDate, fromDate) + 1 : null;

  function handleOpen(v: boolean) {
    if (v) {
      setTempRange(fromDate && toDate ? { from: fromDate, to: toDate } : undefined);
      setError(null);
    }
    setOpen(v);
  }

  function applyShortcut(fn: () => { from: Date; to: Date }) {
    const { from, to } = fn();
    setTempRange({ from, to });
    setError(null);
  }

  function handleApply() {
    if (!tempRange?.from) return;
    const f = tempRange.from;
    const t = tempRange.to ?? tempRange.from;

    if (isAfter(f, t)) {
      setError("Data de sfârșit trebuie să fie după data de început");
      return;
    }
    const diffDays = differenceInDays(t, f) + 1;
    if (diffDays > 366) {
      setError("Intervalul maxim este de 1 an");
      return;
    }
    setFromParam(format(f, "yyyy-MM-dd"));
    setToParam(format(t, "yyyy-MM-dd"));
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    setFromParam(null);
    setToParam(null);
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger
        className={cn(
          "flex items-center gap-2 px-3 h-9 rounded-lg border border-[#E5E7EB] bg-white text-sm transition-colors hover:bg-[#F9FAFB] min-w-[260px]",
          open && "border-[#1877F2] ring-2 ring-[#1877F2]/20",
          className
        )}
      >
        <CalendarDays className="h-3.5 w-3.5 text-[#6B7280] shrink-0" />
        <span className={cn("flex-1 text-left", displayRange ? "text-[#111318]" : "text-[#9CA3AF]")}>
          {displayRange ?? "Selectează perioada..."}
        </span>
        {days && (
          <span className="text-[10px] text-[#9CA3AF] shrink-0">{days}z</span>
        )}
        {displayRange ? (
          <span
            role="button"
            onClick={handleClear}
            className="h-4 w-4 rounded flex items-center justify-center text-[#9CA3AF] hover:text-[#111318] hover:bg-[#F7F8FA] shrink-0"
          >
            <X className="h-3 w-3" />
          </span>
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-[#9CA3AF] shrink-0" />
        )}
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-3 border-b border-[#E5E7EB]">
          <div className="flex flex-wrap gap-1">
            {SHORTCUTS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => applyShortcut(s.fn)}
                className={cn(
                  "px-2 py-1 text-[11px] font-medium rounded-md border transition-colors",
                  tempRange?.from &&
                    tempRange.to &&
                    s.fn().from.toDateString() === tempRange.from.toDateString() &&
                    s.fn().to.toDateString() === tempRange.to.toDateString()
                    ? "bg-[#1877F2] text-white border-[#1877F2]"
                    : "bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F7F8FA]"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <Calendar
          mode="range"
          selected={tempRange}
          onSelect={setTempRange}
          numberOfMonths={2}
          locale={ro}
          weekStartsOn={1}
        />

        {error && (
          <div className="px-3 pb-1">
            <p className="text-[11px] text-red-600">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between px-3 py-2 border-t border-[#E5E7EB]">
          <span className="text-[11px] text-[#6B7280]">
            {tempRange?.from
              ? `${format(tempRange.from, "dd.MM.yyyy")}${tempRange.to ? ` → ${format(tempRange.to, "dd.MM.yyyy")}` : ""}`
              : "Selectează un interval"}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setOpen(false)}>
              Anulează
            </Button>
            <Button size="sm" className="h-7 text-xs bg-[#1877F2] hover:bg-[#1565D8]" onClick={handleApply} disabled={!tempRange?.from}>
              Aplică
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
