import { useState, useEffect, useCallback } from 'react';
import { isFirebaseConfigured } from '../config/firebase';
import { getExistingShareToken, syncVisibleSetsToShared } from '../services/sharing';
import type { ShareToastType } from '../components/collection/ShareCollectionButton';

export function useShareCollection(userId: string, visibleSetIds: string[] | undefined) {
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareToastMessage, setShareToastMessage] = useState<string | null>(null);
  const [shareToastType, setShareToastType] = useState<ShareToastType>('success');

  // Auto-dismiss toast
  useEffect(() => {
    if (!shareToastMessage) return;
    const timeoutId = window.setTimeout(() => {
      setShareToastMessage(null);
    }, 2200);
    return () => window.clearTimeout(timeoutId);
  }, [shareToastMessage]);

  // Fetch existing share token
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let cancelled = false;
    getExistingShareToken(userId)
      .then((token) => {
        if (!cancelled) setShareToken(token);
      })
      .catch(() => {
        if (!cancelled) setShareToken(null);
      });
    return () => { cancelled = true; };
  }, [userId]);

  // Sync visible sets to shared collection when settings change
  useEffect(() => {
    if (!shareToken || !isFirebaseConfigured || visibleSetIds === undefined) return;
    void syncVisibleSetsToShared(shareToken, visibleSetIds);
  }, [shareToken, visibleSetIds]);

  const showShareToast = useCallback((message: string, type: ShareToastType) => {
    setShareToastType(type);
    setShareToastMessage(message);
  }, []);

  return {
    shareToken,
    setShareToken,
    shareToastMessage,
    shareToastType,
    showShareToast,
  };
}
