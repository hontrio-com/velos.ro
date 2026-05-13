"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteStatieAction } from "@/lib/actions/statii";
import { toast } from "sonner";

interface DeleteStatieDialogProps {
  statieId: string;
  statieNume: string;
  trigger?: React.ReactNode;
}

export function DeleteStatieDialog({
  statieId,
  statieNume,
  trigger,
}: DeleteStatieDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmare, setConfirmare] = useState("");
  const [isPending, startTransition] = useTransition();

  const valid = confirmare === statieNume;

  function handleDelete() {
    if (!valid) return;
    startTransition(async () => {
      const result = await deleteStatieAction(statieId, confirmare);
      if (result && "error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Stație ștearsă");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={<span />} onClick={() => setOpen(true)}>
          {trigger}
        </DialogTrigger>
      ) : (
        <DialogTrigger render={
          <Button variant="destructive" size="sm" className="gap-2" />
        }>
          <Trash2 className="h-4 w-4" />
          Șterge stația
        </DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">
            Șterge stația definitiv
          </DialogTitle>
          <DialogDescription>
            Această acțiune este <strong>ireversibilă</strong>. Vor fi șterse
            toate programările, clienții și datele asociate stației{" "}
            <strong>{statieNume}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label className="text-sm">
            Scrie <strong className="font-semibold">{statieNume}</strong> pentru
            a confirma:
          </Label>
          <Input
            value={confirmare}
            onChange={(e) => setConfirmare(e.target.value)}
            placeholder={statieNume}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Anulează
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!valid || isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Șterge definitiv
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
