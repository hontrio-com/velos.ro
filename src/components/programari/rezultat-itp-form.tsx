"use client";

import { useState, useTransition } from "react";
import { format, addYears } from "date-fns";
import { CheckCircle2, XCircle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Rezultat = "admis" | "respins" | "readmis";

interface RezultatExistent {
  id: string;
  rezultat: Rezultat;
  data_inspectie: string;
  expirare_noua: string | null;
  inspector: string | null;
  observatii_tehnice: string | null;
}

interface RezultatItpFormProps {
  programareId: string;
  vehiculId: string;
  initialRezultat?: RezultatExistent | null;
  onSave: () => void;
}

const REZULTATE = [
  {
    value: "admis" as const,
    label: "Admis",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
  },
  {
    value: "respins" as const,
    label: "Respins",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
  },
  {
    value: "readmis" as const,
    label: "Readmis",
    icon: RefreshCw,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
  },
];

export function RezultatItpForm({
  programareId,
  vehiculId,
  initialRezultat,
  onSave,
}: RezultatItpFormProps) {
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  const [rezultat, setRezultat] = useState<Rezultat | null>(
    initialRezultat?.rezultat ?? null
  );
  const [dataInspectie, setDataInspectie] = useState(
    initialRezultat?.data_inspectie ?? format(new Date(), "yyyy-MM-dd")
  );
  const [expirareNoua, setExpirareNoua] = useState(
    initialRezultat?.expirare_noua ?? ""
  );
  const [inspector, setInspector] = useState(
    initialRezultat?.inspector ?? ""
  );
  const [observatii, setObservatii] = useState(
    initialRezultat?.observatii_tehnice ?? ""
  );

  function selectRezultat(rez: Rezultat) {
    setRezultat(rez);
    if (rez === "admis" || rez === "readmis") {
      const base = dataInspectie ? new Date(dataInspectie) : new Date();
      setExpirareNoua(format(addYears(base, 1), "yyyy-MM-dd"));
    } else {
      setExpirareNoua("");
    }
  }

  function salveaza() {
    if (!rezultat) {
      toast.error("Selecteaza rezultatul ITP");
      return;
    }

    startTransition(async () => {
      const payload = {
        programare_id: programareId,
        rezultat,
        data_inspectie: dataInspectie,
        expirare_noua: expirareNoua || null,
        inspector: inspector || null,
        observatii_tehnice: observatii || null,
      };

      const { error } = await supabase
        .from("rezultate_itp")
        .upsert(payload, { onConflict: "programare_id" });

      if (error) {
        toast.error(`Eroare la salvarea rezultatului: ${error.message}`);
        return;
      }

      if ((rezultat === "admis" || rezultat === "readmis") && expirareNoua) {
        await supabase
          .from("vehicule")
          .update({ expirare_itp: expirareNoua })
          .eq("id", vehiculId);
      }

      toast.success("Rezultat ITP salvat!");
      onSave();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {REZULTATE.map(({ value, label, icon: Icon, color, bg }) => (
          <button
            key={value}
            type="button"
            onClick={() => selectRezultat(value)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all",
              rezultat === value
                ? bg + " " + color
                : "border-border hover:bg-muted"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                rezultat === value ? color : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-xs font-semibold",
                rezultat === value ? color : "text-foreground"
              )}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Data inspectie</Label>
          <Input
            type="date"
            value={dataInspectie}
            onChange={(e) => setDataInspectie(e.target.value)}
          />
        </div>
        {rezultat && rezultat !== "respins" && (
          <div className="space-y-1.5">
            <Label>Expira la</Label>
            <Input
              type="date"
              value={expirareNoua}
              onChange={(e) => setExpirareNoua(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Inspector (optional)</Label>
        <Input
          value={inspector}
          onChange={(e) => setInspector(e.target.value)}
          placeholder="Nume inspector"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Observatii tehnice (optional)</Label>
        <Textarea
          value={observatii}
          onChange={(e) => setObservatii(e.target.value)}
          rows={2}
          placeholder="Ex: Uzura placute frana spate..."
        />
      </div>

      <Button onClick={salveaza} disabled={isPending} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {initialRezultat ? "Actualizeaza rezultatul" : "Salveaza rezultatul ITP"}
      </Button>
    </div>
  );
}
