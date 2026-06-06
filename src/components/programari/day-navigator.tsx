"use client";

import { useState } from "react";
import { format, addDays, subDays, parseISO, isBefore, startOfDay } from "date-fns";
import { ro } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DayNavigatorProps {
  date: string;
  onChange: (date: string) => void;
}

export function DayNavigator({ date, onChange }: DayNavigatorProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
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

      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger
          className={cn(
            "flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-sm font-medium capitalize min-w-0 truncate hover:bg-[#F9FAFB] transition-colors cursor-pointer",
            isCurrentDay && "text-[#1877F2] border-[#1877F2]/30"
          )}
        >
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" />
          {label}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={parsed}
            onSelect={(day) => {
              if (day) {
                onChange(format(day, "yyyy-MM-dd"));
                setCalendarOpen(false);
              }
            }}
            defaultMonth={parsed}
            disabled={(day) => isBefore(day, startOfDay(new Date()))}
            locale={ro}
          />
        </PopoverContent>
      </Popover>

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
