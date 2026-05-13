"use client";

import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/remindere-generator";

interface ReminderStatusBadgeProps {
  status: string;
  className?: string;
}

export function ReminderStatusBadge({ status, className }: ReminderStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    colorClass: "text-[#9CA3AF]",
    bgClass: "bg-[#F3F4F6]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        cfg.bgClass,
        cfg.colorClass,
        className
      )}
    >
      {cfg.label}
    </span>
  );
}
