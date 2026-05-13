"use client";

import { Minus, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type ProgramZi = { start: string; end: string } | null;
export type ProgramLucru = Record<string, ProgramZi>;

interface ProgramEditorProps {
  value: ProgramLucru;
  onChange: (val: ProgramLucru) => void;
  durataSlot: number;
  nrLinii: number;
  onDurataChange: (val: number) => void;
  onNrLiniiChange: (val: number) => void;
}

const ZILE = [
  { key: "luni", label: "Luni" },
  { key: "marti", label: "Marți" },
  { key: "miercuri", label: "Miercuri" },
  { key: "joi", label: "Joi" },
  { key: "vineri", label: "Vineri" },
  { key: "sambata", label: "Sâmbătă" },
  { key: "duminica", label: "Duminică" },
];

const DURATE_SLOT = [15, 20, 30, 45, 60];

function genereazaOre(): string[] {
  const ore: string[] = [];
  for (let h = 6; h <= 22; h++) {
    ore.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 22) ore.push(`${String(h).padStart(2, "0")}:30`);
  }
  return ore;
}

const ORE = genereazaOre();

function calculeazaSloturi(
  program: ProgramLucru,
  durata: number,
  linii: number
): number {
  const zileActive = Object.values(program).filter(Boolean);
  if (zileActive.length === 0 || durata === 0) return 0;

  let totalMinuteZi = 0;
  let zileCount = 0;
  for (const zi of zileActive) {
    if (!zi) continue;
    const [sh, sm] = zi.start.split(":").map(Number);
    const [eh, em] = zi.end.split(":").map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff > 0) { totalMinuteZi += diff; zileCount++; }
  }
  if (zileCount === 0) return 0;
  return Math.floor((totalMinuteZi / zileCount / durata) * linii);
}

function formatProgram(program: ProgramLucru): string {
  const activ = ZILE.filter((z) => program[z.key]);
  if (activ.length === 0) return "Nicio zi activă";

  const ref = program[activ[0].key];
  const lv = ZILE.slice(0, 5).every((z) => {
    const p = program[z.key];
    return p && ref && p.start === ref.start && p.end === ref.end;
  });

  if (lv && activ.length === 5 && !program["sambata"] && !program["duminica"]) {
    const p = program["luni"]!;
    return `Luni-Vineri, ${p.start}-${p.end}`;
  }
  return activ.map((z) => {
    const p = program[z.key]!;
    return `${z.label}, ${p.start}-${p.end}`;
  }).join(" | ");
}

export function ProgramEditor({
  value,
  onChange,
  durataSlot,
  nrLinii,
  onDurataChange,
  onNrLiniiChange,
}: ProgramEditorProps) {
  function toggleZi(key: string, checked: boolean) {
    onChange({
      ...value,
      [key]: checked ? { start: "08:00", end: "17:00" } : null,
    });
  }

  function setOra(key: string, field: "start" | "end", ora: string) {
    const zi = value[key];
    if (!zi) return;
    onChange({ ...value, [key]: { ...zi, [field]: ora } });
  }

  function aplicaLvLaToate() {
    const luni = value["luni"];
    if (!luni) return;
    const updated: ProgramLucru = { ...value };
    for (const z of ZILE) {
      if (updated[z.key]) updated[z.key] = { ...luni };
    }
    onChange(updated);
  }

  const sloturiZi = calculeazaSloturi(value, durataSlot, nrLinii);

  return (
    <div className="space-y-6">
      {/* Grid zile */}
      <div className="space-y-3">
        {ZILE.map((zi) => {
          const activ = Boolean(value[zi.key]);
          const program = value[zi.key];

          return (
            <div key={zi.key} className="flex items-center gap-3">
              <Switch
                checked={activ}
                onCheckedChange={(c) => toggleZi(zi.key, c)}
                id={`zi-${zi.key}`}
              />
              <Label
                htmlFor={`zi-${zi.key}`}
                className="w-24 text-sm font-medium cursor-pointer"
              >
                {zi.label}
              </Label>

              {activ && program ? (
                <div className="flex items-center gap-2">
                  <Select
                    value={program.start}
                    onValueChange={(v) => { if (v) setOra(zi.key, "start", v); }}
                  >
                    <SelectTrigger className="w-24 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORE.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Minus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <Select
                    value={program.end}
                    onValueChange={(v) => { if (v) setOra(zi.key, "end", v); }}
                  >
                    <SelectTrigger className="w-24 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORE.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Zi liberă</span>
              )}
            </div>
          );
        })}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={aplicaLvLaToate} className="text-xs">
        Aplică programul Luni-Vineri la toate zilele active
      </Button>

      <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
        <span className="text-muted-foreground">Program: </span>
        <span className="font-medium">{formatProgram(value)}</span>
      </div>

      {/* Capacitate */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Nr. linii de inspecție</Label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNrLiniiChange(Math.max(1, nrLinii - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm hover:bg-accent"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-medium">{nrLinii}</span>
            <button
              type="button"
              onClick={() => onNrLiniiChange(Math.min(10, nrLinii + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm hover:bg-accent"
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Durata slot</Label>
          <Select
            value={String(durataSlot)}
            onValueChange={(v) => { if (v) onDurataChange(Number(v)); }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATE_SLOT.map((d) => (
                <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {sloturiZi > 0 && (
        <div className="flex items-center gap-2.5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <Info className="h-4 w-4 shrink-0" />
          <span>
            <strong>{sloturiZi}</strong> sloturi disponibile pe zi ({nrLinii} {nrLinii === 1 ? "linie" : "linii"} x {durataSlot} min)
          </span>
        </div>
      )}
    </div>
  );
}
