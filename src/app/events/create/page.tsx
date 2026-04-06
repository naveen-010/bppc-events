'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { CATEGORIES, SUGGESTED_TAGS, isBITSEmail } from '@/lib/utils';
import Link from 'next/link';
import { Upload, X, Loader2, Plus, User, Mail, Phone } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export default function CreateEvent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const [formData, setFormData] = useState({
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
    tags: [] as string[],
    customTag: '',
  });

  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', name: '', email: '', phone: '' }
  ]);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data } = await supabase.auth.getUser();
    
    if (!data.user) {
      router.push('/auth/login?next=/events/create');
      return;
    }
    
    if (!isBITSEmail(data.user.email || '')) {
      setError('Only BITS Pilani email users can create events. Please login with your @pilani.bits-pilani.ac.in email.');
      setChecking(false);
      return;
    }
    
    setUser(data.user);
    setChecking(false);
  }

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
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

    setFormData(prev => ({ ...prev, poster_url: publicUrl }));
    setUploading(false);
  }, [user, supabase]);

  function addContact() {
    setContacts([...contacts, { id: Date.now().toString(), name: '', email: '', phone: '' }]);
  }

  function removeContact(id: string) {
    if (contacts.length > 1) {
      setContacts(contacts.filter(c => c.id !== id));
    }
  }

  function updateContact(id: string, field: 'name' | 'email' | 'phone', value: string) {
    setContacts(contacts.map(c => c.id === id ? { ...c, [field]: value } : c));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const validContacts = contacts.filter(c => c.name.trim() && (c.email.trim() || c.phone.trim()));
    if (validContacts.length === 0) {
      setError('Please add at least one contact person with name and either email or phone.');
      return;
    }

    setLoading(true);
    setError(null);

    const eventDate = formData.event_time
      ? new Date(`${formData.event_date}T${formData.event_time}`).toISOString()
      : new Date(formData.event_date).toISOString();

    const regDeadline = formData.registration_deadline_date
      ? formData.registration_deadline_time
        ? new Date(`${formData.registration_deadline_date}T${formData.registration_deadline_time}`).toISOString()
        : new Date(formData.registration_deadline_date).toISOString()
      : null;

    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        event_date: eventDate,
        location: formData.location || null,
        is_online: formData.is_online,
        registration_link: formData.registration_link || null,
        registration_deadline: regDeadline,
        fee: 0,
        poster_url: formData.poster_url || null,
        creator_id: user.id,
        creator_email: user.email,
        creator_name: user.user_metadata?.full_name || null,
      })
      .select()
      .single();

    if (eventError) {
      setError('Failed to create event. Please try again.');
      setLoading(false);
      return;
    }

    if (formData.tags.length > 0 && event) {
      const tagInserts = formData.tags.map((tag) => ({
        event_id: event.id,
        tag: tag,
      }));
      await supabase.from('event_tags').insert(tagInserts);
    }

    if (validContacts.length > 0 && event) {
      const contactInserts = validContacts.map((c) => ({
        event_id: event.id,
        name: c.name.trim(),
        email: c.email.trim() || null,
        phone: c.phone.trim() || null,
      }));
      await supabase.from('event_contacts').insert(contactInserts);
    }

    router.push(`/events/${event.id}`);
  }

  function toggleTag(tag: string) {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  }

  function addCustomTag() {
    if (formData.customTag.trim() && !formData.tags.includes(formData.customTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, prev.customTag.trim()],
        customTag: '',
      }));
    }
  }

  if (checking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-[var(--muted)] rounded" />
          <div className="h-96 bg-[var(--muted)] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8 text-center">
          <h2 className="text-lg font-semibold mb-2">Access Restricted</h2>
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/auth/login" className="text-[var(--primary)] hover:underline">
            Login with BITS Email
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold mb-8">Create New Event</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-[var(--card)] rounded-2xl border p-6 space-y-5">
          <h2 className="font-semibold text-lg">Event Details</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2">Event Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--background)] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
              placeholder="e.g., Workshop on Machine Learning"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 bg-[var(--background)] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent resize-none"
              placeholder="Describe your event... (Markdown supported)"
            />
            <p className="text-xs text-[var(--muted-foreground)] mt-1">Supports Markdown formatting</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--background)] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Event Poster</label>
            <div className="border-2 border-dashed rounded-xl p-6 text-center">
              {formData.poster_url ? (
                <div className="relative">
                  <img src={formData.poster_url} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, poster_url: '' })}
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
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8" />
                        <span className="text-sm">Click to upload or drag and drop</span>
                        <span className="text-xs">PNG, JPG up to 5MB</span>
                      </>
                    )}
                  </div>
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[var(--card)] rounded-2xl border p-6 space-y-5">
          <h2 className="font-semibold text-lg">Date & Time</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Event Date *</label>
              <input
                type="date"
                required
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--background)] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Event Time</label>
              <input
                type="time"
                value={formData.event_time}
                onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--background)] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-[var(--card)] rounded-2xl border p-6 space-y-5">
          <h2 className="font-semibold text-lg">Location & Registration</h2>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_online"
              checked={formData.is_online}
              onChange={(e) => setFormData({ ...formData, is_online: e.target.checked })}
              className="w-5 h-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--ring)]"
            />
            <label htmlFor="is_online" className="text-sm font-medium">This is an online event</label>
          </div>

          {!formData.is_online && (
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--background)] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
                placeholder="e.g., LT-1, BITS Pilani"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Registration Link</label>
            <input
              type="url"
              value={formData.registration_link}
              onChange={(e) => setFormData({ ...formData, registration_link: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--background)] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
              placeholder="https://forms.google.com/..."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Registration Deadline Date</label>
              <input
                type="date"
                value={formData.registration_deadline_date}
                onChange={(e) => setFormData({ ...formData, registration_deadline_date: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--background)] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Deadline Time</label>
              <input
                type="time"
                value={formData.registration_deadline_time}
                onChange={(e) => setFormData({ ...formData, registration_deadline_time: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--background)] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-[var(--card)] rounded-2xl border p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Contact Persons</h2>
            <button
              type="button"
              onClick={addContact}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              Add Contact
            </button>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">Add people who can be contacted for queries. Name is required, and at least one of email or phone.</p>

          <div className="space-y-4">
            {contacts.map((contact, index) => (
              <div key={contact.id} className="flex gap-3 items-start p-4 bg-[var(--muted)] rounded-xl">
                <div className="flex-1 grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-[var(--muted-foreground)]">
                      <User className="w-3 h-3 inline mr-1" />
                      Name *
                    </label>
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--background)] border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-[var(--muted-foreground)]">
                      <Mail className="w-3 h-3 inline mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(e) => updateContact(contact.id, 'email', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--background)] border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
                      placeholder="john@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-[var(--muted-foreground)]">
                      <Phone className="w-3 h-3 inline mr-1" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => updateContact(contact.id, 'phone', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--background)] border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
                {contacts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeContact(contact.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--card)] rounded-2xl border p-6 space-y-5">
          <h2 className="font-semibold text-lg">Tags</h2>

          <div className="flex flex-wrap gap-2 mb-3">
            {SUGGESTED_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                  formData.tags.includes(tag)
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.customTag}
              onChange={(e) => setFormData({ ...formData, customTag: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
              className="flex-1 px-4 py-3 bg-[var(--background)] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
              placeholder="Add custom tag"
            />
            <button
              type="button"
              onClick={addCustomTag}
              className="px-5 py-3 bg-[var(--muted)] rounded-xl hover:bg-[var(--accent)] transition-colors font-medium"
            >
              Add
            </button>
          </div>
          {formData.tags.length > 0 && (
            <p className="text-sm text-[var(--muted-foreground)]">Selected: {formData.tags.join(', ')}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-4 bg-[var(--primary)] text-[var(--primary-foreground)] font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Creating Event...' : 'Create Event'}
        </button>
      </form>
    </div>
  );
}
