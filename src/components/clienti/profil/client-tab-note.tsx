"use client";

import { useState, useRef, useCallback } from "react";
import { Check, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { updateNoteClientAction } from "@/lib/actions/clienti";

interface ClientTabNoteProps {
  clientId: string;
  initialValue: string | null;
}

export function ClientTabNote({ clientId, initialValue }: ClientTabNoteProps) {
  const [value, setValue] = useState(initialValue ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (text: string) => {
      setStatus("saving");
      await updateNoteClientAction(clientId, text);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    },
    [clientId]
  );

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    setValue(v);
    setStatus("idle");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(v), 1000);
  }

  return (
    <div className="bg-white border border-[#F3F4F6] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-[#111318]">Note interne</p>
        {status === "saving" && (
          <span className="flex items-center gap-1 text-xs text-[#9CA3AF]">
            <Loader2 className="h-3 w-3 animate-spin" />
            Salvez...
          </span>
        )}
        {status === "saved" && (
          <span className="flex items-center gap-1 text-xs text-[#15803D]">
            <Check className="h-3 w-3" />
            Salvat
          </span>
        )}
      </div>
      <Textarea
        value={value}
        onChange={handleChange}
        placeholder="Adaugă note interne despre client (vizibile doar pentru tine)..."
        rows={10}
        className="border-[#E5E7EB] text-sm resize-none focus-visible:ring-1"
      />
      <p className="text-[11px] text-[#9CA3AF] mt-2">Salvare automată după 1 secundă de inactivitate.</p>
    </div>
  );
}
