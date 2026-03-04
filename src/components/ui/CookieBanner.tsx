import { useState } from 'react';
import { Link } from 'react-router';
import { Modal } from './Modal';
import { Button } from './Button';

export function CookieBanner() {
  const [open, setOpen] = useState(() => !localStorage.getItem('cookie_consent'));

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    window.grantAnalyticsConsent?.();
    setOpen(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookie_consent', 'rejected');
    setOpen(false);
  };

  return (
    <Modal isOpen={open} onClose={handleReject}>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-base font-semibold text-neutral-900">Cookie Preferences</h2>
          <p className="mt-1.5 text-sm text-neutral-600">
            We use cookies to operate Foilio and, with your consent, to improve it via analytics.
            You can change your preference at any time by contacting us.
          </p>
        </div>

        {/* Cookie categories */}
        <div className="space-y-3">
          {/* Necessary */}
          <div className="flex items-start justify-between gap-4 rounded-lg border border-surface-border bg-surface-secondary px-4 py-3">
            <div>
              <p className="text-sm font-medium text-neutral-900">Necessary</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                Required for login sessions and core app functionality. Always active.
              </p>
            </div>
            <span className="shrink-0 mt-0.5 text-xs font-medium text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">
              Always on
            </span>
          </div>

          {/* Analytics */}
          <div className="flex items-start justify-between gap-4 rounded-lg border border-surface-border bg-surface-secondary px-4 py-3">
            <div>
              <p className="text-sm font-medium text-neutral-900">Analytics</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                Google Analytics helps us understand how Foilio is used so we can improve it.
                No personal data is sold.
              </p>
            </div>
            <span className="shrink-0 mt-0.5 text-xs font-medium text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">
              Optional
            </span>
          </div>
        </div>

        {/* Privacy Policy link */}
        <p className="text-xs text-neutral-400">
          Learn more in our{' '}
          <Link to="/privacy" className="text-primary-500 hover:underline" onClick={handleReject}>
            Privacy Policy
          </Link>
          .
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleReject} className="flex-1">
            Reject all
          </Button>
          <Button variant="primary" onClick={handleAccept} className="flex-1">
            Accept all
          </Button>
        </div>
      </div>
    </Modal>
  );
}
