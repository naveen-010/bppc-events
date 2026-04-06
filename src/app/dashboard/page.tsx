'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EventCard from '@/components/EventCard';
import { Event } from '@/types';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<'interested' | 'registered'>('interested');
  const [events, setEvents] = useState<Event[]>([]);
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data } = await supabase.auth.getUser();
    
    if (!data.user) {
      router.push('/auth/login?next=/dashboard');
      return;
    }
    
    setUser(data.user);
    fetchEvents(data.user.id);
  }

  async function fetchEvents(userId: string) {
    setLoading(true);
    
    const table = tab === 'interested' ? 'interested' : 'registered';
    
    const { data, error } = await supabase
      .from(table)
      .select(`
        event_id,
        events (
          *,
          event_tags (tag),
          interested:interested(count),
          registered:registered(count)
        )
      `)
      .eq('user_id', userId);

    if (!error && data) {
      const eventsWithTags = data
        .map((item: any) => ({
          ...item.events,
          tags: item.events?.event_tags?.map((t: any) => t.tag) || [],
          interested_count: item.events?.interested?.[0]?.count || 0,
          registered_count: item.events?.registered?.[0]?.count || 0,
          is_interested: true,
          is_registered: true,
        }))
        .filter(Boolean);
      setEvents(eventsWithTags);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (user) {
      fetchEvents(user.id);
    }
  }, [tab, user]);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-1/3 bg-gray-200 rounded mb-4" />
          <div className="h-4 w-1/4 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome, {user.user_metadata?.full_name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-gray-600">Track your events and registrations</p>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab('interested')}
          className={`px-4 py-2 font-medium rounded-lg transition-colors ${
            tab === 'interested'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Interested ({events.length})
        </button>
        <button
          onClick={() => setTab('registered')}
          className={`px-4 py-2 font-medium rounded-lg transition-colors ${
            tab === 'registered'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Registered ({events.length})
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-5xl mb-4">{tab === 'interested' ? '☆' : '✓'}</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {tab === 'interested' ? 'No interested events' : 'No registered events'}
          </h3>
          <p className="text-gray-500 mb-4">
            {tab === 'interested'
              ? 'Browse events and mark the ones you are interested in'
              : 'Register for events you have signed up for'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
