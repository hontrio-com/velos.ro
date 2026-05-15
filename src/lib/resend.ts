import { Resend } from "resend";

let _resend: Resend | null = null;

function getResendInstance(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export const resend = new Proxy({} as Resend, {
  get(_, prop: string | symbol) {
    return (getResendInstance() as any)[prop as string];
  },
});

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
