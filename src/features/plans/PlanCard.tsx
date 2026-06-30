import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Trash2,
  Star,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MuscleGroup } from '@/types/db';
import type { PlanListItem } from './hooks';
import { useSwipeAction } from '@/hooks/useSwipeAction';
import { useToggleFavorite } from './hooks';

interface PlanCardProps {
  plan: PlanListItem;
  onDelete: (plan: PlanListItem) => void;
}

// ─── Colori presi direttamente dalla pagina esercizi ─────────────────────────
const GROUP_CONFIG: Record<
  MuscleGroup,
  { border: string; bg: string; glow: string; labelKey: string; dot: string }
> = {
  chest:     { border: '#60a5fa', bg: 'rgba(96,165,250,0.08)',    glow: 'rgba(96,165,250,0.25)',    labelKey: 'exercises.muscleGroups.chest',     dot: '#60a5fa' },
  back:      { border: '#c084fc', bg: 'rgba(192,132,252,0.08)',   glow: 'rgba(192,132,252,0.25)',   labelKey: 'exercises.muscleGroups.back',      dot: '#c084fc' },
  legs:      { border: '#34d399', bg: 'rgba(52,211,153,0.08)',    glow: 'rgba(52,211,153,0.25)',    labelKey: 'exercises.muscleGroups.legs',      dot: '#34d399' },
  shoulders: { border: '#22d3ee', bg: 'rgba(34,211,238,0.08)',    glow: 'rgba(34,211,238,0.25)',    labelKey: 'exercises.muscleGroups.shoulders', dot: '#22d3ee' },
  arms:      { border: '#fbbf24', bg: 'rgba(251,191,36,0.08)',    glow: 'rgba(251,191,36,0.25)',    labelKey: 'exercises.muscleGroups.arms',      dot: '#fbbf24' },
  core:      { border: '#f87171', bg: 'rgba(248,113,113,0.08)',    glow: 'rgba(248,113,113,0.25)',    labelKey: 'exercises.muscleGroups.core',      dot: '#f87171' },
  cardio:    { border: '#f472b6', bg: 'rgba(244,114,182,0.08)',   glow: 'rgba(244,114,182,0.25)',   labelKey: 'exercises.muscleGroups.cardio',    dot: '#f472b6' },
  other:     { border: '#94a3b8', bg: 'rgba(148,163,184,0.08)',   glow: 'rgba(148,163,184,0.25)',   labelKey: 'exercises.muscleGroups.other',     dot: '#94a3b8' },
};

const FALLBACK = { border: '#94a3b8', bg: 'rgba(148,163,184,0.06)', glow: 'rgba(148,163,184,0.15)', labelKey: 'exercises.muscleGroups.other', dot: '#94a3b8' };

function getConfig(muscles: MuscleGroup[]) {
  return muscles.length ? (GROUP_CONFIG[muscles[0]] ?? FALLBACK) : FALLBACK;
}

// ─── Traduzione Label Difficoltà ─────────────────────────────────────────────
function getDifficultyLabel(level: number, t: (key: string) => string): string {
  const safeLevel = Math.max(1, Math.min(5, level));
  return t(`plans.difficultyLevels.${safeLevel}`);
}



// ─── SVG Silhouette decorative minimaliste ──────────────────────────────────
function PlanMuscleSVG({ group }: { group: MuscleGroup | null | undefined }) {
  const color = group ? (GROUP_CONFIG[group]?.dot ?? '#94a3b8') : '#94a3b8';
  const opacity = 0.55;

  switch (group) {
    case 'chest':
      return (
        <svg width="80" height="90" viewBox="0 0 100 110" style={{ opacity }}>
          <circle cx="50" cy="30" r="10" fill="none" stroke={color} strokeWidth="1.5" />
          <path d="M32,50 C38,42 46,40 50,42 L50,62 C44,62 36,58 32,50 Z" fill={color} />
          <path d="M68,50 C62,42 54,40 50,42 L50,62 C56,62 64,58 68,50 Z" fill={color} />
          <path d="M42,62 L44,98 M58,62 L56,98" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M44,76 L56,76" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M44,84 L56,84" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'back':
      return (
        <svg width="80" height="90" viewBox="0 0 100 110" style={{ opacity }}>
          <circle cx="50" cy="30" r="10" fill="none" stroke={color} strokeWidth="1.5" />
          <path d="M34,48 C42,54 48,54 50,60 L46,66 C40,62 36,56 34,48 Z" fill={color} />
          <path d="M66,48 C58,54 52,54 50,60 L54,66 C60,62 64,56 66,48 Z" fill={color} />
          <line x1="50" y1="42" x2="50" y2="98" stroke={color} strokeWidth="1.5" />
          <path d="M42,70 L44,98 M58,70 L56,98" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'legs':
      return (
        <svg width="80" height="90" viewBox="0 0 100 110" style={{ opacity }}>
          <circle cx="50" cy="22" r="9" fill="none" stroke={color} strokeWidth="1.5" />
          <path d="M38,32 L62,32 L60,44 L40,44 Z" fill={color} fillOpacity={0.4} />
          <path d="M40,44 C40,44 38,70 37,98 L43,98 C43,98 45,72 46,60 C47,72 49,98 49,98 L44,44 Z" fill={color} />
          <path d="M60,44 C60,44 62,70 63,98 L57,98 C57,98 55,72 54,60 C53,72 51,98 51,98 L56,44 Z" fill={color} />
        </svg>
      );
    case 'shoulders':
      return (
        <svg width="80" height="90" viewBox="0 0 100 110" style={{ opacity }}>
          <circle cx="50" cy="26" r="10" fill="none" stroke={color} strokeWidth="1.5" />
          <path d="M30,38 C34,38 37,44 37,52 C37,58 34,62 30,60 C26,58 26,42 30,38 Z" fill={color} />
          <path d="M70,38 C66,38 63,44 63,52 C63,58 66,62 70,60 C74,58 74,42 70,38 Z" fill={color} />
          <path d="M40,38 L60,38 L58,80 L42,80 Z" fill={color} fillOpacity={0.3} />
          <path d="M42,80 L44,100 M58,80 L56,100" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'arms':
      return (
        <svg width="80" height="90" viewBox="0 0 100 110" style={{ opacity }}>
          <circle cx="50" cy="26" r="10" fill="none" stroke={color} strokeWidth="1.5" />
          <path d="M32,42 C36,38 40,40 38,54 C36,64 30,68 28,62 C26,56 28,46 32,42 Z" fill={color} />
          <path d="M68,42 C64,38 60,40 62,54 C64,64 70,68 72,62 C74,56 72,46 68,42 Z" fill={color} />
          <path d="M40,40 L60,40 L58,70 L42,70 Z" fill={color} fillOpacity={0.25} />
          <path d="M42,70 L42,100 M58,70 L58,100" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'core':
      return (
        <svg width="80" height="90" viewBox="0 0 100 110" style={{ opacity }}>
          <circle cx="50" cy="26" r="10" fill="none" stroke={color} strokeWidth="1.5" />
          <path d="M40,40 L60,40 L58,90 L42,90 Z" fill={color} fillOpacity={0.15} stroke={color} strokeWidth="1" />
          <rect x="43" y="48" width="6" height="8" rx="1.5" fill={color} />
          <rect x="51" y="48" width="6" height="8" rx="1.5" fill={color} />
          <rect x="43" y="60" width="6" height="8" rx="1.5" fill={color} />
          <rect x="51" y="60" width="6" height="8" rx="1.5" fill={color} />
          <rect x="43" y="72" width="6" height="8" rx="1.5" fill={color} />
          <rect x="51" y="72" width="6" height="8" rx="1.5" fill={color} />
        </svg>
      );
    case 'cardio':
      return (
        <svg width="80" height="90" viewBox="0 0 100 110" style={{ opacity }}>
          <circle cx="50" cy="22" r="9" fill="none" stroke={color} strokeWidth="1.5" />
          <path d="M50,32 L46,54 L38,70" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M50,32 L54,54 L62,70" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M46,42 L36,46" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M54,46 L66,42" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M20,88 L28,88 L32,80 L38,96 L42,84 L46,88 L80,88" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    default:
      return (
        <svg width="80" height="90" viewBox="0 0 100 110" style={{ opacity }}>
          <circle cx="50" cy="26" r="10" fill="none" stroke={color} strokeWidth="1.5" />
          <path d="M42,38 L58,38 L56,90 L44,90 Z" fill={color} fillOpacity={0.3} />
          <path d="M44,90 L44,105 M56,90 L56,105" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
}

// ─── Rappresentazione Grafica Difficoltà a 5 Pallini ──────────────────────────
function DifficultyDots({ level, color, label }: { level: number; color: string; label: string }) {
  const MAX = 5;
  const safeLevel = Math.max(1, Math.min(5, level));
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-[3px]">
        {Array.from({ length: MAX }).map((_, i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full"
            style={{
              background: i < safeLevel ? color : 'rgba(255,255,255,0.12)',
              boxShadow: i < safeLevel ? `0 0 4px ${color}` : 'none',
            }}
          />
        ))}
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</span>
    </div>
  );
}

// ─── Componente Principale ───────────────────────────────────────────────────
export function PlanCard({ plan, onDelete }: PlanCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toggleFavMut = useToggleFavorite();

  // Prendi configurazione in base al primo gruppo muscolare
  const cfg = getConfig(plan.muscles);
  const primaryMuscle = plan.muscles[0] ?? null;
  const durationMin = plan.estimatedMinutes;

  // La difficoltà ora è una proprietà reale della scheda (sceglibile da DB)
  const difficultyLevel = plan.difficulty ?? 3;
  const difficultyLabel = getDifficultyLabel(difficultyLevel, t);

  const { translateX, isSwiping, swipeHandlers } = useSwipeAction({
    onSwipeLeft: () => onDelete(plan),
    onSwipeRight: () => toggleFavMut.mutate({ id: plan.id, isFavorite: !plan.is_favorite }),
  });

  const open = () => navigate(`/plans/${plan.id}`);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Swipe background actions */}
      <div className="absolute inset-0 flex justify-between rounded-2xl bg-bg-0 pointer-events-none">
        <div
          className="flex w-1/2 items-center justify-start px-5 text-amber-400 transition-opacity duration-150"
          style={{ opacity: translateX > 15 ? 1 : 0, background: 'rgba(251,191,36,0.08)' }}
        >
          <Star size={20} fill={translateX > 75 ? 'currentColor' : 'none'} style={{ transform: `scale(${Math.min(1.2, 0.6 + translateX / 100)})` }} />
        </div>
        <div
          className="flex w-1/2 items-center justify-end px-5 text-dangerRed transition-opacity duration-150"
          style={{ opacity: translateX < -15 ? 1 : 0, background: 'rgba(239,68,68,0.08)' }}
        >
          <Trash2 size={20} style={{ transform: `scale(${Math.min(1.2, 0.6 + Math.abs(translateX) / 100)})` }} />
        </div>
      </div>

      {/* Main Card */}
      <div
        {...swipeHandlers}
        className={`relative overflow-hidden rounded-2xl select-none ${isSwiping ? '' : 'transition-transform duration-200'}`}
        style={{
          transform: `translateX(${translateX}px)`,
          touchAction: 'pan-y',
          background: 'linear-gradient(135deg, #0d1526 0%, #0a1020 100%)',
          border: `1px solid rgba(255,255,255,0.06)`,
          borderLeft: `3px solid ${cfg.border}`,
          boxShadow: `0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
        }}
      >
        {/* radial glow of the card */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 60% at 85% 50%, ${cfg.glow} 0%, transparent 80%)`,
          }}
        />

        {/* Content grid */}
        <div className="relative flex items-stretch">
          {/* Left Side: Information */}
          <button onClick={open} className="flex-1 min-w-0 p-4 text-left flex flex-col justify-between">
            <div>
              {/* Title & Favorite */}
              <div className="flex items-center gap-2 mb-2">
                <p className="truncate text-base font-extrabold text-slate-100">{plan.name}</p>
                {plan.is_favorite && <Star size={13} fill="#fbbf24" className="text-amber-400 flex-none" />}
              </div>

              {/* All muscle groups pills present in the workout plan */}
              {plan.muscles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {plan.muscles.map((m) => {
                    const mCfg = GROUP_CONFIG[m] || FALLBACK;
                    return (
                      <span
                        key={m}
                        className="inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          background: mCfg.bg,
                          border: `1px solid ${mCfg.border}44`,
                          color: mCfg.border,
                        }}
                      >
                        {t(mCfg.labelKey)}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Timer and difficulty under the name of the plan */}
            <div className="flex flex-col gap-2.5 mt-1">
              {/* Timer & Exercises count */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <Clock size={13} className="text-slate-400 flex-shrink-0" />
                  {/* Keep showing in minutes even if > 60 */}
                  <span>{durationMin} min</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <RotateCcw size={13} className="text-slate-400 flex-shrink-0" />
                  <span>{plan.exerciseCount} {plan.exerciseCount === 1 ? t('plans.exercise') : t('plans.exercises_plural')}</span>
                </div>
              </div>

              {/* Difficulty dots */}
              <DifficultyDots level={difficultyLevel} color={cfg.dot} label={difficultyLabel} />
            </div>
          </button>

          {/* Right Side: open arrow and muscle illustration */}
          <div className="relative w-28 flex flex-col justify-between items-end pr-3 py-2 flex-shrink-0 overflow-hidden">
            {/* Top action header */}
            <div className="flex items-center gap-1 relative z-10">
              <button
                onClick={open}
                aria-label={t('plans.openPlanLabel')}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-white transition active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${cfg.border}33, ${cfg.border}22)`,
                  border: `1px solid ${cfg.border}55`,
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Muscle decoration SVG */}
            <div className="pointer-events-none -mb-2 -mr-2 select-none z-0">
              <PlanMuscleSVG group={primaryMuscle} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
