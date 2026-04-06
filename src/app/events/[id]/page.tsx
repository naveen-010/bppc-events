'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { formatDateTime, isDeadlinePassed, isBITSEmail } from '@/lib/utils';
import Modal from '@/components/Modal';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Calendar, MapPin, Link as LinkIcon, Clock, User, Phone, 
  Users, Heart, Check, ArrowLeft, Settings, ExternalLink 
} from 'lucide-react';

export default function EventDetail() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isInterested, setIsInterested] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchEvent();
    fetchUser();
  }, [eventId]);

  async function fetchUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    
    if (data.user) {
      checkUserActions(data.user.id);
    }
  }

  async function checkUserActions(userId: string) {
    const [interestedRes, registeredRes] = await Promise.all([
      supabase.from('interested').select('*', { count: 'exact' }).eq('user_id', userId).eq('event_id', eventId),
      supabase.from('registered').select('*', { count: 'exact' }).eq('user_id', userId).eq('event_id', eventId),
    ]);
    
    setIsInterested(interestedRes.count ? interestedRes.count > 0 : false);
    setIsRegistered(registeredRes.count ? registeredRes.count > 0 : false);
  }

  async function fetchEvent() {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_tags (tag),
        interested:interested(count),
        registered:registered(count)
      `)
      .eq('id', eventId)
      .single();

    if (error || !data) {
      router.push('/');
      return;
    }

    setEvent({
      ...data,
      tags: data.event_tags?.map((t: any) => t.tag) || [],
      interested_count: data.interested?.[0]?.count || 0,
      registered_count: data.registered?.[0]?.count || 0,
    });
    setLoading(false);
  }

  async function toggleInterested() {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    setProcessing(true);
    
    if (isInterested) {
      await supabase.from('interested').delete().eq('user_id', user.id).eq('event_id', eventId);
    } else {
      await supabase.from('interested').insert({ user_id: user.id, event_id: eventId });
    }
    
    setIsInterested(!isInterested);
    setProcessing(false);
    fetchEvent();
  }

  async function toggleRegistered() {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    setProcessing(true);
    
    if (isRegistered) {
      await supabase.from('registered').delete().eq('user_id', user.id).eq('event_id', eventId);
    } else {
      await supabase.from('registered').insert({ user_id: user.id, event_id: eventId });
    }
    
    setIsRegistered(!isRegistered);
    setProcessing(false);
    fetchEvent();
  }

  if (loading || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 bg-[var(--muted)] rounded" />
          <div className="h-64 bg-[var(--muted)] rounded-2xl" />
        </div>
      </div>
    );
  }

  const deadlinePassed = isDeadlinePassed(event.registration_deadline);
  const isCreator = user?.id === event.creator_id;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to events
      </Link>

      {event.poster_url && (
        <div className="aspect-video rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-[var(--muted)] to-[var(--accent)]">
          <img src={event.poster_url} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="bg-[var(--card)] rounded-2xl border p-6 sm:p-8 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--primary)]/10 text-[var(--primary)]">
            {event.category}
          </span>
          {event.is_online && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-600">
              Online Event
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-6">{event.title}</h1>

        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[var(--primary)]/10">
              <Calendar className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <p className="font-medium">Event Date & Time</p>
              <p className="text-[var(--muted-foreground)]">{formatDateTime(event.event_date)}</p>
            </div>
          </div>
          
          {event.location && (
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[var(--primary)]/10">
                <MapPin className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <div>
                <p className="font-medium">Location</p>
                <p className="text-[var(--muted-foreground)]">{event.location}</p>
              </div>
            </div>
          )}
        </div>

        {event.registration_deadline && (
          <div className={`flex items-start gap-4 p-4 rounded-xl mb-6 ${deadlinePassed ? 'bg-red-500/5' : 'bg-[var(--muted)]'}`}>
            <div className={`p-3 rounded-xl ${deadlinePassed ? 'bg-red-500/10' : 'bg-[var(--accent)]'}`}>
              <Clock className={`w-5 h-5 ${deadlinePassed ? 'text-red-500' : 'text-[var(--muted-foreground)]'}`} />
            </div>
            <div>
              <p className={`font-medium ${deadlinePassed ? 'text-red-500' : ''}`}>
                Registration Deadline
              </p>
              <p className={`${deadlinePassed ? 'text-red-500/70' : 'text-[var(--muted-foreground)]'}`}>
                {formatDateTime(event.registration_deadline)}
              </p>
            </div>
          </div>
        )}

        {event.description && (
          <div className="prose prose-neutral dark:prose-invert max-w-none mb-8">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{event.description}</ReactMarkdown>
          </div>
        )}

        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {event.tags.map((tag: string) => (
              <span key={tag} className="text-sm px-3 py-1.5 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)]">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-6 pt-6 border-t text-sm">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span className="text-[var(--muted-foreground)]">Organized by</span>
            <span className="font-medium">{event.creator_name || event.creator_email}</span>
          </div>
          {event.creator_phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[var(--muted-foreground)]" />
              <span className="font-medium">{event.creator_phone}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[var(--card)] rounded-2xl border p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-bold text-[var(--primary)]">{event.registered_count}</p>
              <p className="text-sm text-[var(--muted-foreground)]">Registered</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500">{event.interested_count}</p>
              <p className="text-sm text-[var(--muted-foreground)]">Interested</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {!deadlinePassed && event.registration_link && (
            <a
              href={event.registration_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl hover:opacity-90 transition-opacity font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Register on Form
            </a>
          )}

          <button
            onClick={toggleRegistered}
            disabled={processing || !user}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 font-medium rounded-xl transition-all disabled:opacity-50 ${
              isRegistered
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)] border-2 border-emerald-500'
            }`}
          >
            {isRegistered ? (
              <>
                <Check className="w-4 h-4" />
                Registered
              </>
            ) : (
              'Mark as Registered'
            )}
          </button>

          <button
            onClick={toggleInterested}
            disabled={processing || !user}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 font-medium rounded-xl transition-all disabled:opacity-50 ${
              isInterested
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)] border-2 border-amber-500'
            }`}
          >
            {isInterested ? (
              <>
                <Heart className="w-4 h-4 fill-current" />
                Interested
              </>
            ) : (
              <>
                <Heart className="w-4 h-4" />
                Interested
              </>
            )}
          </button>
        </div>

        {isCreator && (
          <div className="mt-6 pt-6 border-t">
            <Link
              href={`/events/${eventId}/manage`}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-[var(--muted)] rounded-xl hover:bg-[var(--accent)] transition-colors"
            >
              <Settings className="w-4 h-4" />
              Manage Event
            </Link>
          </div>
        )}
      </div>

      <Modal
        isOpen={showRegisterConfirm}
        onClose={() => setShowRegisterConfirm(false)}
        title="Confirm Registration"
      >
        <p className="text-[var(--muted-foreground)] mb-6">
          Have you completed registration using the external form? This will mark you as registered for this event.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowRegisterConfirm(false)}
            className="flex-1 px-4 py-2.5 border rounded-xl hover:bg-[var(--muted)] transition-colors"
          >
            Not Yet
          </button>
          <button
            onClick={toggleRegistered}
            disabled={processing}
            className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50"
          >
            Yes, I am Registered
          </button>
        </div>
      </Modal>
    </div>
  );
}
