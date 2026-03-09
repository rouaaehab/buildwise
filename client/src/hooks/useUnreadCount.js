import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

/**
 * Returns unread message count for the current user. Refetches when pathname
 * changes (e.g. when leaving chat so badge updates after messages are marked read).
 */
export function useUnreadCount(user, pathname) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    let cancelled = false;
    apiFetch('/api/messages/unread-count')
      .then((res) => {
        if (!cancelled) setUnreadCount(res.unread_count ?? 0);
      })
      .catch(() => {
        if (!cancelled) setUnreadCount(0);
      });
    return () => { cancelled = true; };
  }, [user?.id, pathname]);

  return unreadCount;
}
