'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EventCard from '@/components/EventCard';
import { Event } from '@/types';
import { Heart, Check, Plus, Calendar } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<'interested' | 'registered'>('registered');
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
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="animate-pulse">
          <div className="h-8 w-1/3 bg-[var(--muted)] rounded mb-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-[var(--muted-foreground)]">Track your events and registrations</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-8">
        <button
          onClick={() => setTab('registered')}
          className={`flex items-center gap-2 px-5 py-2.5 font-medium rounded-xl transition-all ${
            tab === 'registered'
              ? 'bg-emerald-500 text-white'
              : 'bg-[var(--muted)] hover:bg-[var(--accent)]'
          }`}
        >
          <Check className="w-4 h-4" />
          Registered
        </button>
        <button
          onClick={() => setTab('interested')}
          className={`flex items-center gap-2 px-5 py-2.5 font-medium rounded-xl transition-all ${
            tab === 'interested'
              ? 'bg-amber-500 text-white'
              : 'bg-[var(--muted)] hover:bg-[var(--accent)]'
          }`}
        >
          <Heart className="w-4 h-4" />
          Interested
        </button>
        <div className="ml-auto">
          <Link
            href="/dashboard/creations"
            className="flex items-center gap-2 px-5 py-2.5 font-medium rounded-xl bg-[var(--muted)] hover:bg-[var(--accent)] transition-all"
          >
            <Calendar className="w-4 h-4" />
            My Creations
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[var(--card)] rounded-2xl h-72 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 bg-[var(--card)] rounded-2xl border">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--muted)] flex items-center justify-center">
            {tab === 'registered' ? (
              <Check className="w-8 h-8 text-[var(--muted-foreground)]" />
            ) : (
              <Heart className="w-8 h-8 text-[var(--muted-foreground)]" />
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {tab === 'interested' ? 'No interested events' : 'No registered events'}
          </h3>
          <p className="text-[var(--muted-foreground)] mb-6">
            {tab === 'interested'
              ? 'Browse events and mark the ones you are interested in'
              : 'Register for events you have signed up for'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
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
