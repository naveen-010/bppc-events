import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/resend';

export async function POST(request: Request) {
  try {
    const { feedback, email: userEmail } = await request.json();

    if (!feedback || feedback.trim().length < 5) {
      return NextResponse.json({ error: 'Feedback is too short' }, { status: 400 });
    }

    const html = `
      <h2>New Feedback from BPPC Events</h2>
      <p><strong>User Email:</strong> ${userEmail || 'Not provided'}</p>
      <hr />
      <h3>Feedback:</h3>
      <p>${feedback.replace(/\n/g, '<br />')}</p>
      <hr />
      <p style="color: #888; font-size: 12px;">
        Submitted via BPPC Events Portal<br />
        Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
      </p>
    `;

    await sendEmail({
      to: ['f20251159@pilani.bits-pilani.ac.in'],
      subject: `BPPC Events Feedback${userEmail ? ` from ${userEmail}` : ''}`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Failed to send feedback' }, { status: 500 });
  }
}
