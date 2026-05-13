"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LogoUploaderProps {
  currentUrl?: string | null;
  onUpload: (blob: Blob, ext: string) => Promise<void>;
  onDelete?: () => Promise<void>;
}

function resizeImage(file: File, maxSize = 400): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, maxSize / img.width, maxSize / img.height);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas error"));
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Blob error"));
        resolve(blob);
      }, "image/png");
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function LogoUploader({ currentUrl, onUpload, onDelete }: LogoUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;

      setUploading(true);
      try {
        const blob = await resizeImage(file);
        const objectUrl = URL.createObjectURL(blob);
        setPreview(objectUrl);
        await onUpload(blob, "png");
        toast.success("Logo actualizat!");
      } catch {
        toast.error("Eroare la upload logo");
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".svg", ".webp"],
    },
    maxSize: 2 * 1024 * 1024,
    multiple: false,
    onDrop,
    onDropRejected: () => toast.error("Fișier invalid. Max 2MB, PNG/JPG/SVG/WEBP."),
  });

  async function handleDelete() {
    if (!onDelete) return;
    setUploading(true);
    try {
      await onDelete();
      setPreview(null);
      toast.success("Logo șters");
    } catch {
      toast.error("Eroare la ștergere logo");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative flex h-48 w-48 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed transition-colors",
          isDragActive
            ? "border-primary bg-blue-50"
            : "border-border bg-muted/30 hover:border-primary hover:bg-blue-50/50",
          preview && "border-solid"
        )}
      >
        <input {...getInputProps()} />

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {preview ? (
          <img
            src={preview}
            alt="Logo stație"
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-center px-4">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground leading-snug">
              {isDragActive
                ? "Eliberează pentru upload"
                : "Trage logo-ul aici sau click"}
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              PNG, JPG, SVG, WEBP · max 2MB
            </p>
          </div>
        )}
      </div>

      {preview && onDelete && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={uploading}
          className="gap-2 text-destructive hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
          Șterge logo
        </Button>
      )}
    </div>
  );
}
