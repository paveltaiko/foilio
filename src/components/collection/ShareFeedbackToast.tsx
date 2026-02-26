import type { ShareToastType } from './ShareCollectionButton';

interface ShareFeedbackToastProps {
  message: string | null;
  type: ShareToastType;
}

export function ShareFeedbackToast({ message, type }: ShareFeedbackToastProps) {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 px-2">
      <div
        className={`rounded-lg px-3 py-2 text-xs font-medium shadow-md ${
          type === 'success'
            ? 'bg-neutral-900 text-white'
            : 'bg-red-600 text-white'
        }`}
        role="status"
        aria-live="polite"
      >
        {message}
      </div>
    </div>
  );
}
