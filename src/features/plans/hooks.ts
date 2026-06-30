import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { computePlanDurationMinutes } from '@/lib/planDuration';
import type {
  ExerciseMode,
  MuscleGroup,
  PlanExerciseWithExercise,
  PyramidSet,
  WorkoutPlan,
} from '@/types/db';

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

interface RawItem {
  id: string;
  mode: ExerciseMode;
  sets: number;
  reps: number | null;
  duration_seconds: number | null;
  rest_seconds: number;
  pyramid_config: PyramidSet[] | null;
  exercise: { muscle_group: MuscleGroup | null } | null;
}

interface RawPlanWithItems extends WorkoutPlan {
  items: RawItem[];
}

export function usePlans() {
  return useQuery({
    queryKey: plansKeys.list,
    queryFn: async (): Promise<PlanListItem[]> => {
      const { data, error } = await supabase
        .from('workout_plans')
        .select(
          '*, items:workout_plan_exercises(id, mode, sets, reps, duration_seconds, rest_seconds, pyramid_config, exercise:exercises(muscle_group))'
        )
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });
      if (error) throw error;

      return (data as RawPlanWithItems[]).map((p) => {
        const muscles = Array.from(
          new Set(
            p.items
              .map((it) => it.exercise?.muscle_group)
              .filter((m): m is MuscleGroup => Boolean(m)),
          ),
        );
        const estimatedMinutes = computePlanDurationMinutes(p.items);
        const { items, ...plan } = p;
        return { ...plan, exerciseCount: items.length, muscles, estimatedMinutes };
      });
    },
  });
}

export function usePlan(id: string | undefined) {
  return useQuery({
    queryKey: plansKeys.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: async (): Promise<WorkoutPlan> => {
      const { data, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as WorkoutPlan;
    },
  });
}

export function usePlanExercises(planId: string | undefined) {
  return useQuery({
    queryKey: plansKeys.exercises(planId ?? ''),
    enabled: Boolean(planId),
    queryFn: async (): Promise<PlanExerciseWithExercise[]> => {
      const { data, error } = await supabase
        .from('workout_plan_exercises')
        .select('*, exercise:exercises(id, name, muscle_group)')
        .eq('plan_id', planId!)
        .order('position');
      if (error) throw error;
      return data as PlanExerciseWithExercise[];
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
    onSuccess: () => qc.invalidateQueries({ queryKey: plansKeys.all }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: plansKeys.all }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: plansKeys.all }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: plansKeys.all }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: plansKeys.all }),
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
    onSuccess: () => {
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
    onSuccess: () => {
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
    onSuccess: () => {
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: plansKeys.exercises(planId) });
      qc.invalidateQueries({ queryKey: plansKeys.list });
    },
  });
}
