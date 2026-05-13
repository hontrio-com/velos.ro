"use client";

import { useState } from "react";
import { Loader2, MessageSquare, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { countSmsChars } from "@/lib/sms-utils";
import { trimiteReminderAction } from "@/lib/actions/remindere";
import { cn } from "@/lib/utils";

interface TrimiteSmsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminderId: string;
  telefon: string;
  numeClient: string;
  mesajInitial: string;
  onSuccess?: () => void;
}

export function TrimiteSmsDialog({
  open,
  onOpenChange,
  reminderId,
  telefon,
  numeClient,
  mesajInitial,
  onSuccess,
}: TrimiteSmsDialogProps) {
  const [mesaj, setMesaj] = useState(mesajInitial);
  const [loading, setLoading] = useState(false);
  const { chars, smsCount, remaining } = countSmsChars(mesaj);

  async function handleSend() {
    setLoading(true);
    const result = await trimiteReminderAction(reminderId);
    setLoading(false);

    if (result.success) {
      toast.success("SMS trimis cu succes!");
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(result.error ?? "Eroare la trimitere");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-[#1877F2]" />
            Trimite SMS
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Recipient */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-white border border-[#E5E7EB]">
            <Phone className="h-4 w-4 text-[#6B7280] shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#111318]">{numeClient}</p>
              <p className="text-xs text-[#6B7280] font-mono">{telefon}</p>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#6B7280]">Mesaj</Label>
            <Textarea
              value={mesaj}
              onChange={(e) => setMesaj(e.target.value)}
              rows={4}
              className="text-sm resize-none"
              placeholder="Mesajul SMS..."
              maxLength={600}
            />
            <div className="flex justify-between text-[10px] text-[#9CA3AF]">
              <span>{chars} caractere</span>
              <span
                className={cn(
                  "font-medium",
                  smsCount > 1 ? "text-amber-600" : "text-[#9CA3AF]"
                )}
              >
                {smsCount} SMS · {remaining} rămas
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Anulează
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={loading || !mesaj.trim()}
            className="gap-1.5"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MessageSquare className="h-3.5 w-3.5" />
            )}
            Trimite SMS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
