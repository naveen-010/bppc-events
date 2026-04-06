'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';
import Modal from '@/components/Modal';
import { ArrowLeft, Send, Users, Mail } from 'lucide-react';

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
  const [sendingResult, setSendingResult] = useState<string | null>(null);
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
      router.push('/dashboard');
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
    if (!updateMessage.trim()) return;
    
    setSending(true);
    setSendingResult(null);
    
    try {
      const res = await fetch(`/api/events/${eventId}/send-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: updateMessage }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setSendingResult(`Update sent to ${data.sent} users!`);
        setTimeout(() => {
          setShowUpdateModal(false);
          setUpdateMessage('');
          setSendingResult(null);
        }, 2000);
      } else {
        setSendingResult(data.error || 'Failed to send update');
      }
    } catch (err) {
      setSendingResult('Failed to send update');
    }
    
    setSending(false);
  }

  if (loading || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 bg-[var(--muted)] rounded" />
          <div className="h-48 bg-[var(--muted)] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="bg-[var(--card)] rounded-2xl border p-6 sm:p-8 mb-6">
        <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
        <p className="text-[var(--muted-foreground)] mb-6">{formatDateTime(event.event_date)}</p>
        
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/events/${eventId}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--muted)] rounded-xl hover:bg-[var(--accent)] transition-colors text-sm font-medium"
          >
            View Event Page
          </Link>
          <button
            onClick={() => setShowUpdateModal(true)}
            disabled={registeredUsers.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50"
          >
            <Mail className="w-4 h-4" />
            Send Update ({registeredUsers.length})
          </button>
        </div>
      </div>

      <div className="bg-[var(--card)] rounded-2xl border p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-[var(--primary)]" />
          <h2 className="text-lg font-semibold">
            Registered Users ({registeredUsers.length})
          </h2>
        </div>

        {registeredUsers.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            <p>No registrations yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--muted-foreground)]">Registered At</th>
                </tr>
              </thead>
              <tbody>
                {registeredUsers.map((reg, i) => (
                  <tr key={i} className="border-b border-[var(--border)]">
                    <td className="py-3 px-4 text-sm">{(reg.users as any)?.email}</td>
                    <td className="py-3 px-4 text-sm text-[var(--muted-foreground)]">{(reg.users as any)?.full_name || '-'}</td>
                    <td className="py-3 px-4 text-sm text-[var(--muted-foreground)]">{formatDateTime(reg.created_at)}</td>
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
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          This will send an email to {registeredUsers.length} registered users.
        </p>
        <textarea
          value={updateMessage}
          onChange={(e) => setUpdateMessage(e.target.value)}
          rows={5}
          className="w-full px-4 py-3 bg-[var(--background)] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent resize-none mb-4"
          placeholder="Enter your update message..."
        />
        {sendingResult && (
          <p className={`text-sm mb-4 ${sendingResult.includes('sent') ? 'text-emerald-500' : 'text-red-500'}`}>
            {sendingResult}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => setShowUpdateModal(false)}
            className="flex-1 px-4 py-2.5 border rounded-xl hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={sendUpdate}
            disabled={sending || !updateMessage.trim()}
            className="flex-1 px-4 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Update
              </>
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
}
