import type { MuscleGroup } from '@/types/db';

interface MuscleGroupConfig {
  value: MuscleGroup;
  /** i18n key — e.g. 'exercises.muscleGroups.chest' */
  labelKey: string;
  /** Tailwind classes for the badge pill (background + text), aligned with the mockup. */
  badgeClass: string;
  /** Tailwind classes for the filter chip when ACTIVE (selected). Matches badge palette. */
  activeClass: string;
}

export const MUSCLE_GROUPS: MuscleGroupConfig[] = [
  {
    value: 'chest',
    labelKey: 'exercises.muscleGroups.chest',
    badgeClass: 'bg-blueSoft/15 text-blue-300',
    activeClass: 'bg-blue-400/25 text-blue-200 border border-blue-400/30',
  },
  {
    value: 'back',
    labelKey: 'exercises.muscleGroups.back',
    badgeClass: 'bg-purple-400/15 text-purple-300',
    activeClass: 'bg-purple-400/25 text-purple-200 border border-purple-400/30',
  },
  {
    value: 'legs',
    labelKey: 'exercises.muscleGroups.legs',
    badgeClass: 'bg-successGreen/15 text-emerald-300',
    activeClass: 'bg-emerald-400/25 text-emerald-200 border border-emerald-400/30',
  },
  {
    value: 'shoulders',
    labelKey: 'exercises.muscleGroups.shoulders',
    badgeClass: 'bg-cyan-400/15 text-cyan-300',
    activeClass: 'bg-cyan-400/25 text-cyan-200 border border-cyan-400/30',
  },
  {
    value: 'arms',
    labelKey: 'exercises.muscleGroups.arms',
    badgeClass: 'bg-amber-400/15 text-amber-300',
    activeClass: 'bg-amber-400/25 text-amber-200 border border-amber-400/30',
  },
  {
    value: 'core',
    labelKey: 'exercises.muscleGroups.core',
    badgeClass: 'bg-dangerRed/15 text-red-300',
    activeClass: 'bg-red-400/25 text-red-200 border border-red-400/30',
  },
  {
    value: 'cardio',
    labelKey: 'exercises.muscleGroups.cardio',
    badgeClass: 'bg-pink-400/15 text-pink-300',
    activeClass: 'bg-pink-400/25 text-pink-200 border border-pink-400/30',
  },
  {
    value: 'other',
    labelKey: 'exercises.muscleGroups.other',
    badgeClass: 'bg-slate-500/15 text-slate-300',
    activeClass: 'bg-slate-400/25 text-slate-200 border border-slate-400/40',
  },
];

const BY_VALUE = new Map(MUSCLE_GROUPS.map((g) => [g.value, g]));

/** Returns the i18n key for a muscle group label. Use with `t(muscleGroupLabelKey(value))`. */
export function muscleGroupLabelKey(value: MuscleGroup | null | undefined): string {
  if (!value) return 'exercises.muscleGroups.other';
  return BY_VALUE.get(value)?.labelKey ?? 'exercises.muscleGroups.other';
}

export function muscleGroupBadgeClass(value: MuscleGroup | null | undefined): string {
  if (!value) return 'bg-slate-500/15 text-slate-300';
  return BY_VALUE.get(value)?.badgeClass ?? 'bg-slate-500/15 text-slate-300';
}

/**
 * Maps muscle group names in all supported languages (IT + EN) to their MuscleGroup value.
 * Used to enable searching exercises by muscle group name (e.g. "braccia" or "arms").
 */
const MUSCLE_GROUP_ALIASES: Record<string, MuscleGroup> = {
  // Italian
  petto: 'chest',
  schiena: 'back',
  gambe: 'legs',
  gamba: 'legs',
  spalle: 'shoulders',
  spalla: 'shoulders',
  braccia: 'arms',
  braccio: 'arms',
  core: 'core',
  cardio: 'cardio',
  altro: 'other',
  altri: 'other',
  // English
  chest: 'chest',
  back: 'back',
  legs: 'legs',
  leg: 'legs',
  shoulders: 'shoulders',
  shoulder: 'shoulders',
  arms: 'arms',
  arm: 'arms',
  other: 'other',
};

/**
 * Returns the MuscleGroup if the search term is a known muscle group name
 * in any supported language (case-insensitive). Returns null otherwise.
 */
export function getMuscleGroupBySearchTerm(term: string): MuscleGroup | null {
  return MUSCLE_GROUP_ALIASES[term.toLowerCase().trim()] ?? null;
}
