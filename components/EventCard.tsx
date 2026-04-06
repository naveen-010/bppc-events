import Link from 'next/link';
import { Event } from '@/types';
import { formatDateTime, isDeadlinePassed, getRelativeTime } from '@/lib/utils';
import { MapPin, Clock, Users, ExternalLink } from 'lucide-react';

interface EventCardProps {
  event: Event;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/!\[.*?\]\(.+?\)/g, '')
    .replace(/^\s*[-*+]\s/gm, '')
    .replace(/^\s*\d+\.\s/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
}

export default function EventCard({ event }: EventCardProps) {
  const deadlinePassed = isDeadlinePassed(event.registration_deadline);
  const plainDescription = event.description ? stripMarkdown(event.description) : '';

  return (
    <Link href={`/events/${event.id}`} className="group block">
      <div className="bg-[var(--card)] rounded-2xl border overflow-hidden hover:shadow-lg hover:border-[var(--primary)]/30 transition-all duration-300">
        {event.poster_url && (
          <div className="aspect-[16/10] bg-gradient-to-br from-[var(--muted)] to-[var(--accent)] overflow-hidden">
            <img
              src={event.poster_url}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
        
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)]">
              {event.category}
            </span>
            {event.is_online && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600">
                Online
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
            {event.title}
          </h3>

          {plainDescription && (
            <p className="text-sm text-[var(--muted-foreground)] mb-4 line-clamp-2">
              {plainDescription}
            </p>
          )}

          <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{formatDateTime(event.event_date)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {event.registered_count || 0}
              </span>
              {event.registration_deadline && (
                <span className={`${deadlinePassed ? 'text-red-500' : ''}`}>
                  {deadlinePassed ? 'Closed' : getRelativeTime(event.registration_deadline)}
                </span>
              )}
            </div>
            {event.registration_link && !deadlinePassed && (
              <ExternalLink className="w-4 h-4 text-[var(--muted-foreground)]" />
            )}
          </div>

          {event.tags && event.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {event.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-[var(--muted)] text-[var(--muted-foreground)]">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
