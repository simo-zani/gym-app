/**
 * Local offline-first database (Phase 4).
 *
 * Scope decision (see fasi/AGGIORNAMENTO_PROGETTO.md): the app must work fully
 * offline for the *gym* scenario — read saved plans, run them, and save the
 * finished workout. The full exercise catalogue (858 rows) is intentionally NOT
 * mirrored: only the exercises actually referenced by the user's plans are kept
 * locally, so an offline run can render exercise names/muscle groups.
 *
 * Mirror strategy per entity:
 * - workout_plans / workout_plan_exercises / exercises(subset): pull-only mirror.
 *   These are edited online only; on any online edit we re-pull, so the remote
 *   copy is authoritative and we can overwrite freely on pull.
 * - workout_sessions / workout_session_sets: written offline. Each write also
 *   enqueues an outbox op; the row carries `_dirty=1` until the push succeeds so
 *   a concurrent pull never clobbers a not-yet-synced local row.
 */

import Dexie, { type Table } from 'dexie';
import type {
  Exercise,
  WorkoutPlan,
  WorkoutPlanExercise,
  WorkoutSession,
  WorkoutSessionSet,
} from '@/types/db';

/** Extra bookkeeping for entities that can be written while offline. */
export interface SyncMeta {
  /** 1 = has local changes not yet pushed to Supabase. */
  _dirty: 0 | 1;
}

export type ExerciseRow = Exercise;
export type PlanRow = WorkoutPlan;
export type PlanExerciseRow = WorkoutPlanExercise & {
  /** Denormalised so the runner can render offline without a join. */
  exercise_snapshot: Pick<Exercise, 'id' | 'name' | 'muscle_group'> | null;
};
export type SessionRow = WorkoutSession & SyncMeta;
export type SessionSetRow = WorkoutSessionSet & SyncMeta;

export type OutboxEntity = 'workout_sessions' | 'workout_session_sets';
export type OutboxOpType = 'insert' | 'update';

export interface OutboxOp {
  id?: number;
  entity: OutboxEntity;
  op: OutboxOpType;
  rowId: string;
  /** Payload sent to Supabase (upsert for insert, patch for update). */
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

export interface MetaRow {
  key: string;
  value: string;
}

class GymDb extends Dexie {
  exercises!: Table<ExerciseRow, string>;
  workout_plans!: Table<PlanRow, string>;
  workout_plan_exercises!: Table<PlanExerciseRow, string>;
  workout_sessions!: Table<SessionRow, string>;
  workout_session_sets!: Table<SessionSetRow, string>;
  outbox!: Table<OutboxOp, number>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super('gymapp');
    this.version(1).stores({
      exercises: 'id, muscle_group',
      workout_plans: 'id, user_id, updated_at',
      workout_plan_exercises: 'id, plan_id, [plan_id+position]',
      workout_sessions: 'id, user_id, started_at, _dirty',
      workout_session_sets: 'id, session_id, _dirty',
      outbox: '++id, entity, createdAt',
      meta: 'key',
    });
  }
}

export const db = new GymDb();

// ── meta helpers ─────────────────────────────────────────────────────────────

export async function getMeta(key: string): Promise<string | null> {
  const row = await db.meta.get(key);
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  await db.meta.put({ key, value });
}

/**
 * Wipes all mirrored data. Called on sign-out / user switch so a different
 * account never sees the previous user's plans and sessions.
 */
export async function clearLocalData(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.exercises,
      db.workout_plans,
      db.workout_plan_exercises,
      db.workout_sessions,
      db.workout_session_sets,
      db.outbox,
      db.meta,
    ],
    async () => {
      await Promise.all([
        db.exercises.clear(),
        db.workout_plans.clear(),
        db.workout_plan_exercises.clear(),
        db.workout_sessions.clear(),
        db.workout_session_sets.clear(),
        db.outbox.clear(),
        db.meta.clear(),
      ]);
    },
  );
}
