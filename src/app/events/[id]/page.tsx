'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { formatDateTime, isDeadlinePassed, isBITSEmail } from '@/lib/utils';
import Modal from '@/components/Modal';
import Link from 'next/link';

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
  const [showRegisterModal, setShowRegisterModal] = useState(false);
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

  async function confirmRegistration() {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setShowRegisterConfirm(true);
  }

  async function handleRegisterConfirm() {
    setProcessing(true);
    await supabase.from('registered').insert({ user_id: user.id, event_id: eventId });
    setIsRegistered(true);
    setShowRegisterConfirm(false);
    setShowRegisterModal(false);
    setProcessing(false);
    fetchEvent();
  }

  if (loading || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 bg-gray-200 rounded" />
          <div className="h-4 w-1/3 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const deadlinePassed = isDeadlinePassed(event.registration_deadline);
  const isCreator = user?.id === event.creator_id;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {event.poster_url && (
        <div className="aspect-video rounded-xl overflow-hidden mb-6 bg-gray-100">
          <img src={event.poster_url} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700 capitalize mb-2">
              {event.category}
            </span>
            {event.is_online && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 ml-2">
                Online
              </span>
            )}
          </div>
          <span className={`text-lg font-semibold ${event.fee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
            {event.fee === 0 ? 'Free' : `₹${event.fee}`}
          </span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>

        {event.description && (
          <p className="text-gray-600 mb-6 whitespace-pre-wrap">{event.description}</p>
        )}

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 text-gray-700">
            <span className="text-xl">📅</span>
            <div>
              <p className="font-medium">{formatDateTime(event.event_date)}</p>
              <p className="text-sm text-gray-500">Event Date & Time</p>
            </div>
          </div>
          
          {event.location && (
            <div className="flex items-center gap-3 text-gray-700">
              <span className="text-xl">📍</span>
              <div>
                <p className="font-medium">{event.location}</p>
                <p className="text-sm text-gray-500">Location</p>
              </div>
            </div>
          )}
        </div>

        {event.registration_deadline && (
          <div className={`flex items-center gap-3 p-4 rounded-lg ${deadlinePassed ? 'bg-red-50' : 'bg-gray-50'}`}>
            <span className="text-xl">⏰</span>
            <div>
              <p className={`font-medium ${deadlinePassed ? 'text-red-600' : 'text-gray-900'}`}>
                Registration Deadline: {formatDateTime(event.registration_deadline)}
              </p>
              <p className="text-sm text-gray-500">
                {deadlinePassed ? 'Registration has closed' : 'Register before this date'}
              </p>
            </div>
          </div>
        )}

        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {event.tags.map((tag: string) => (
              <span key={tag} className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-100">
          <div>
            <p className="text-sm text-gray-500">Organized by</p>
            <p className="font-medium">{event.creator_name || event.creator_email}</p>
          </div>
          {event.creator_phone && (
            <div className="ml-auto">
              <p className="text-sm text-gray-500">Contact</p>
              <p className="font-medium">{event.creator_phone}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-bold text-indigo-600">{event.interested_count}</p>
              <p className="text-sm text-gray-500">Interested</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{event.registered_count}</p>
              <p className="text-sm text-gray-500">Registered</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {!deadlinePassed && event.registration_link && (
            <a
              href={event.registration_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
            >
              Register on External Form
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}

          {!isRegistered && (
            <button
              onClick={confirmRegistration}
              disabled={processing || !user}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {processing ? 'Processing...' : '✓ I have Registered'}
            </button>
          )}

          {isRegistered && (
            <div className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-100 text-green-700 font-medium rounded-lg">
              ✓ You are Registered
            </div>
          )}

          <button
            onClick={toggleInterested}
            disabled={processing || !user}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 font-medium rounded-lg border-2 transition-colors disabled:opacity-50 ${
              isInterested
                ? 'bg-amber-50 border-amber-400 text-amber-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {isInterested ? '★ Interested' : '☆ Interested'}
          </button>
        </div>

        {isCreator && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <Link
              href={`/events/${eventId}/manage`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Manage Event & Send Updates
            </Link>
          </div>
        )}
      </div>

      <Modal
        isOpen={showRegisterConfirm}
        onClose={() => setShowRegisterConfirm(false)}
        title="Confirm Registration"
      >
        <p className="text-gray-600 mb-6">
          Have you completed registration using the external form? This will mark you as registered for this event.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowRegisterConfirm(false)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Not Yet
          </button>
          <button
            onClick={handleRegisterConfirm}
            disabled={processing}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Yes, I am Registered
          </button>
        </div>
      </Modal>
    </div>
  );
}
