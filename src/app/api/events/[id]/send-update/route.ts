import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const { message } = await request.json();

    const supabase = await createAdminClient();

    const { data: event } = await supabase
      .from('events')
      .select('title')
      .eq('id', eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const { data: registrations } = await supabase
      .from('registered')
      .select('user_id, users:user_id (email, full_name)')
      .eq('event_id', eventId);

    if (!registrations || registrations.length === 0) {
      return NextResponse.json({ error: 'No registrations found' }, { status: 400 });
    }

    const emails = registrations
      .map((r: any) => (r.users as any)?.email)
      .filter(Boolean);

    if (emails.length > 0) {
      const { data, error } = await resend.emails.send({
        from: 'BPPC Events <events@bppc.dev>',
        to: emails,
        subject: `Update: ${event.title}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Event Update</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #111; margin: 0 0 10px 0;">${event.title}</h3>
              <p style="color: #555; margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            <p style="color: #888; font-size: 12px;">
              You received this because you registered for this event on BPPC Events.
            </p>
          </div>
        `,
      });

      if (error) {
        console.error('Email error:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
      }

      return NextResponse.json({ success: true, sent: emails.length });
    }

    return NextResponse.json({ success: true, sent: 0 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
