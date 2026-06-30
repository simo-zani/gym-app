import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, Dumbbell, Cpu, Layers, Activity, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { MuscleGroupBadge } from '@/components/ui/MuscleGroupBadge';
import { muscleGroupLabelKey } from '@/features/exercises/muscleGroups';
import type { Exercise, MuscleGroup } from '@/types/db';

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  onClose: () => void;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
}

// Detailed High-Fidelity SVG Illustrations for Muscle Groups (iOS Workout Style)
function MuscleSilhouette({ group }: { group: MuscleGroup | null | undefined }) {
  const renderSVG = () => {
    switch (group) {
      case 'chest':
        return (
          // Chest: Busto maschile con pettorali definiti in rosso
          <svg width="100" height="100" viewBox="0 0 100 100" className="opacity-90">
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            {/* Body Silhouette */}
            <path d="M50,16 A5,5 0 0,0 50,26 A5,5 0 0,0 50,16 Z" fill="#475569" /> {/* Head */}
            <path d="M48,27 C44,27 34,29 32,32 C30,34 31,50 31,58 L35,58 L33,36 L43,36 L43,62 L40,62 L38,84 L47,84 L46,62 L50,62 Z" fill="#334155" /> {/* Left Half Silhouette */}
            <path d="M52,27 C56,27 66,29 68,32 C70,34 69,50 69,58 L65,58 L67,36 L57,36 L57,62 L60,62 L62,84 L53,84 L54,62 L50,62 Z" fill="#334155" /> {/* Right Half Silhouette */}
            {/* Abs Grid (Background context) */}
            <path d="M45,49 L55,49 M45,54 L55,54 M45,59 L55,59" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
            {/* Pectorals - Highlighted in Red */}
            <path d="M34,35 C38,34 45,34 49,36 L49,46 C44,46 37,45 34,40 Z" fill="#ef4444" className="drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
            <path d="M66,35 C62,35 55,34 51,36 L51,46 C56,46 63,45 66,40 Z" fill="#ef4444" className="drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
          </svg>
        );
      case 'back':
        return (
          // Back: Vista posteriore con lats in blu
          <svg width="100" height="100" viewBox="0 0 100 100" className="opacity-90">
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            {/* Back Silhouette */}
            <path d="M50,15 A5,5 0 0,0 50,25 A5,5 0 0,0 50,15 Z" fill="#475569" /> {/* Head */}
            <path d="M33,31 C31,34 32,50 32,58 L36,58 L34,37 L43,37 L42,84 L49,84 L49,60 L50,60 Z" fill="#334155" />
            <path d="M67,31 C69,34 68,50 68,58 L64,58 L66,37 L57,37 L58,84 L51,84 L51,60 L50,60 Z" fill="#334155" />
            <path d="M50,25 L50,80" stroke="#1e293b" strokeWidth="1.5" /> {/* Spine */}
            {/* Lats (Dorsali) - Highlighted in Blue */}
            <path d="M35,36 C42,42 48,42 49,52 L45,58 C40,54 36,46 35,36 Z" fill="#3b82f6" className="drop-shadow-[0_0_6px_rgba(59,130,246,0.7)]" />
            <path d="M65,36 C58,42 52,42 51,52 L55,58 C60,54 64,46 65,36 Z" fill="#3b82f6" className="drop-shadow-[0_0_6px_rgba(59,130,246,0.7)]" />
          </svg>
        );
      case 'legs':
        return (
          // Legs: Cosce anteriori definite in verde
          <svg width="100" height="100" viewBox="0 0 100 100" className="opacity-90">
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            {/* Hips & Legs Silhouette */}
            <path d="M38,20 L62,20 L62,35 L58,35 L58,30 L42,30 L42,35 L38,35 Z" fill="#334155" /> {/* Hips */}
            <path d="M42,30 L43,84 L37,84 L38,30 Z" fill="#1e293b" /> {/* Inner leg lines */}
            <path d="M58,30 L57,84 L63,84 L62,30 Z" fill="#1e293b" />
            {/* Quads (Quadricipiti) - Highlighted in Green */}
            <path d="M40,31 C43,31 47,38 47,56 C47,68 44,76 41,76 C39,76 39,46 40,31 Z" fill="#10b981" className="drop-shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
            <path d="M60,31 C57,31 53,38 53,56 C53,68 56,76 59,76 C61,76 61,46 60,31 Z" fill="#10b981" className="drop-shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
          </svg>
        );
      case 'shoulders':
        return (
          // Shoulders: Busto superiore con deltoidi arancioni
          <svg width="100" height="100" viewBox="0 0 100 100" className="opacity-90">
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            {/* Neck & Chest base */}
            <path d="M50,15 A5,5 0 0,0 50,25 A5,5 0 0,0 50,15 Z" fill="#475569" />
            <path d="M40,30 L60,30 L58,55 L42,55 Z" fill="#334155" />
            <path d="M42,30 L36,58 L32,58 L38,28 Z" fill="#1e293b" />
            <path d="M58,30 L64,58 L68,58 L62,28 Z" fill="#1e293b" />
            {/* Deltoids - Highlighted in Orange */}
            <path d="M32,28 C36,28 39,32 39,39 C39,45 35,50 32,48 C29,46 29,32 32,28 Z" fill="#f97316" className="drop-shadow-[0_0_6px_rgba(249,115,22,0.7)]" />
            <path d="M68,28 C64,28 61,32 61,39 C61,45 65,50 68,48 C71,46 71,32 68,28 Z" fill="#f97316" className="drop-shadow-[0_0_6px_rgba(249,115,22,0.7)]" />
          </svg>
        );
      case 'arms':
        return (
          // Arms: Braccia in posa con bicipiti viola
          <svg width="100" height="100" viewBox="0 0 100 100" className="opacity-90">
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            {/* Busto base */}
            <path d="M50,16 A5,5 0 0,0 50,26 A5,5 0 0,0 50,16 Z" fill="#475569" />
            <path d="M42,28 L58,28 L56,60 L44,60 Z" fill="#334155" />
            {/* Arms & Biceps - Highlighted in Purple */}
            <path d="M42,29 Q36,25 31,29 T30,46 Q37,42 41,35 Z" fill="#a855f7" className="drop-shadow-[0_0_6px_rgba(168,85,247,0.7)]" />
            <path d="M58,29 Q64,25 69,29 T70,46 Q63,42 59,35 Z" fill="#a855f7" className="drop-shadow-[0_0_6px_rgba(168,85,247,0.7)]" />
          </svg>
        );
      case 'core':
        return (
          // Core: Addominali definiti a griglia gialli
          <svg width="100" height="100" viewBox="0 0 100 100" className="opacity-90">
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            {/* Chest & Hips boundaries */}
            <path d="M34,22 L66,22 L62,35 L38,35 Z" fill="#334155" />
            <path d="M37,64 L63,64 L60,84 L40,84 Z" fill="#334155" />
            {/* Abs grid (6-pack) - Highlighted in Yellow */}
            <rect x="42" y="38" width="7" height="6" rx="1.5" fill="#eab308" className="drop-shadow-[0_0_4px_rgba(234,179,8,0.7)]" />
            <rect x="51" y="38" width="7" height="6" rx="1.5" fill="#eab308" className="drop-shadow-[0_0_4px_rgba(234,179,8,0.7)]" />
            <rect x="42" y="46" width="7" height="6" rx="1.5" fill="#eab308" className="drop-shadow-[0_0_4px_rgba(234,179,8,0.7)]" />
            <rect x="51" y="46" width="7" height="6" rx="1.5" fill="#eab308" className="drop-shadow-[0_0_4px_rgba(234,179,8,0.7)]" />
            <rect x="42" y="54" width="7" height="6" rx="1.5" fill="#eab308" className="drop-shadow-[0_0_4px_rgba(234,179,8,0.7)]" />
            <rect x="51" y="54" width="7" height="6" rx="1.5" fill="#eab308" className="drop-shadow-[0_0_4px_rgba(234,179,8,0.7)]" />
          </svg>
        );
      case 'cardio':
        return (
          // Cardio: Runner con battito cardiaco ECG e cuore rosso
          <svg width="100" height="100" viewBox="0 0 100 100" className="opacity-90">
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            {/* Heart */}
            <path d="M22,46 C22,43 25,41 27,43 C29,41 32,43 32,46 C32,50 27,53 27,53 C27,53 22,50 22,46 Z" fill="#ef4444" className="drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
            {/* ECG Pulse Line */}
            <path d="M12,48 L25,48 L27,42 L30,55 L33,45 L35,48 L46,48" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]" />
            {/* Runner Silhouette */}
            <circle cx="68" cy="28" r="4" fill="#cbd5e1" />
            <path d="M68,32 L64,48 L56,58 M64,48 L68,62 M68,32 L58,40 L52,48 M58,40 L64,42 L72,40" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        );
      default:
        return (
          // Fallback / Other: Silhouette busto generico grigia
          <svg width="100" height="100" viewBox="0 0 100 100" className="opacity-90">
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            <path d="M50,18 A6,6 0 0,0 50,30 A6,6 0 0,0 50,18 Z" fill="#475569" />
            <path d="M35,35 C35,35 40,32 50,32 C60,32 65,35 65,35 C67,37 66,65 66,75 L60,75 L62,40 L38,40 L40,75 L34,75 C34,65 33,37 35,35 Z" fill="#334155" />
          </svg>
        );
    }
  };

  return (
    <div className="relative flex h-48 items-center justify-center rounded-2xl border border-bg-2 bg-gradient-to-b from-bg-1 to-bg-0 shadow-inner overflow-hidden">
      {/* Decorative tech background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* Circle crop silhouette wrapper */}
      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-bg-1/80 border border-bg-2 shadow-lg">
        {renderSVG()}
      </div>

      {group === 'cardio' && (
        <div className="absolute inset-0 bg-pink-500/5 animate-pulse pointer-events-none" />
      )}
    </div>
  );
}

export function ExerciseDetailModal({
  exercise,
  onClose,
  onEdit,
  onDelete,
}: ExerciseDetailModalProps) {
  const { t, i18n } = useTranslation();
  if (!exercise) return null;

  const isCustom = exercise.owner_id !== null;
  const currentLang = i18n.language.split('-')[0]; // 'it' or 'en'
  const isIt = currentLang === 'it';

  // Determine localized description with active language fallback
  const descriptionText = isIt
    ? (exercise.description_it || exercise.description)
    : (exercise.description || exercise.description_it);

  const isNotTranslated = isIt && !exercise.description_it && exercise.description;

  // Equipment config mapping
  const equipmentKey = exercise.equipment || 'none';
  const isBodyweight = exercise.is_bodyweight || equipmentKey === 'none';

  return (
    <Modal open={Boolean(exercise)} onClose={onClose} title={exercise.name}>
      <div className="flex flex-col gap-4">
        {/* Muscle Graphic Header */}
        <div className="relative">
          <MuscleSilhouette group={exercise.muscle_group} />
          
          {/* Muscle label overlay (left corner) - translated */}
          <div className="absolute bottom-3 left-4 flex flex-col gap-0.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
              {t('exercises.targetArea')}
            </span>
            <span className="text-xs font-bold text-slate-200 uppercase">
              {t(muscleGroupLabelKey(exercise.muscle_group))}
            </span>
          </div>

          {/* Floated Edit Pencil button (bottom right corner) */}
          <button
            onClick={() => onEdit(exercise)}
            className="absolute bottom-3 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-blueGlow/20 text-blueSoft border border-blueSoft/30 shadow-md transition active:scale-95 hover:bg-blueGlow hover:text-white"
            aria-label={t('common.edit')}
          >
            <Pencil size={15} />
          </button>
        </div>

        {/* Quick Info Tags */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-bg-2 bg-bg-1 p-3.5">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {t('exercises.muscleGroup')}
            </span>
            <MuscleGroupBadge group={exercise.muscle_group} />
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {t('exercises.equipment')}
            </span>
            <div className="flex items-center gap-1.5 rounded-md bg-bg-2 px-2.5 py-1 text-xs font-semibold text-slate-200">
              {isBodyweight ? (
                <>
                  <Activity size={12} className="text-emerald-400" />
                  <span>{t('exercises.equipmentTypes.none')}</span>
                </>
              ) : (
                <>
                  {equipmentKey === 'dumbbell' && <Dumbbell size={12} className="text-amber-400" />}
                  {equipmentKey === 'barbell' && <Dumbbell size={12} className="text-blueSoft" />}
                  {equipmentKey === 'kettlebell' && <Dumbbell size={12} className="text-red-400" />}
                  {equipmentKey === 'cable' && <Layers size={12} className="text-purple-400" />}
                  {equipmentKey === 'machine' && <Cpu size={12} className="text-cyan-400" />}
                  <span>{t(`exercises.equipmentTypes.${equipmentKey}`)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {t('exercises.description')}
          </span>

          {isNotTranslated && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{t('exercises.notTranslated')}</span>
            </div>
          )}

          <div className="rounded-2xl border border-bg-2 bg-bg-1/50 px-4 py-3.5">
            {descriptionText ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
                {descriptionText}
              </p>
            ) : (
              <p className="text-sm italic text-slate-500">{t('exercises.noDescription')}</p>
            )}
          </div>
        </div>

        {/* Bottom actions: Only delete if custom */}
        {isCustom && (
          <div className="mt-1 flex justify-stretch">
            <Button variant="danger" onClick={() => onDelete(exercise)} className="w-full">
              <Trash2 size={16} /> {t('common.delete')}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}


