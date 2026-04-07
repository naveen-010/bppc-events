'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Modal from './Modal';
import { MessageSquare, Send, Loader2, Check } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (feedback.trim().length < 5) {
      setError('Please provide more details (at least 5 characters)');
      return;
    }

    setSending(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback: feedback.trim(),
          email: user?.email || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to send');

      setSent(true);
      setFeedback('');
      setTimeout(() => {
        setSent(false);
        onClose();
      }, 2000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setFeedback('');
    setSent(false);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send Feedback">
      {sent ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Check className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Thank you!</h3>
          <p className="text-[var(--muted-foreground)]">Your feedback has been submitted.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Found a bug or have a feature idea? Let us know!
          </p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Describe the issue or suggestion..."
            rows={5}
            className="w-full px-4 py-3 bg-[var(--muted)] rounded-xl border focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none transition-all"
            disabled={sending}
          />
          {error && (
            <p className="text-sm text-red-500 mt-2">{error}</p>
          )}
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 border rounded-xl hover:bg-[var(--muted)] transition-colors font-medium"
              disabled={sending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || feedback.trim().length < 5}
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
