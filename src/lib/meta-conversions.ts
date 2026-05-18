import crypto from "crypto";

const PIXEL_ID = process.env.META_PIXEL_ID ?? "1013846584554854";
const ACCESS_TOKEN = process.env.META_PIXEL_ACCESS_TOKEN;
const API_VERSION = "v21.0";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export interface MetaEventUser {
  email?: string;
  firstName?: string;
  lastName?: string;
  externalId?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
}

interface MetaEventOptions {
  eventName: string;
  eventId: string;
  sourceUrl: string;
  user: MetaEventUser;
  customData?: Record<string, unknown>;
}

export async function sendMetaEvent(options: MetaEventOptions): Promise<void> {
  if (!ACCESS_TOKEN) return;

  const { eventName, eventId, sourceUrl, user, customData } = options;

  const userData: Record<string, unknown> = {};
  if (user.email) userData.em = [sha256(user.email)];
  if (user.firstName) userData.fn = [sha256(user.firstName)];
  if (user.lastName) userData.ln = [sha256(user.lastName)];
  if (user.externalId) userData.external_id = [sha256(user.externalId)];
  if (user.userAgent) userData.client_user_agent = user.userAgent;
  if (user.fbc) userData.fbc = user.fbc;
  if (user.fbp) userData.fbp = user.fbp;

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: sourceUrl,
        user_data: userData,
        ...(customData ? { custom_data: customData } : {}),
      },
    ],
    access_token: ACCESS_TOKEN,
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      console.error("[meta-conversions] API error:", await res.text());
    }
  } catch (err) {
    console.error("[meta-conversions] Network error:", err);
  }
}
