"use client";

import { format, addDays, subDays, parseISO, isToday } from "date-fns";
import { ro } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DayNavigatorProps {
  date: string;
  onChange: (date: string) => void;
}

export function DayNavigator({ date, onChange }: DayNavigatorProps) {
  const parsed = parseISO(date + "T12:00:00");
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isCurrentDay = date === todayStr;

  const go = (delta: number) => {
    const next = delta > 0 ? addDays(parsed, delta) : subDays(parsed, -delta);
    onChange(format(next, "yyyy-MM-dd"));
  };

  const label = format(parsed, "EEEE, d MMMM yyyy", { locale: ro });

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => go(-1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <p
        className={cn(
          "text-sm font-medium capitalize min-w-0 truncate",
          isCurrentDay && "text-primary"
        )}
      >
        {label}
      </p>

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => go(1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isCurrentDay && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs shrink-0"
          onClick={() => onChange(todayStr)}
        >
          Azi
        </Button>
      )}
    </div>
  );
}
