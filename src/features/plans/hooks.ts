import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import { pullPlans } from '@/lib/sync';
import { computePlanDurationMinutes } from '@/lib/planDuration';
import type {
  ExerciseMode,
  MuscleGroup,
  PlanExerciseWithExercise,
  PyramidSet,
  WorkoutPlan,
} from '@/types/db';

/** Re-pulls the plan mirror into Dexie after an online edit (best-effort). */
async function refreshPlanMirror(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user?.id;
  if (!userId) return;
  try {
    await pullPlans(userId);
  } catch {
    // Offline or transient: the mirror stays as-is until the next sync.
  }
}

export const plansKeys = {
  all: ['plans'] as const,
  list: ['plans', 'list'] as const,
  detail: (id: string) => ['plans', 'detail', id] as const,
  exercises: (planId: string) => ['plans', 'exercises', planId] as const,
};

// Plan enriched with the data needed to render a list card.
export interface PlanListItem extends WorkoutPlan {
  exerciseCount: number;
  muscles: MuscleGroup[];
  estimatedMinutes: number;
}

// Reads come from the Dexie mirror so they work offline. The sync engine keeps
// the mirror fresh and invalidates these queries after each pull.

export function usePlans() {
  return useQuery({
    queryKey: plansKeys.list,
    queryFn: async (): Promise<PlanListItem[]> => {
      const [plans, allItems] = await Promise.all([
        db.workout_plans.toArray(),
        db.workout_plan_exercises.toArray(),
      ]);

      const itemsByPlan = new Map<string, typeof allItems>();
      for (const it of allItems) {
        const arr = itemsByPlan.get(it.plan_id) ?? [];
        arr.push(it);
        itemsByPlan.set(it.plan_id, arr);
      }

      return plans
        .filter((p) => !p.is_archived)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .map((p) => {
          const items = itemsByPlan.get(p.id) ?? [];
          const muscles = Array.from(
            new Set(
              items
                .map((it) => it.exercise_snapshot?.muscle_group)
                .filter((m): m is MuscleGroup => Boolean(m)),
            ),
          );
          const estimatedMinutes = computePlanDurationMinutes(items);
          return { ...p, exerciseCount: items.length, muscles, estimatedMinutes };
        });
    },
  });
}

export function usePlan(id: string | undefined) {
  return useQuery({
    queryKey: plansKeys.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: async (): Promise<WorkoutPlan> => {
      const plan = await db.workout_plans.get(id!);
      if (!plan) throw new Error('Scheda non trovata');
      return plan;
    },
  });
}

export function usePlanExercises(planId: string | undefined) {
  return useQuery({
    queryKey: plansKeys.exercises(planId ?? ''),
    enabled: Boolean(planId),
    queryFn: async (): Promise<PlanExerciseWithExercise[]> => {
      const items = await db.workout_plan_exercises
        .where('plan_id')
        .equals(planId!)
        .toArray();
      return items
        .sort((a, b) => a.position - b.position)
        .map(({ exercise_snapshot, ...rest }) => ({
          ...rest,
          exercise: exercise_snapshot,
        }));
    },
  });
}

// ---------- plan mutations ----------

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, difficulty = 3 }: { name: string; difficulty?: number }): Promise<WorkoutPlan> => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Utente non autenticato');

      const { data, error } = await supabase
        .from('workout_plans')
        .insert({ name: name.trim(), user_id: userId, difficulty })
        .select()
        .single();
      if (error) throw error;
      return data as WorkoutPlan;
    },
    onSuccess: async () => {
      await refreshPlanMirror();
      qc.invalidateQueries({ queryKey: plansKeys.all });
    },
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: { id: string } & Partial<Pick<WorkoutPlan, 'name' | 'notes' | 'is_archived' | 'is_favorite' | 'difficulty'>>): Promise<void> => {
      const { error } = await supabase.from('workout_plans').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshPlanMirror();
      qc.invalidateQueries({ queryKey: plansKeys.all });
    },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }): Promise<void> => {
      const { error } = await supabase
        .from('workout_plans')
        .update({ is_favorite: isFavorite })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshPlanMirror();
      qc.invalidateQueries({ queryKey: plansKeys.all });
    },
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // workout_plan_exercises rows go away via ON DELETE CASCADE.
      const { error } = await supabase.from('workout_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshPlanMirror();
      qc.invalidateQueries({ queryKey: plansKeys.all });
    },
  });
}

export function useDuplicatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string): Promise<WorkoutPlan> => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Utente non autenticato');

      const { data: original, error: planErr } = await supabase
        .from('workout_plans')
        .select('name, notes, difficulty')
        .eq('id', planId)
        .single();
      if (planErr) throw planErr;

      const { data: newPlan, error: insErr } = await supabase
        .from('workout_plans')
        .insert({ name: `${original.name} (copia)`, notes: original.notes, user_id: userId, difficulty: original.difficulty })
        .select()
        .single();
      if (insErr) throw insErr;

      const { data: items, error: itemsErr } = await supabase
        .from('workout_plan_exercises')
        .select('exercise_id, position, sets, mode, reps, duration_seconds, weight_kg, rest_seconds, notes')
        .eq('plan_id', planId);
      if (itemsErr) throw itemsErr;

      if (items && items.length) {
        const clones = items.map((it) => ({ ...it, plan_id: (newPlan as WorkoutPlan).id }));
        const { error: cloneErr } = await supabase.from('workout_plan_exercises').insert(clones);
        if (cloneErr) throw cloneErr;
      }
      return newPlan as WorkoutPlan;
    },
    onSuccess: async () => {
      await refreshPlanMirror();
      qc.invalidateQueries({ queryKey: plansKeys.all });
    },
  });
}

// ---------- plan-exercise mutations ----------

export interface PlanExerciseInput {
  exercise_id: string;
  sets: number;
  mode: ExerciseMode;
  reps: number | null;
  duration_seconds: number | null;
  weight_kg: number | null;
  rest_seconds: number;
  notes: string | null;
  pyramid_config?: PyramidSet[] | null;
}

export function useAddPlanExercise(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PlanExerciseInput): Promise<void> => {
      // New exercise goes to the end: position = current max + 1.
      const { count, error: countErr } = await supabase
        .from('workout_plan_exercises')
        .select('id', { count: 'exact', head: true })
        .eq('plan_id', planId);
      if (countErr) throw countErr;

      const { error } = await supabase
        .from('workout_plan_exercises')
        .insert({ ...input, plan_id: planId, position: count ?? 0 });
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshPlanMirror();
      qc.invalidateQueries({ queryKey: plansKeys.exercises(planId) });
      qc.invalidateQueries({ queryKey: plansKeys.list });
    },
  });
}

export function useUpdatePlanExercise(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: PlanExerciseInput & { id: string }): Promise<void> => {
      const { error } = await supabase
        .from('workout_plan_exercises')
        .update(input)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshPlanMirror();
      qc.invalidateQueries({ queryKey: plansKeys.exercises(planId) });
      qc.invalidateQueries({ queryKey: plansKeys.list });
    },
  });
}

export function useDeletePlanExercise(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('workout_plan_exercises').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshPlanMirror();
      qc.invalidateQueries({ queryKey: plansKeys.exercises(planId) });
      qc.invalidateQueries({ queryKey: plansKeys.list });
    },
  });
}

export function useReorderPlanExercises(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    // Receives the ids in their new order; writes back position = index.
    mutationFn: async (orderedIds: string[]): Promise<void> => {
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase
            .from('workout_plan_exercises')
            .update({ position: index })
            .eq('id', id)
            .then(({ error }) => {
              if (error) throw error;
            }),
        ),
      );
    },
    onSuccess: async () => {
      await refreshPlanMirror();
      qc.invalidateQueries({ queryKey: plansKeys.exercises(planId) });
      qc.invalidateQueries({ queryKey: plansKeys.list });
    },
  });
}
