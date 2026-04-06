'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';
import { sendEmail } from '@/lib/resend';
import Modal from '@/components/Modal';

export default function ManageEvent() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [event, setEvent] = useState<any>(null);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [sending, setSending] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
  }, [eventId]);

  async function checkAuth() {
    const { data } = await supabase.auth.getUser();
    
    if (!data.user) {
      router.push('/auth/login');
      return;
    }
    
    setUser(data.user);
    fetchEvent(data.user.id);
  }

  async function fetchEvent(userId: string) {
    setLoading(true);
    
    const { data: eventData, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error || !eventData) {
      router.push('/dashboard/creations');
      return;
    }

    if (eventData.creator_id !== userId) {
      router.push('/');
      return;
    }

    setEvent(eventData);
    
    const { data: users } = await supabase
      .from('registered')
      .select(`
        created_at,
        users:user_id (
          email,
          full_name
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    setRegisteredUsers(users || []);
    setLoading(false);
  }

  async function sendUpdate() {
    if (!updateMessage.trim() || registeredUsers.length === 0) return;
    
    setSending(true);
    
    const emails = registeredUsers
      .map((u) => (u.users as any)?.email)
      .filter(Boolean);

    if (emails.length > 0) {
      await sendEmail({
        to: emails,
        subject: `Update: ${event.title}`,
        html: `
          <h2>Event Update</h2>
          <p><strong>${event.title}</strong></p>
          <p>${updateMessage}</p>
          <hr />
          <p>You received this because you registered for this event on BPPC Events.</p>
        `,
      });
    }
    
    setSending(false);
    setShowUpdateModal(false);
    setUpdateMessage('');
    alert('Update sent to all registered users!');
  }

  if (loading || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard"
          className="text-gray-500 hover:text-gray-700"
        >
          ← Back
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h1>
        <p className="text-gray-600 mb-4">{formatDateTime(event.event_date)}</p>
        
        <div className="flex gap-3">
          <Link
            href={`/events/${eventId}`}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
          >
            View Event Page
          </Link>
          <button
            onClick={() => setShowUpdateModal(true)}
            disabled={registeredUsers.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50"
          >
            Send Update to ({registeredUsers.length})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Registered Users ({registeredUsers.length})
        </h2>

        {registeredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No registrations yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Registered At</th>
                </tr>
              </thead>
              <tbody>
                {registeredUsers.map((reg, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm text-gray-900">{(reg.users as any)?.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{(reg.users as any)?.full_name || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{formatDateTime(reg.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        title="Send Update to Registered Users"
      >
        <p className="text-sm text-gray-600 mb-4">
          This will send an email to {registeredUsers.length} registered users.
        </p>
        <textarea
          value={updateMessage}
          onChange={(e) => setUpdateMessage(e.target.value)}
          rows={5}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-4"
          placeholder="Enter your update message..."
        />
        <div className="flex gap-3">
          <button
            onClick={() => setShowUpdateModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={sendUpdate}
            disabled={sending || !updateMessage.trim()}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Update'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
