import { useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { clearLocalData, getMeta, setMeta } from '@/lib/db';
import { initSync, runSync } from '@/lib/sync';

/**
 * Drives the offline mirror lifecycle:
 * - wires automatic sync triggers once (online / visibility),
 * - runs an initial sync when a user is signed in,
 * - wipes the local mirror when the user signs out or a different user signs in,
 *   so no account ever sees another's plans/sessions.
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const handledUserId = useRef<string | null>(null);

  useEffect(() => {
    initSync();
  }, []);

  useEffect(() => {
    if (loading) return;
    const userId = user?.id ?? null;
    if (handledUserId.current === userId) return;
    handledUserId.current = userId;

    let cancelled = false;
    (async () => {
      if (!userId) {
        await clearLocalData();
        return;
      }
      const storedUserId = await getMeta('user_id');
      if (storedUserId && storedUserId !== userId) {
        await clearLocalData();
      }
      if (cancelled) return;
      await setMeta('user_id', userId);
      void runSync();
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  return <>{children}</>;
}
