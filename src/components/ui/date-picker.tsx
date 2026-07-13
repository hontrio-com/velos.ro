"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { ro } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";

interface DatePickerProps {
  /** Valoare ISO `yyyy-MM-dd` (sau gol). */
  value?: string | null;
  /** Primește ISO `yyyy-MM-dd` (sau `""` la ștergere). */
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Limite ISO `yyyy-MM-dd`. */
  min?: string;
  max?: string;
  /** Interval ani pentru dropdown-ul de navigare. */
  fromYear?: number;
  toYear?: number;
  /** Permite golirea valorii. Implicit `true`. */
  clearable?: boolean;
}

function toDate(iso?: string | null): Date | undefined {
  if (!iso) return undefined;
  const d = parse(iso, "yyyy-MM-dd", new Date());
  return isValid(d) ? d : undefined;
}

export function DatePicker({
  value,
  onChange,
  id,
  placeholder = "Alege data",
  className,
  disabled,
  min,
  max,
  fromYear = 1950,
  toYear = new Date().getFullYear() + 10,
  clearable = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const selected = toDate(value);
  const minDate = toDate(min);
  const maxDate = toDate(max);

  React.useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const disabledMatchers = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
  ];

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !selected && "text-muted-foreground"
        )}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left">
          {selected ? format(selected, "d MMMM yyyy", { locale: ro }) : placeholder}
        </span>
        {clearable && selected && !disabled && (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Șterge data"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setOpen(false);
            }}
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-border bg-popover p-1 shadow-md">
          <Calendar
            mode="single"
            locale={ro}
            selected={selected}
            defaultMonth={selected ?? maxDate ?? new Date()}
            captionLayout="dropdown"
            startMonth={new Date(fromYear, 0)}
            endMonth={new Date(toYear, 11)}
            disabled={disabledMatchers.length ? disabledMatchers : undefined}
            onSelect={(d) => {
              if (d) {
                onChange(format(d, "yyyy-MM-dd"));
                setOpen(false);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
