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
      let q = supabase.from('exercises').select('*').order('name');
      if (search.trim()) q = q.ilike('name', `%${search.trim()}%`);
      if (muscles.length) q = q.in('muscle_group', muscles);
      const { data, error } = await q;
      if (error) throw error;
      return data as Exercise[];
    },
  });
}

export interface ExerciseInput {
  name: string;
  description?: string | null;
  muscle_group?: MuscleGroup | null;
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
          muscle_group: input.muscle_group ?? null,
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
      const { data, error } = await supabase
        .from('exercises')
        .update({
          name: input.name.trim(),
          description: input.description?.trim() || null,
          muscle_group: input.muscle_group ?? null,
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
