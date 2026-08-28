"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchAll } from "@/lib/fetch-all";
import { Users, Search, Phone, Mail, Car } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { motion } from "framer-motion";

interface ClientiClientProps {
  statieId: string;
}

export function ClientiClient({ statieId }: ClientiClientProps) {
  const [search, setSearch] = useState("");
  const supabase = createClient();

  const { data: clienti, isLoading } = useQuery({
    queryKey: ["clienti-list", statieId],
    queryFn: async () => {
      return fetchAll((from, to) =>
        supabase
          .from("clienti")
          .select(`
            id, nume, prenume, telefon, email, created_at,
            vehicule(id, nr_inmatriculare, expirare_itp)
          `)
          .eq("statie_id", statieId)
          .order("created_at", { ascending: false })
          .order("id", { ascending: true })
          .range(from, to)
      );
    },
  });

  const filtered = clienti?.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.nume.toLowerCase().includes(q) ||
      c.prenume?.toLowerCase().includes(q) ||
      c.telefon.includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută după nume, telefon, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <Badge variant="secondary" className="self-center text-xs">
          {filtered?.length ?? 0} clienți
        </Badge>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
            >
              <Card className="border-border shadow-none hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {client.nume} {client.prenume ?? ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {client.vehicule?.length ?? 0} vehicul(e)
                      </p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {client.telefon}
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.vehicule && client.vehicule.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Car className="h-3 w-3" />
                        {client.vehicule
                          .map((v) => v.nr_inmatriculare)
                          .join(", ")}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="Niciun client"
          description={
            search
              ? "Niciun client nu corespunde căutării."
              : "Adaugă primul tău client pentru a începe."
          }
          action={
            search
              ? undefined
              : { label: "Adaugă client", onClick: () => {} }
          }
        />
      )}
    </>
  );
}
