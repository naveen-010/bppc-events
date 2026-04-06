'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Event, FilterState } from '@/types';
import EventCard from '@/components/EventCard';
import FilterBar from '@/components/FilterBar';

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    fee: 'all',
    search: '',
  });
  const supabase = createClient();

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_tags (tag),
        interested:interested(count),
        registered:registered(count)
      `)
      .order('event_date', { ascending: true });

    if (!error && data) {
      const eventsWithTags = data.map((event: any) => ({
        ...event,
        tags: event.event_tags?.map((t: any) => t.tag) || [],
        interested_count: event.interested?.[0]?.count || 0,
        registered_count: event.registered?.[0]?.count || 0,
      }));
      setEvents(eventsWithTags);
    }
    setLoading(false);
  }

  const filteredEvents = events.filter((event) => {
    if (filters.category !== 'all' && event.category !== filters.category) return false;
    if (filters.fee === 'free' && event.fee !== 0) return false;
    if (filters.fee === 'paid' && event.fee === 0) return false;
    if (filters.search && !event.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Upcoming Events at BPPC
        </h1>
        <p className="text-gray-600">
          Discover workshops, competitions, talks, and more
        </p>
      </div>

      <FilterBar filters={filters} onFilterChange={setFilters} />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-500">Try adjusting your filters or check back later</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
