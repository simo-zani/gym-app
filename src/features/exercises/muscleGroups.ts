import type { MuscleGroup } from '@/types/db';

interface MuscleGroupConfig {
  value: MuscleGroup;
  label: string; // Italian label for the UI
  // Tailwind classes for the badge pill (background + text), aligned with the mockup.
  badgeClass: string;
}

export const MUSCLE_GROUPS: MuscleGroupConfig[] = [
  { value: 'chest', label: 'Petto', badgeClass: 'bg-blueSoft/15 text-blue-300' },
  { value: 'back', label: 'Schiena', badgeClass: 'bg-purple-400/15 text-purple-300' },
  { value: 'legs', label: 'Gambe', badgeClass: 'bg-successGreen/15 text-emerald-300' },
  { value: 'shoulders', label: 'Spalle', badgeClass: 'bg-cyan-400/15 text-cyan-300' },
  { value: 'arms', label: 'Braccia', badgeClass: 'bg-amber-400/15 text-amber-300' },
  { value: 'core', label: 'Core', badgeClass: 'bg-dangerRed/15 text-red-300' },
  { value: 'cardio', label: 'Cardio', badgeClass: 'bg-pink-400/15 text-pink-300' },
  { value: 'other', label: 'Altro', badgeClass: 'bg-slate-500/15 text-slate-300' },
];

const BY_VALUE = new Map(MUSCLE_GROUPS.map((g) => [g.value, g]));

export function muscleGroupLabel(value: MuscleGroup | null | undefined): string {
  if (!value) return 'Altro';
  return BY_VALUE.get(value)?.label ?? 'Altro';
}

export function muscleGroupBadgeClass(value: MuscleGroup | null | undefined): string {
  if (!value) return 'bg-slate-500/15 text-slate-300';
  return BY_VALUE.get(value)?.badgeClass ?? 'bg-slate-500/15 text-slate-300';
}
