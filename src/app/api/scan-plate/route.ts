import { NextRequest, NextResponse } from "next/server";

let _anthropic: import("@anthropic-ai/sdk").default | null = null;
function getAnthropic() {
  if (!_anthropic) {
    const Anthropic = require("@anthropic-ai/sdk").default;
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic!;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const image = formData.get("image") as File | null;

  if (!image) {
    return NextResponse.json({ plate: null, error: "No image provided" }, { status: 400 });
  }

  const bytes = await image.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mediaType = (
    image.type === "image/png" ? "image/png" :
    image.type === "image/gif" ? "image/gif" :
    image.type === "image/webp" ? "image/webp" :
    "image/jpeg"
  ) as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  const response = await getAnthropic().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 50,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          {
            type: "text",
            text: `Extract the Romanian license plate number from this image.
Romanian plates follow these formats:
- "B 123 ABC" (Bucharest: 1 letter + 3 digits + 3 letters)
- "CJ 12 ABC" (county: 2 letters + 2-3 digits + 2-3 letters)

Return ONLY the plate number formatted as "XX 123 ABC" with single spaces. If no plate is visible or readable, return exactly: null`,
          },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text.trim() : "";

  if (text === "null" || !text) {
    return NextResponse.json({ plate: null });
  }

  // Validate it matches a Romanian plate pattern
  const platePattern = /^[A-Z]{1,2}\s+\d{2,3}\s+[A-Z]{2,3}$/;
  // Also try to extract it if Claude returned extra text
  const extractPattern = /\b([A-Z]{1,2})\s*(\d{2,3})\s*([A-Z]{2,3})\b/;
  const match = text.match(extractPattern);

  if (!match) {
    return NextResponse.json({ plate: null });
  }

  const plate = `${match[1]} ${match[2]} ${match[3]}`;
  return NextResponse.json({ plate });
}
