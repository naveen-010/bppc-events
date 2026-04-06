import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string[];
  subject: string;
  html: string;
}) {
  const { data, error } = await resend.emails.send({
    from: 'BPPC Events <events@bppc.dev>',
    to,
    subject,
    html,
  });

  if (error) {
    console.error('Email error:', error);
    return { success: false, error };
  }

  return { success: true, data };
}
