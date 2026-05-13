import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL = "Velos.ro <noreply@velos.ro>";
export const FROM_SUPPORT = "Velos.ro <support@velos.ro>";

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
}) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    react,
  });

  if (error) {
    console.error("[Resend] Error sending email:", error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data?.id };
}
