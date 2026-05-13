"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Users, Car } from "lucide-react";

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ClientResult {
  id: string;
  nume: string;
  prenume: string | null;
  telefon: string;
}

interface VehiculResult {
  id: string;
  nr_inmatriculare: string;
  marca: string | null;
  model: string | null;
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter();
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [clienti, setClienti] = useState<ClientResult[]>([]);
  const [vehicule, setVehicule] = useState<VehiculResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setClienti([]);
        setVehicule([]);
        return;
      }
      setLoading(true);
      const [{ data: c }, { data: v }] = await Promise.all([
        supabase
          .from("clienti")
          .select("id, nume, prenume, telefon")
          .or(`nume.ilike.%${q}%,prenume.ilike.%${q}%,telefon.ilike.%${q}%`)
          .limit(5),
        supabase
          .from("vehicule")
          .select("id, nr_inmatriculare, marca, model")
          .ilike("nr_inmatriculare", `%${q}%`)
          .limit(5),
      ]);
      setClienti(c ?? []);
      setVehicule(v ?? []);
      setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setClienti([]);
      setVehicule([]);
    }
  }, [open]);

  function navigate(href: string) {
    router.push(href);
    onOpenChange(false);
  }

  const hasResults = clienti.length > 0 || vehicule.length > 0;

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Caută"
      description="Caută clienți, vehicule sau programări"
    >
      <Command>
        <CommandInput
          placeholder="Caută client, vehicul, nr. înmatriculare..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {!loading && query.trim() && !hasResults && (
            <CommandEmpty>Niciun rezultat pentru „{query}"</CommandEmpty>
          )}
          {clienti.length > 0 && (
            <CommandGroup heading="Clienți">
              {clienti.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`client-${c.id}-${c.nume}`}
                  onSelect={() => navigate("/clienti")}
                >
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {c.nume}
                      {c.prenume ? ` ${c.prenume}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.telefon}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {vehicule.length > 0 && (
            <>
              {clienti.length > 0 && <CommandSeparator />}
              <CommandGroup heading="Vehicule">
                {vehicule.map((v) => (
                  <CommandItem
                    key={v.id}
                    value={`vehicul-${v.id}-${v.nr_inmatriculare}`}
                    onSelect={() => navigate("/vehicule")}
                  >
                    <Car className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium font-mono truncate">
                        {v.nr_inmatriculare}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[v.marca, v.model].filter(Boolean).join(" ") || "—"}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
