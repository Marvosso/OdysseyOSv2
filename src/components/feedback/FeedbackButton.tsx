'use client';

import { useState, useCallback } from 'react';
import { MessageCircle, X, Star, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { usePathname } from 'next/navigation';

export default function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = useCallback(() => {
    setMessage('');
    setRating(null);
    setEmail('');
    setError(null);
    setSuccess(false);
  }, []);

  const handleOpen = useCallback(() => {
    reset();
    setOpen(true);
  }, [reset]);

  const handleClose = useCallback(() => {
    if (!submitting) {
      setOpen(false);
      reset();
    }
  }, [submitting, reset]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setError('Please enter your feedback.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: trimmed,
          rating: rating ?? undefined,
          email: email.trim() || undefined,
          page: pathname ?? undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data?.error as string) || 'Something went wrong.');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        reset();
      }, 1500);
    } catch {
      setError('Failed to send feedback.');
    } finally {
      setSubmitting(false);
    }
  }, [message, rating, email, pathname]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
        aria-label="Send feedback"
      >
        <MessageCircle className="w-4 h-4" />
        Feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden />
          <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Beta feedback</h2>
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="p-1 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={3}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating (optional)</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(rating === n ? null : n)}
                      disabled={submitting}
                      className="p-1 rounded text-gray-400 hover:text-amber-400 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`w-7 h-7 ${rating !== null && n <= rating ? 'fill-amber-400 text-amber-400' : ''}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="feedback-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email (optional)
                </label>
                <input
                  id="feedback-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={submitting}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
                />
              </div>

              {error && (
                <p className="text-sm text-amber-400" role="alert">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-sm text-emerald-400" role="status">
                  Thanks! Feedback sent.
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
