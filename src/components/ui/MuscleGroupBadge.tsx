import type { MuscleGroup } from '@/types/db';
import { muscleGroupBadgeClass, muscleGroupLabel } from '@/features/exercises/muscleGroups';

export function MuscleGroupBadge({ group }: { group: MuscleGroup | null | undefined }) {
  return (
    <span
      className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${muscleGroupBadgeClass(group)}`}
    >
      {muscleGroupLabel(group)}
    </span>
  );
}
