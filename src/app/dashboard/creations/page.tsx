'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';
import { Plus, Settings, Trash2, Calendar } from 'lucide-react';

export default function MyCreations() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data } = await supabase.auth.getUser();
    
    if (!data.user) {
      router.push('/auth/login?next=/dashboard/creations');
      return;
    }
    
    setUser(data.user);
    fetchEvents(data.user.id);
  }

  async function fetchEvents(userId: string) {
    setLoading(true);
    
    const { data } = await supabase
      .from('events')
      .select(`
        *,
        interested:interested(count),
        registered:registered(count)
      `)
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    setEvents(data || []);
    setLoading(false);
  }

  async function deleteEvent(eventId: string) {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    
    await supabase.from('events').delete().eq('id', eventId);
    setEvents(events.filter((e) => e.id !== eventId));
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="animate-pulse">
          <div className="h-8 w-1/3 bg-[var(--muted)] rounded mb-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">My Created Events</h1>
          <p className="text-[var(--muted-foreground)]">Events you have created</p>
        </div>
        <Link
          href="/events/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] font-medium rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[var(--card)] rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 bg-[var(--card)] rounded-2xl border">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--muted)] flex items-center justify-center">
            <Calendar className="w-8 h-8 text-[var(--muted-foreground)]" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No events created yet</h3>
          <p className="text-[var(--muted-foreground)] mb-6">Create your first event to get started</p>
          <Link
            href="/events/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="bg-[var(--card)] rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <Link href={`/events/${event.id}`} className="text-lg font-semibold hover:text-[var(--primary)] transition-colors">
                  {event.title}
                </Link>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDateTime(event.event_date)}
                  </span>
                  <span className="text-amber-500">{event.interested?.[0]?.count || 0} interested</span>
                  <span className="text-emerald-500">{event.registered?.[0]?.count || 0} registered</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/events/${event.id}/manage`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--muted)] rounded-xl hover:bg-[var(--accent)] transition-colors text-sm font-medium"
                >
                  <Settings className="w-4 h-4" />
                  Manage
                </Link>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
