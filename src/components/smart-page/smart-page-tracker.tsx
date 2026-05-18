"use client";

import { useEffect } from "react";

export function SmartPageTracker({ statieId }: { statieId: string }) {
  useEffect(() => {
    fetch("/api/track/smart-page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statieId, referer: document.referrer }),
      keepalive: true,
    }).catch(() => {});
  }, [statieId]);

  return null;
}
