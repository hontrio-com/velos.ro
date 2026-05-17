import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

function detectSource(referer: string | null): string {
  if (!referer) return "direct";
  const r = referer.toLowerCase();
  if (r.includes("google.")) return "google";
  if (r.includes("facebook.com") || r.includes("fb.com") || r.includes("l.facebook")) return "facebook";
  if (r.includes("instagram.com")) return "instagram";
  if (r.includes("tiktok.com")) return "tiktok";
  if (r.includes("whatsapp.com") || r.includes("wa.me")) return "whatsapp";
  if (r.includes("twitter.com") || r.includes("t.co") || r.includes("x.com")) return "twitter";
  if (r.includes("velos.ro") || r.includes("localhost")) return "internal";
  return "other";
}

function detectDevice(ua: string | null): string {
  if (!ua) return "desktop";
  const u = ua.toLowerCase();
  if (/tablet|ipad|playbook|silk/.test(u)) return "tablet";
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile|windows phone/.test(u)) return "mobile";
  return "desktop";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { statieId } = body;
    if (!statieId || typeof statieId !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const referer = req.headers.get("referer");
    const ua = req.headers.get("user-agent");

    const source = detectSource(referer);
    if (source === "internal") return NextResponse.json({ ok: true });

    const device = detectDevice(ua);

    const supabase = createServiceClient();
    await (supabase as any).from("smart_page_views").insert({
      statie_id: statieId,
      source,
      device,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
