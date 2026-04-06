'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { formatDateTime, isDeadlinePassed } from '@/lib/utils';
import Modal from '@/components/Modal';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Calendar, MapPin, Clock, User, Phone, Mail,
  Heart, Check, ArrowLeft, Settings, ExternalLink 
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export default function EventDetail() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [event, setEvent] = useState<any>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
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
    
    const [eventRes, contactsRes] = await Promise.all([
      supabase
        .from('events')
        .select(`
          *,
          event_tags (tag),
          interested:interested(count),
          registered:registered(count)
        `)
        .eq('id', eventId)
        .single(),
      supabase
        .from('event_contacts')
        .select('*')
        .eq('event_id', eventId)
    ]);

    if (eventRes.error || !eventRes.data) {
      router.push('/');
      return;
    }

    setEvent({
      ...eventRes.data,
      tags: eventRes.data.event_tags?.map((t: any) => t.tag) || [],
      interested_count: eventRes.data.interested?.[0]?.count || 0,
      registered_count: eventRes.data.registered?.[0]?.count || 0,
    });
    setContacts(contactsRes.data || []);
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse">
          <div className="h-8 w-2/3 bg-[var(--muted)] rounded mb-6" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-[var(--muted)] rounded-2xl" />
            <div className="h-96 bg-[var(--muted)] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const deadlinePassed = isDeadlinePassed(event.registration_deadline);
  const isCreator = user?.id === event.creator_id;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to events
      </Link>

      <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[var(--card)] rounded-2xl border p-6 sm:p-8">
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

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[var(--primary)]/10">
                  <Calendar className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">When</p>
                  <p className="font-medium text-sm">{formatDateTime(event.event_date)}</p>
                </div>
              </div>
              
              {event.location && (
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-[var(--primary)]/10">
                    <MapPin className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]">Where</p>
                    <p className="font-medium text-sm">{event.location}</p>
                  </div>
                </div>
              )}
            </div>

            {event.registration_deadline && (
              <div className={`flex items-center gap-3 p-4 rounded-xl ${deadlinePassed ? 'bg-red-500/5' : 'bg-[var(--muted)]'}`}>
                <div className={`p-2.5 rounded-lg ${deadlinePassed ? 'bg-red-500/10' : 'bg-[var(--accent)]'}`}>
                  <Clock className={`w-5 h-5 ${deadlinePassed ? 'text-red-500' : 'text-[var(--muted-foreground)]'}`} />
                </div>
                <div>
                  <p className={`text-xs ${deadlinePassed ? 'text-red-500' : 'text-[var(--muted-foreground)]'}`}>
                    Registration {deadlinePassed ? 'closed' : 'closes'}
                  </p>
                  <p className={`font-medium text-sm ${deadlinePassed ? 'text-red-500' : ''}`}>
                    {formatDateTime(event.registration_deadline)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {event.description && (
            <div className="bg-[var(--card)] rounded-2xl border p-6 sm:p-8">
              <h2 className="text-lg font-semibold mb-4">About</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{event.description}</ReactMarkdown>
              </div>
            </div>
          )}

          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag: string) => (
                <span key={tag} className="text-sm px-3 py-1.5 rounded-lg bg-[var(--card)] border text-[var(--muted-foreground)]">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {contacts.length > 0 && (
            <div className="bg-[var(--card)] rounded-2xl border p-6 sm:p-8">
              <h2 className="text-lg font-semibold mb-4">Contact</h2>
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/60 flex items-center justify-center text-white font-medium">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{contact.name}</p>
                      <div className="flex flex-wrap gap-3 text-sm">
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="text-[var(--primary)] hover:underline flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {contact.email}
                          </a>
                        )}
                        {contact.phone && (
                          <a href={`tel:${contact.phone}`} className="text-[var(--primary)] hover:underline flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {contact.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[var(--card)] rounded-2xl border p-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              <span className="font-medium text-[var(--foreground)]">Created by</span> {event.creator_name || event.creator_email}
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {event.poster_url && (
            <div className="sticky top-24">
              <div className="bg-[var(--card)] rounded-2xl border overflow-hidden">
                <img 
                  src={event.poster_url} 
                  alt={event.title} 
                  className="w-full h-auto object-cover" 
                />
              </div>
            </div>
          )}

          <div className="bg-[var(--card)] rounded-2xl border p-6 space-y-4">
            {isCreator && (
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-2xl font-bold text-[var(--primary)]">{event.registered_count}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Registered</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-500">{event.interested_count}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Interested</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {!deadlinePassed && event.registration_link && (
                <a
                  href={event.registration_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl hover:opacity-90 transition-opacity font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Register on Form
                </a>
              )}

              <button
                onClick={toggleRegistered}
                disabled={processing || !user}
                className={`flex items-center justify-center gap-2 w-full px-6 py-3.5 font-medium rounded-xl transition-all disabled:opacity-50 ${
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
                className={`flex items-center justify-center gap-2 w-full px-6 py-3.5 font-medium rounded-xl transition-all disabled:opacity-50 ${
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
              <Link
                href={`/events/${eventId}/manage`}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium bg-[var(--muted)] rounded-xl hover:bg-[var(--accent)] transition-colors"
              >
                <Settings className="w-4 h-4" />
                Manage Event
              </Link>
            )}
          </div>
        </div>
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
