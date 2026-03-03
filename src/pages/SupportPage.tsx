import { useState } from 'react';
import { Button } from '../components/ui/Button';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

const ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_KEY ?? 'fdb8b894-a688-48a3-ba5c-2976b92ddbc1';

export function SupportPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          name,
          email,
          message,
          subject: 'Foilio Support',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const inputClass =
    'w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-md transition-colors duration-150 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 placeholder:text-neutral-400';
  const labelClass = 'block text-xs font-medium text-neutral-600 mb-1.5';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">Support</h1>
      <p className="text-sm text-neutral-500 mb-8">
        Having trouble or a question? Get in touch and we'll get back to you as soon as possible.
      </p>

      <section className="space-y-8 text-sm sm:text-base text-neutral-700 leading-relaxed">
        <div>

          {status === 'success' ? (
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Message sent! We'll get back to you at the email you provided.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="support-name">Name</label>
                <input
                  id="support-name"
                  type="text"
                  className={inputClass}
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={status === 'loading'}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="support-email">Email</label>
                <input
                  id="support-email"
                  type="email"
                  className={inputClass}
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={status === 'loading'}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="support-message">Message</label>
                <textarea
                  id="support-message"
                  className={`${inputClass} resize-none`}
                  placeholder="Describe your issue or question..."
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  disabled={status === 'loading'}
                />
              </div>

              {status === 'error' && (
                <p className="text-sm text-red-600">
                  Something went wrong. Please try again or email us directly.
                </p>
              )}

              <Button type="submit" disabled={status === 'loading'} className="w-auto">
                {status === 'loading' ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Sending…
                  </>
                ) : (
                  'Send message'
                )}
              </Button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
