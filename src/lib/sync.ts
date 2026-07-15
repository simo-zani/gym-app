/**
 * Sync engine (Phase 4) — bidirectional sync between Dexie and Supabase.
 *
 * Push:  drains the outbox (offline workout writes) up to Supabase, in insertion
 *        order so a session is created before its sets.
 * Pull:  refreshes the local mirror of plans / plan-exercises / referenced
 *        exercises / sessions / sets from Supabase.
 *
 * Triggers: initial (after auth), on `window online`, and via the manual
 * "Sync ora" button. Everything is best-effort: offline just no-ops and the
 * outbox keeps the pending work until connectivity returns.
 */

import { useSyncExternalStore } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import {
  db,
  setMeta,
  type ExerciseRow,
  type PlanExerciseRow,
  type PlanRow,
  type SessionRow,
  type SessionSetRow,
} from '@/lib/db';
import type { Exercise, WorkoutPlanExercise } from '@/types/db';

// ── syncing-state pub/sub ────────────────────────────────────────────────────

let syncing = false;
const syncListeners = new Set<() => void>();

function setSyncing(value: boolean) {
  if (syncing === value) return;
  syncing = value;
  syncListeners.forEach((l) => l());
}

function subscribeSyncing(cb: () => void) {
  syncListeners.add(cb);
  return () => syncListeners.delete(cb);
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function isNetworkError(err: unknown): boolean {
  if (!navigator.onLine) return true;
  const msg = (err as { message?: string })?.message?.toLowerCase() ?? '';
  return (
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('timeout')
  );
}

// ── PULL ─────────────────────────────────────────────────────────────────────

/**
 * Pulls the user's plans, their exercises (with a denormalised snapshot) and the
 * referenced exercises into Dexie. Full-replace: these entities are edited online
 * only, so the remote copy is authoritative and this also reflects deletions.
 */
export async function pullPlans(userId: string): Promise<void> {
  const { data: plans, error: plansErr } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('user_id', userId);
  if (plansErr) throw plansErr;

  const planRows = (plans ?? []) as PlanRow[];
  const planIds = planRows.map((p) => p.id);

  let peRows: PlanExerciseRow[] = [];
  let exerciseRows: ExerciseRow[] = [];

  if (planIds.length) {
    const { data: pes, error: peErr } = await supabase
      .from('workout_plan_exercises')
      .select('*, exercise:exercises(id, name, muscle_group)')
      .in('plan_id', planIds);
    if (peErr) throw peErr;

    peRows = ((pes ?? []) as (WorkoutPlanExercise & {
      exercise: Pick<Exercise, 'id' | 'name' | 'muscle_group'> | null;
    })[]).map((pe) => {
      const { exercise, ...rest } = pe;
      return { ...rest, exercise_snapshot: exercise ?? null } as PlanExerciseRow;
    });

    // Referenced exercises only (NOT the whole catalogue) — keeps offline slim.
    const exerciseIds = Array.from(
      new Set(peRows.map((pe) => pe.exercise_id).filter(Boolean)),
    );
    if (exerciseIds.length) {
      const { data: exs, error: exErr } = await supabase
        .from('exercises')
        .select('*')
        .in('id', exerciseIds);
      if (exErr) throw exErr;
      exerciseRows = (exs ?? []) as ExerciseRow[];
    }
  }

  await db.transaction(
    'rw',
    [db.workout_plans, db.workout_plan_exercises, db.exercises],
    async () => {
      await db.workout_plans.clear();
      await db.workout_plan_exercises.clear();
      await db.exercises.clear();
      await db.workout_plans.bulkPut(planRows);
      await db.workout_plan_exercises.bulkPut(peRows);
      await db.exercises.bulkPut(exerciseRows);
    },
  );
}

/**
 * Pulls workout sessions and sets. Unlike plans these can be written offline, so
 * we merge instead of replacing: any local row still marked `_dirty` (not yet
 * pushed) wins and is left untouched.
 */
export async function pullSessions(userId: string): Promise<void> {
  const { data: sessions, error: sErr } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId);
  if (sErr) throw sErr;

  // RLS already scopes session sets to the current user's sessions.
  const { data: sets, error: setsErr } = await supabase
    .from('workout_session_sets')
    .select('*');
  if (setsErr) throw setsErr;

  const remoteSessions = (sessions ?? []) as Omit<SessionRow, '_dirty'>[];
  const remoteSets = (sets ?? []) as Omit<SessionSetRow, '_dirty'>[];

  await db.transaction('rw', [db.workout_sessions, db.workout_session_sets], async () => {
    for (const s of remoteSessions) {
      const local = await db.workout_sessions.get(s.id);
      if (local?._dirty === 1) continue; // keep un-pushed local edits
      await db.workout_sessions.put({ ...s, _dirty: 0 });
    }
    for (const st of remoteSets) {
      const local = await db.workout_session_sets.get(st.id);
      if (local?._dirty === 1) continue;
      await db.workout_session_sets.put({ ...st, _dirty: 0 });
    }
  });
}

// ── PUSH ─────────────────────────────────────────────────────────────────────

/** Drains the outbox to Supabase. Returns true if it fully emptied. */
export async function pushOutbox(): Promise<boolean> {
  const ops = await db.outbox.orderBy('id').toArray();

  for (const op of ops) {
    try {
      if (op.op === 'insert') {
        const { error } = await supabase.from(op.entity).upsert(op.payload);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(op.entity)
          .update(op.payload)
          .eq('id', op.rowId);
        if (error) throw error;
      }

      // Mark the mirrored row clean, then drop the op.
      if (op.entity === 'workout_sessions') {
        await db.workout_sessions.update(op.rowId, { _dirty: 0 });
      } else {
        await db.workout_session_sets.update(op.rowId, { _dirty: 0 });
      }
      await db.outbox.delete(op.id!);
    } catch (err) {
      await db.outbox.update(op.id!, {
        attempts: op.attempts + 1,
        lastError: (err as { message?: string })?.message ?? String(err),
      });
      // Transient → stop and retry the whole queue later (preserve order).
      if (isNetworkError(err)) return false;
      // Permanent (constraint/RLS): stop too, so we don't silently reorder;
      // the op stays in the outbox with its error recorded for inspection.
      return false;
    }
  }
  return true;
}

// ── orchestration ────────────────────────────────────────────────────────────

let pending = false;

/** Push local changes then pull remote updates. Safe to call repeatedly. */
export async function runSync(): Promise<void> {
  if (syncing) {
    pending = true;
    return;
  }
  if (!navigator.onLine) return;

  const userId = await currentUserId();
  if (!userId) return;

  setSyncing(true);
  try {
    await pushOutbox();
    await pullPlans(userId);
    await pullSessions(userId);
    await setMeta('last_sync_at', new Date().toISOString());
    // Refresh any mounted plan queries with the freshly pulled mirror.
    queryClient.invalidateQueries({ queryKey: ['plans'] });
  } catch {
    // Best-effort: leave the outbox intact and try again on the next trigger.
  } finally {
    setSyncing(false);
    if (pending) {
      pending = false;
      void runSync();
    }
  }
}

/** Manual "Sync ora" trigger. */
export function syncNow(): void {
  void runSync();
}

let initialised = false;

/** Wires up automatic sync triggers. Call once at app start. */
export function initSync(): void {
  if (initialised) return;
  initialised = true;

  window.addEventListener('online', () => void runSync());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void runSync();
  });
}

// ── status hooks (UI) ────────────────────────────────────────────────────────

function subscribeOnline(cb: () => void) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}

export interface SyncStatus {
  online: boolean;
  syncing: boolean;
  /** Number of local operations still waiting to be pushed. */
  pending: number;
}

export function useSyncStatus(): SyncStatus {
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
  const syncingState = useSyncExternalStore(
    subscribeSyncing,
    () => syncing,
    () => false,
  );
  const pendingCount = useLiveQuery(() => db.outbox.count(), [], 0) ?? 0;

  return { online, syncing: syncingState, pending: pendingCount };
}
