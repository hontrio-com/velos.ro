"use client";

import { useState } from "react";
import { Loader2, Save, RotateCcw, Eye, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { saveTemplateAction, resetTemplateAction } from "@/lib/actions/remindere";
import {
  TIP_CONFIG,
  DEFAULT_TEMPLATES,
  PREVIEW_VARS,
  ALL_VARS,
  ITP_TIPS,
} from "@/lib/remindere-generator";
import type { TipReminder } from "@/lib/remindere-generator";
import { countSmsChars, interpolateTemplate } from "@/lib/sms-utils";
import { cn } from "@/lib/utils";

interface TabTemplatesProps {
  templates: Record<TipReminder, string | null>;
  onUpdate: () => void;
}

export function TabTemplates({ templates, onUpdate }: TabTemplatesProps) {
  const allTips: TipReminder[] = [
    "30_zile",
    "15_zile",
    "7_zile",
    "3_zile",
    "1_zi",
    "expirat",
    "confirmare_programare",
    "ziua_programarii",
  ];

  const [activeTip, setActiveTip] = useState<TipReminder>(allTips[0]);
  const [drafts, setDrafts] = useState<Partial<Record<TipReminder, string>>>({});
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [preview, setPreview] = useState(false);

  const savedTemplate = templates[activeTip] ?? DEFAULT_TEMPLATES[activeTip] ?? "";
  const currentText = drafts[activeTip] ?? savedTemplate;
  const isDirty = currentText !== savedTemplate;
  const isCustom = !!templates[activeTip];

  const { chars, smsCount, remaining } = countSmsChars(currentText);
  const previewText = interpolateTemplate(currentText, PREVIEW_VARS);

  function insertVar(v: string) {
    setDrafts((d) => ({ ...d, [activeTip]: (d[activeTip] ?? savedTemplate) + v }));
  }

  async function handleSave() {
    setSaving(true);
    const result = await saveTemplateAction(activeTip, currentText);
    setSaving(false);
    if (result.success) {
      toast.success("Template salvat!");
      setDrafts((d) => { const n = { ...d }; delete n[activeTip]; return n; });
      onUpdate();
    } else {
      toast.error(result.error ?? "Eroare la salvare");
    }
  }

  async function handleReset() {
    setResetting(true);
    const result = await resetTemplateAction(activeTip);
    setResetting(false);
    if (result.success) {
      toast.success("Resetat la template global");
      setDrafts((d) => { const n = { ...d }; delete n[activeTip]; return n; });
      onUpdate();
    } else {
      toast.error(result.error ?? "Eroare");
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
      {/* Left: tip selector */}
      <div className="space-y-1">
        {allTips.map((tip) => {
          const cfg = TIP_CONFIG[tip];
          const hasCustom = !!templates[tip];
          const hasDraft = !!drafts[tip];
          return (
            <button
              key={tip}
              onClick={() => setActiveTip(tip)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-colors",
                activeTip === tip
                  ? "bg-[#EFF6FF] text-[#1877F2] font-medium"
                  : "hover:bg-white text-[#6B7280]"
              )}
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  activeTip === tip ? "bg-[#1877F2]" : cfg.bgClass.replace("bg-", "bg-").replace("50", "400")
                )}
              />
              <span className="flex-1 truncate">{cfg.label}</span>
              {hasDraft && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              )}
              {hasCustom && !hasDraft && (
                <Badge className="border-0 bg-[#DCFCE7] text-[#15803D] text-[9px] px-1 py-0 shrink-0">
                  custom
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Right: editor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#111318]">
              {TIP_CONFIG[activeTip].label}
            </h3>
            {isCustom ? (
              <Badge className="border-0 bg-[#DCFCE7] text-[#15803D] text-xs">
                Template personalizat
              </Badge>
            ) : (
              <Badge className="border-0 bg-[#F7F8FA] text-[#6B7280] text-xs">
                Template global
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 text-xs"
              onClick={() => setPreview((v) => !v)}
            >
              <Eye className="h-3.5 w-3.5" />
              {preview ? "Editor" : "Preview"}
            </Button>
          </div>
        </div>

        {/* Variable chips */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-[#9CA3AF] self-center">Variabile:</span>
          {ALL_VARS.map((v) => (
            <button
              key={v}
              onClick={() => insertVar(v)}
              className="px-2 py-0.5 rounded-md bg-[#F7F8FA] text-[#1877F2] text-xs font-mono hover:bg-[#DBEAFE] transition-colors"
            >
              {v}
            </button>
          ))}
        </div>

        {preview ? (
          /* Preview */
          <div className="p-4 rounded-xl bg-white border border-[#E5E7EB]">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-[#6B7280]" />
              <span className="text-xs font-medium text-[#6B7280]">Preview SMS</span>
            </div>
            <div className="bg-white rounded-lg p-3 border border-[#E5E7EB]">
              <p className="text-sm text-[#111318] whitespace-pre-wrap leading-relaxed">
                {previewText || <span className="text-[#9CA3AF] italic">Mesaj gol</span>}
              </p>
            </div>
            <p className="text-[10px] text-[#9CA3AF] mt-2">
              Date de test: {Object.entries(PREVIEW_VARS)
                .map(([k, v]) => `{{${k}}}=${v}`)
                .join(" · ")}
            </p>
          </div>
        ) : (
          /* Editor */
          <div className="space-y-1.5">
            <Textarea
              value={currentText}
              onChange={(e) =>
                setDrafts((d) => ({ ...d, [activeTip]: e.target.value }))
              }
              rows={5}
              className="text-sm resize-none font-mono"
              placeholder="Scrie template-ul SMS..."
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
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="gap-1.5 bg-[#1877F2] hover:bg-[#1565D8] text-white"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Salvează
          </Button>

          {isCustom && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              disabled={resetting}
              className="gap-1.5 text-[#6B7280]"
            >
              {resetting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              Resetează la global
            </Button>
          )}

          {isDirty && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setDrafts((d) => { const n = { ...d }; delete n[activeTip]; return n; })
              }
              className="text-xs text-[#9CA3AF]"
            >
              Renunță
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
