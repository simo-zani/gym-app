import { useTranslation } from 'react-i18next';
import type { MuscleGroup } from '@/types/db';
import { muscleGroupBadgeClass } from '@/features/exercises/muscleGroups';

const MUSCLE_GROUP_KEYS: Record<MuscleGroup | 'other', string> = {
  chest: 'exercises.muscleGroups.chest',
  back: 'exercises.muscleGroups.back',
  legs: 'exercises.muscleGroups.legs',
  shoulders: 'exercises.muscleGroups.shoulders',
  arms: 'exercises.muscleGroups.arms',
  core: 'exercises.muscleGroups.core',
  cardio: 'exercises.muscleGroups.cardio',
  other: 'exercises.muscleGroups.other',
};

export function MuscleGroupBadge({ group }: { group: MuscleGroup | null | undefined }) {
  const { t } = useTranslation();
  const key = group ? MUSCLE_GROUP_KEYS[group] : MUSCLE_GROUP_KEYS.other;

  return (
    <span
      className={`inline-block min-w-[4.5rem] rounded-md px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wide ${muscleGroupBadgeClass(group)}`}
    >
      {t(key)}
    </span>
  );
}
