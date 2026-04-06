import Link from 'next/link';
import { Event } from '@/types';
import { formatDateTime, isDeadlinePassed, getRelativeTime } from '@/lib/utils';

interface EventCardProps {
  event: Event;
  showActions?: boolean;
}

export default function EventCard({ event, showActions = true }: EventCardProps) {
  const deadlinePassed = isDeadlinePassed(event.registration_deadline);

  return (
    <Link href={`/events/${event.id}`} className="block group">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {event.poster_url && (
          <div className="aspect-video bg-gray-100 overflow-hidden">
            <img
              src={event.poster_url}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 capitalize">
              {event.category}
            </span>
            {event.is_online && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Online
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {event.title}
          </h3>

          {event.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {event.description}
            </p>
          )}

          <div className="space-y-1 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>{formatDateTime(event.event_date)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span>{event.location}</span>
              </div>
            )}
            {event.registration_deadline && (
              <div className={`flex items-center gap-2 ${deadlinePassed ? 'text-red-500' : ''}`}>
                <span>⏰</span>
                <span>Register by: {new Date(event.registration_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className={`text-sm font-medium ${deadlinePassed ? 'text-red-500' : 'text-indigo-600'}`}>
              {deadlinePassed ? 'Registration Closed' : getRelativeTime(event.registration_deadline!)}
            </span>
            <span className={`text-sm font-medium ${event.fee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
              {event.fee === 0 ? 'Free' : `₹${event.fee}`}
            </span>
          </div>

          {event.tags && event.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {event.tags.map((tag) => (
                <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
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
