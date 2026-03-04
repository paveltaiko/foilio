import { useState, useRef, useEffect } from 'react';
import { Share, Check } from 'lucide-react';
import type { User } from 'firebase/auth';
import { getOrCreateShareToken } from '../../services/sharing';
import { IconButton } from '../ui/IconButton';

export type ShareToastType = 'success' | 'error';

interface ShareCollectionButtonProps {
  user: User;
  onTokenReady: (token: string) => void;
  onFeedback: (message: string, type: ShareToastType) => void;
}

async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback below
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

function isMobileDevice(): boolean {
  const userAgent = navigator.userAgent ?? '';
  const looksMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
  return looksMobile || navigator.maxTouchPoints > 1;
}

export function ShareCollectionButton({ user, onTokenReady, onFeedback }: ShareCollectionButtonProps) {
  const [succeeded, setSucceeded] = useState(false);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => { clearTimeout(timeoutRef.current); };
  }, []);

  const handleShare = async () => {
    if (loading) return;
    try {
      setLoading(true);
      const token = await getOrCreateShareToken({
        uid: user.uid,
        displayName: user.displayName ?? null,
        photoURL: user.photoURL ?? null,
      });
      onTokenReady(token);
      const url = `${window.location.origin}/share/${token}`;

      const shouldUseNativeShare = isMobileDevice() && typeof navigator.share === 'function';
      if (shouldUseNativeShare) {
        await navigator.share({
          title: 'Foilio collection',
          text: 'Check out my MTG collection',
          url,
        });
        onFeedback('Shared', 'success');
      } else {
        const copiedOk = await copyText(url);
        if (!copiedOk) {
          window.prompt('Copy this link:', url);
        }
        onFeedback('Link copied', 'success');
      }
      setSucceeded(true);
      timeoutRef.current = setTimeout(() => setSucceeded(false), 2000);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setSucceeded(false);
      void err;
      onFeedback('Could not create share link. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IconButton
      onClick={handleShare}
      disabled={loading}
      aria-label="Share collection"
      title="Share collection"
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-500 rounded-full animate-spin" aria-hidden="true" />
      ) : succeeded ? (
        <Check className="w-[18px] h-[18px] text-owned" />
      ) : (
        <Share className="w-[18px] h-[18px]" />
      )}
    </IconButton>
  );
}
