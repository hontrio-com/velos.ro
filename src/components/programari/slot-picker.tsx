"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { parseISO, getDay } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ZILE_MAP: Record<number, string> = {
  1: "luni",
  2: "marti",
  3: "miercuri",
  4: "joi",
  5: "vineri",
  6: "sambata",
  0: "duminica",
};

interface SlotPickerProps {
  statieId: string;
  date: string;
  selected: string | null;
  onSelect: (slot: string) => void;
  excludeProgramareId?: string;
}

export function SlotPicker({
  statieId,
  date,
  selected,
  onSelect,
  excludeProgramareId,
}: SlotPickerProps) {
  const supabase = createClient();

  const { data, isLoading } = useQuery({
    queryKey: ["slots", statieId, date, excludeProgramareId],
    queryFn: async () => {
      const [{ data: statie }, { data: rawProgramari }] = await Promise.all([
        supabase
          .from("statii")
          .select("program_lucru, durata_slot_minute, nr_linii")
          .eq("id", statieId)
          .single(),
        supabase
          .from("programari")
          .select("id, ora_start, status")
          .eq("statie_id", statieId)
          .eq("data_programare", date)
          .neq("status", "anulat"),
      ]);

      const programari = (rawProgramari ?? []).filter(
        (p) => p.id !== excludeProgramareId
      );

      return { statie, programari };
    },
    enabled: !!statieId && !!date,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {[...Array(12)].map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
    );
  }

  const statie = data?.statie;
  if (!statie) {
    return (
      <p className="text-sm text-muted-foreground">
        Nu s-au putut incarca sloturile.
      </p>
    );
  }

  const dayOfWeek = getDay(parseISO(date + "T12:00:00"));
  const dayKey = ZILE_MAP[dayOfWeek];
  const program = (
    statie.program_lucru as Record<
      string,
      { start: string; end: string } | null
    >
  )?.[dayKey];

  if (!program) {
    return (
      <div className="rounded-xl bg-muted/50 border border-border px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          Statia este inchisa in aceasta zi.
        </p>
      </div>
    );
  }

  const durata = statie.durata_slot_minute ?? 30;
  const nrLinii = statie.nr_linii ?? 1;

  const [startH, startM] = program.start.split(":").map(Number);
  const [endH, endM] = program.end.split(":").map(Number);

  const slots: string[] = [];
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current + durata <= end) {
    const h = String(Math.floor(current / 60)).padStart(2, "0");
    const m = String(current % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
    current += durata;
  }

  const counts: Record<string, number> = {};
  for (const p of data?.programari ?? []) {
    const key = p.ora_start.slice(0, 5);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-xl bg-muted/50 border border-border px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          Niciun slot disponibil pentru aceasta zi.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {slots.map((slot) => {
        const taken = counts[slot] ?? 0;
        const available = taken < nrLinii;
        const isSelected = selected === slot;
        const libere = nrLinii - taken;

        return (
          <button
            key={slot}
            type="button"
            disabled={!available}
            onClick={() => available && onSelect(slot)}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border py-2.5 text-sm font-medium transition-all",
              isSelected
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : available
                  ? "border-border bg-card hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                  : "border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50"
            )}
          >
            <span>{slot}</span>
            {nrLinii > 1 && (
              <span className="text-[10px] mt-0.5 opacity-70">
                {available ? `${libere}/${nrLinii} liber` : "Ocupat"}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
