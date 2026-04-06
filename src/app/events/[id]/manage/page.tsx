'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDateTime, CATEGORIES, SUGGESTED_TAGS } from '@/lib/utils';
import Modal from '@/components/Modal';
import { ArrowLeft, Send, Users, Mail, Pencil, Trash2, Loader2, Upload, X } from 'lucide-react';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: 'other',
    event_date: '',
    event_time: '',
    location: '',
    is_online: false,
    registration_link: '',
    registration_deadline_date: '',
    registration_deadline_time: '',
    poster_url: '',
    creator_phone: '',
    tags: [] as string[],
    customTag: '',
  });

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
    initEditForm(eventData);
    
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

    const { data: tags } = await supabase
      .from('event_tags')
      .select('tag')
      .eq('event_id', eventId);

    setRegisteredUsers(users || []);
    setLoading(false);
  }

  function initEditForm(eventData: any) {
    const eventDate = new Date(eventData.event_date);
    const deadlineDate = eventData.registration_deadline ? new Date(eventData.registration_deadline) : null;

    setEditForm({
      title: eventData.title || '',
      description: eventData.description || '',
      category: eventData.category || 'other',
      event_date: eventDate.toISOString().split('T')[0],
      event_time: eventDate.toTimeString().slice(0, 5),
      location: eventData.location || '',
      is_online: eventData.is_online || false,
      registration_link: eventData.registration_link || '',
      registration_deadline_date: deadlineDate?.toISOString().split('T')[0] || '',
      registration_deadline_time: deadlineDate?.toTimeString().slice(0, 5) || '',
      poster_url: eventData.poster_url || '',
      creator_phone: eventData.creator_phone || '',
      tags: [],
      customTag: '',
    });
  }

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error: uploadError } = await supabase.storage
      .from('event-posters')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('event-posters')
      .getPublicUrl(fileName);

    setEditForm(prev => ({ ...prev, poster_url: publicUrl }));
    setUploading(false);
  }, [user, supabase]);

  async function saveEdit() {
    setSaving(true);

    const eventDate = editForm.event_time
      ? new Date(`${editForm.event_date}T${editForm.event_time}`).toISOString()
      : new Date(editForm.event_date).toISOString();

    const regDeadline = editForm.registration_deadline_date
      ? editForm.registration_deadline_time
        ? new Date(`${editForm.registration_deadline_date}T${editForm.registration_deadline_time}`).toISOString()
        : new Date(editForm.registration_deadline_date).toISOString()
      : null;

    const { error } = await supabase
      .from('events')
      .update({
        title: editForm.title,
        description: editForm.description || null,
        category: editForm.category,
        event_date: eventDate,
        location: editForm.location || null,
        is_online: editForm.is_online,
        registration_link: editForm.registration_link || null,
        registration_deadline: regDeadline,
        poster_url: editForm.poster_url || null,
        creator_phone: editForm.creator_phone || null,
      })
      .eq('id', eventId);

    if (!error) {
      await supabase.from('event_tags').delete().eq('event_id', eventId);
      
      if (editForm.tags.length > 0) {
        const tagInserts = editForm.tags.map((tag) => ({
          event_id: eventId,
          tag: tag,
        }));
        await supabase.from('event_tags').insert(tagInserts);
      }

      fetchEvent(user!.id);
      setShowEditModal(false);
    }

    setSaving(false);
  }

  async function deleteEvent() {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    
    await supabase.from('events').delete().eq('id', eventId);
    router.push('/dashboard');
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

  function toggleTag(tag: string) {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  }

  function addCustomTag() {
    if (editForm.customTag.trim() && !editForm.tags.includes(editForm.customTag.trim())) {
      setEditForm(prev => ({
        ...prev,
        tags: [...prev.tags, prev.customTag.trim()],
        customTag: '',
      }));
    }
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
            onClick={() => {
              initEditForm(event);
              setShowEditModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl hover:opacity-90 transition-opacity text-sm font-medium"
          >
            <Pencil className="w-4 h-4" />
            Edit Event
          </button>
          <button
            onClick={deleteEvent}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete Event
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
          <>
            <button
              onClick={() => setShowUpdateModal(true)}
              className="mb-6 inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl hover:opacity-90 transition-opacity text-sm font-medium"
            >
              <Mail className="w-4 h-4" />
              Send Update to All ({registeredUsers.length})
            </button>
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
          </>
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

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Event"
      >
        <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Event Title *</label>
            <input
              type="text"
              required
              value={editForm.title}
              onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 bg-[var(--background)] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 bg-[var(--background)] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent resize-none"
              placeholder="Supports Markdown formatting"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={editForm.category}
              onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-3 bg-[var(--background)] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Event Date *</label>
              <input
                type="date"
                required
                value={editForm.event_date}
                onChange={(e) => setEditForm(prev => ({ ...prev, event_date: e.target.value }))}
                className="w-full px-4 py-3 bg-[var(--background)] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Event Time</label>
              <input
                type="time"
                value={editForm.event_time}
                onChange={(e) => setEditForm(prev => ({ ...prev, event_time: e.target.value }))}
                className="w-full px-4 py-3 bg-[var(--background)] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="edit_is_online"
              checked={editForm.is_online}
              onChange={(e) => setEditForm(prev => ({ ...prev, is_online: e.target.checked }))}
              className="w-5 h-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--ring)]"
            />
            <label htmlFor="edit_is_online" className="text-sm font-medium">This is an online event</label>
          </div>

          {!editForm.is_online && (
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-3 bg-[var(--background)] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Registration Link</label>
            <input
              type="url"
              value={editForm.registration_link}
              onChange={(e) => setEditForm(prev => ({ ...prev, registration_link: e.target.value }))}
              className="w-full px-4 py-3 bg-[var(--background)] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Registration Deadline Date</label>
              <input
                type="date"
                value={editForm.registration_deadline_date}
                onChange={(e) => setEditForm(prev => ({ ...prev, registration_deadline_date: e.target.value }))}
                className="w-full px-4 py-3 bg-[var(--background)] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Deadline Time</label>
              <input
                type="time"
                value={editForm.registration_deadline_time}
                onChange={(e) => setEditForm(prev => ({ ...prev, registration_deadline_time: e.target.value }))}
                className="w-full px-4 py-3 bg-[var(--background)] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Contact Phone</label>
            <input
              type="tel"
              value={editForm.creator_phone}
              onChange={(e) => setEditForm(prev => ({ ...prev, creator_phone: e.target.value }))}
              className="w-full px-4 py-3 bg-[var(--background)] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Poster Image</label>
            <div className="border-2 border-dashed rounded-xl p-4 text-center">
              {editForm.poster_url ? (
                <div className="relative inline-block">
                  <img src={editForm.poster_url} alt="Preview" className="max-h-32 mx-auto rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, poster_url: '' }))}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="flex flex-col items-center gap-2 text-[var(--muted-foreground)]">
                    {uploading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-sm">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6" />
                        <span className="text-sm">Click to upload</span>
                      </>
                    )}
                  </div>
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="flex-1 px-4 py-2.5 border rounded-xl hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
