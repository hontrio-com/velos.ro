import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY lipseste din env" }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: "Velos.ro <noreply@velos.ro>",
    to: request.nextUrl.searchParams.get("to") ?? "test@resend.dev",
    subject: "Test email Velos.ro",
    html: "<p>Test email trimis cu succes de pe velos.ro</p>",
  });

  if (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }

  return NextResponse.json({ success: true, id: data?.id, apiKeyPrefix: apiKey.slice(0, 8) + "..." });
}
