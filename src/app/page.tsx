'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Event, FilterState, SortOption } from '@/types';
import EventCard from '@/components/EventCard';
import FilterBar from '@/components/FilterBar';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    search: '',
    sort: 'event_date_asc',
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
      `);

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

  const filteredAndSortedEvents = events
    .filter((event) => {
      if (filters.category !== 'all' && event.category !== filters.category) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(searchLower);
        const matchesDescription = event.description?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesDescription) return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (filters.sort) {
        case 'event_date_asc':
          return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
        case 'event_date_desc':
          return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
        case 'deadline_asc':
          const aDeadline = a.registration_deadline ? new Date(a.registration_deadline).getTime() : Infinity;
          const bDeadline = b.registration_deadline ? new Date(b.registration_deadline).getTime() : Infinity;
          return aDeadline - bDeadline;
        case 'deadline_desc':
          const aDeadlineD = a.registration_deadline ? new Date(a.registration_deadline).getTime() : -Infinity;
          const bDeadlineD = b.registration_deadline ? new Date(b.registration_deadline).getTime() : -Infinity;
          return bDeadlineD - aDeadlineD;
        default:
          return 0;
      }
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-[var(--primary)]" />
          <span className="text-sm font-medium text-[var(--primary)]">Discover Events</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          Events at BITS Pilani
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Workshops, competitions, talks, and more — all in one place
        </p>
      </div>

      <FilterBar filters={filters} onFilterChange={setFilters} />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[var(--card)] rounded-2xl h-72 animate-pulse" />
          ))}
        </div>
      ) : filteredAndSortedEvents.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--muted)] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-[var(--muted-foreground)]" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-[var(--muted-foreground)]">
            {filters.search || filters.category !== 'all'
              ? 'Try adjusting your filters'
              : 'Check back later for upcoming events'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
