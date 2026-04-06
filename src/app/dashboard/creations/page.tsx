'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDateTime, isDeadlinePassed } from '@/lib/utils';

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
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    await supabase.from('events').delete().eq('id', eventId);
    setEvents(events.filter((e) => e.id !== eventId));
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-1/3 bg-gray-200 rounded mb-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Created Events</h1>
          <p className="text-gray-600">Events you have created</p>
        </div>
        <Link
          href="/events/create"
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
        >
          + Create Event
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events created yet</h3>
          <p className="text-gray-500 mb-4">Create your first event to get started</p>
          <Link
            href="/events/create"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
          >
            Create Event
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
              <div className="flex-1">
                <Link href={`/events/${event.id}`} className="text-lg font-semibold text-gray-900 hover:text-indigo-600">
                  {event.title}
                </Link>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span>{formatDateTime(event.event_date)}</span>
                  <span>•</span>
                  <span className="text-amber-600">{event.interested?.[0]?.count || 0} interested</span>
                  <span>•</span>
                  <span className="text-green-600">{event.registered?.[0]?.count || 0} registered</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/events/${event.id}/manage`}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                >
                  Manage
                </Link>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm"
                >
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
