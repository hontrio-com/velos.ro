"use client";

import { Car, Truck, Bike, Bus, Package, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TarifVehicul = { pret: number; durata_extra: number };
export type TarifeMap = Record<string, TarifVehicul>;

const TIP_VEHICULE = [
  { key: "autoturism", label: "Autoturism", Icon: Car, color: "bg-blue-50 text-blue-600" },
  { key: "autoutilitara", label: "Autoutilitară", Icon: Truck, color: "bg-violet-50 text-violet-600" },
  { key: "motocicleta", label: "Motocicletă", Icon: Bike, color: "bg-orange-50 text-orange-600" },
  { key: "autocamion", label: "Autocamion", Icon: Zap, color: "bg-slate-100 text-slate-600" },
  { key: "autobuz", label: "Autobuz", Icon: Bus, color: "bg-green-50 text-green-600" },
  { key: "remorca", label: "Remorcă", Icon: Package, color: "bg-amber-50 text-amber-600" },
];

const DURATE_EXTRA = [0, 15, 30, 45, 60];

interface TarifeEditorProps {
  value: TarifeMap;
  onChange: (val: TarifeMap) => void;
}

const DEFAULT_TARIFE: Record<string, TarifVehicul> = {
  autoturism: { pret: 150, durata_extra: 0 },
  autoutilitara: { pret: 200, durata_extra: 15 },
  motocicleta: { pret: 120, durata_extra: 0 },
  autocamion: { pret: 350, durata_extra: 30 },
  autobuz: { pret: 300, durata_extra: 30 },
  remorca: { pret: 180, durata_extra: 0 },
};

export function TarifeEditor({ value, onChange }: TarifeEditorProps) {
  const tarife = { ...DEFAULT_TARIFE, ...value };

  function update(key: string, field: keyof TarifVehicul, val: number) {
    onChange({
      ...tarife,
      [key]: { ...tarife[key], [field]: val },
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="pb-3 text-left font-medium text-muted-foreground">
              Tip vehicul
            </th>
            <th className="pb-3 text-left font-medium text-muted-foreground pl-4">
              Tarif (RON)
            </th>
            <th className="pb-3 text-left font-medium text-muted-foreground pl-4">
              Durată extra
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {TIP_VEHICULE.map((tip) => {
            const t = tarife[tip.key] ?? { pret: 0, durata_extra: 0 };
            return (
              <tr key={tip.key}>
                <td className="py-3 pr-4">
                  <span className="flex items-center gap-2.5">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-md ${tip.color}`}>
                      <tip.Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="font-medium">{tip.label}</span>
                  </span>
                </td>
                <td className="py-3 pl-4 pr-4">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      value={t.pret}
                      onChange={(e) =>
                        update(tip.key, "pret", Number(e.target.value))
                      }
                      className="w-24 h-8 text-sm"
                    />
                    <span className="text-muted-foreground text-xs">RON</span>
                  </div>
                </td>
                <td className="py-3 pl-4">
                  <Select
                    value={String(t.durata_extra)}
                    onValueChange={(v) =>
                      update(tip.key, "durata_extra", Number(v))
                    }
                  >
                    <SelectTrigger className="w-28 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATE_EXTRA.map((d) => (
                        <SelectItem key={d} value={String(d)}>
                          +{d} min
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
