import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Exercise, MuscleGroup } from '@/types/db';

export interface ExerciseFilters {
  search?: string;
  muscles?: MuscleGroup[];
}

export const exercisesKeys = {
  all: ['exercises'] as const,
  list: (filters: ExerciseFilters) => ['exercises', filters] as const,
};

export function useExercises(filters: ExerciseFilters = {}) {
  const { search = '', muscles = [] } = filters;
  return useQuery({
    queryKey: exercisesKeys.list({ search, muscles }),
    queryFn: async (): Promise<Exercise[]> => {
      let q = supabase
        .from('exercises')
        .select('*, user_exercise_customizations(*)')
        .order('name');
      if (search.trim()) q = q.ilike('name', `%${search.trim()}%`);
      if (muscles.length) q = q.in('muscle_group', muscles);
      const { data, error } = await q;
      if (error) throw error;

      const raw = data as (Exercise & { user_exercise_customizations: any[] })[];
      return raw.map((ex) => {
        const cust = ex.user_exercise_customizations?.[0];
        if (!cust) return ex;
        return {
          ...ex,
          description: cust.description !== null ? cust.description : ex.description,
          description_it: cust.description_it !== null ? cust.description_it : ex.description_it,
          is_bodyweight: cust.is_bodyweight !== null ? cust.is_bodyweight : ex.is_bodyweight,
          equipment: cust.equipment !== null ? cust.equipment : ex.equipment,
        };
      });
    },
  });
}

export interface ExerciseInput {
  name: string;
  description?: string | null;
  description_it?: string | null;
  muscle_group?: MuscleGroup | null;
  is_bodyweight?: boolean;
  equipment?: string | null;
  owner_id?: string | null;
}

export function useCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ExerciseInput): Promise<Exercise> => {
      const { data: userData } = await supabase.auth.getUser();
      const ownerId = userData.user?.id;
      if (!ownerId) throw new Error('Utente non autenticato');

      const { data, error } = await supabase
        .from('exercises')
        .insert({
          name: input.name.trim(),
          description: input.description?.trim() || null,
          description_it: input.description_it?.trim() || null,
          muscle_group: input.muscle_group ?? null,
          is_bodyweight: input.is_bodyweight ?? false,
          equipment: input.equipment ?? null,
          source: 'custom',
          owner_id: ownerId,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Exercise;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: exercisesKeys.all }),
  });
}

export function useUpdateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: ExerciseInput & { id: string }): Promise<Exercise> => {
      if (input.owner_id === null) {
        // Global exercise override: write to user_exercise_customizations
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) throw new Error('Utente non autenticato');

        const { error: upsertError } = await supabase
          .from('user_exercise_customizations')
          .upsert({
            exercise_id: id,
            user_id: userId,
            description: input.description?.trim() || null,
            description_it: input.description_it?.trim() || null,
            is_bodyweight: input.is_bodyweight ?? false,
            equipment: input.equipment ?? null,
          });
        if (upsertError) throw upsertError;

        // Retrieve full exercise and merged customizations to return
        const { data: exData, error: fetchError } = await supabase
          .from('exercises')
          .select('*, user_exercise_customizations(*)')
          .eq('id', id)
          .single();
        if (fetchError) throw fetchError;
        
        const row = exData as any;
        const cust = row.user_exercise_customizations?.[0];
        return {
          ...row,
          description: cust && cust.description !== null ? cust.description : row.description,
          description_it: cust && cust.description_it !== null ? cust.description_it : row.description_it,
          is_bodyweight: cust && cust.is_bodyweight !== null ? cust.is_bodyweight : row.is_bodyweight,
          equipment: cust && cust.equipment !== null ? cust.equipment : row.equipment,
        } as Exercise;
      }

      // Custom exercise: update exercises table row directly
      const { data, error } = await supabase
        .from('exercises')
        .update({
          name: input.name.trim(),
          description: input.description?.trim() || null,
          description_it: input.description_it?.trim() || null,
          muscle_group: input.muscle_group ?? null,
          is_bodyweight: input.is_bodyweight ?? false,
          equipment: input.equipment ?? null,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Exercise;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: exercisesKeys.all }),
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('exercises').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: exercisesKeys.all }),
  });
}

