import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { BarChart3, Clock, Layers, Dumbbell, ChevronRight } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { db, type SessionRow, type SessionSetRow } from '@/lib/db';
import { formatTime } from '@/features/workout/useCountdown';
import { HistoryStats } from '@/features/history/HistoryStats';
import type { MuscleGroup } from '@/types/db';

// Subjective rating (1..5) → emoji, matching the summary screen.
const RATING_EMOJI: Record<number, string> = { 1: '😫', 2: '🙁', 3: '😐', 4: '🙂', 5: '😄' };

interface SessionView {
  session: SessionRow;
  sets: SessionSetRow[];
  durationMin: number;
  setCount: number;
  exerciseCount: number;
  volumeKg: number;
}

function buildViews(sessions: SessionRow[], sets: SessionSetRow[]): SessionView[] {
  const setsBySession = new Map<string, SessionSetRow[]>();
  for (const s of sets) {
    const arr = setsBySession.get(s.session_id) ?? [];
    arr.push(s);
    setsBySession.set(s.session_id, arr);
  }

  return sessions
    // Only finished workouts (an abandoned session with no ending is noise).
    .filter((s) => s.ended_at)
    .sort((a, b) => b.started_at.localeCompare(a.started_at))
    .map((session) => {
      const mySets = setsBySession.get(session.id) ?? [];
      const durationMs = session.ended_at
        ? new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()
        : 0;
      const volumeKg = mySets.reduce(
        (sum, st) => sum + (st.weight_kg ?? 0) * (st.reps_done ?? 0),
        0,
      );
      return {
        session,
        sets: mySets,
        durationMin: Math.max(0, Math.round(durationMs / 60000)),
        setCount: mySets.length,
        exerciseCount: new Set(mySets.map((st) => st.exercise_name_snapshot)).size,
        volumeKg: Math.round(volumeKg),
      };
    });
}

export function HistoryPage() {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState<SessionView | null>(null);

  const data = useLiveQuery(async () => {
    const [sessions, sets, exercises] = await Promise.all([
      db.workout_sessions.toArray(),
      db.workout_session_sets.toArray(),
      db.exercises.toArray(),
    ]);
    const exerciseMuscle = new Map<string, MuscleGroup | null>(
      exercises.map((e) => [e.id, e.muscle_group]),
    );
    return { views: buildViews(sessions, sets), exerciseMuscle };
  }, []);

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [i18n.language],
  );

  return (
    <AppShell>
      <div className="relative z-[20] mb-4 border-b border-bg-2 pb-4">
        <h1 className="text-xl font-extrabold text-slate-100">{t('history.title')}</h1>
      </div>

      {data === undefined ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : data.views.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title={t('history.emptyState')}
          description={t('history.emptyStateHint')}
        />
      ) : (
        <>
          <HistoryStats views={data.views} exerciseMuscle={data.exerciseMuscle} />
          <div className="flex flex-col gap-3">
          {data.views.map((v) => (
            <button
              key={v.session.id}
              onClick={() => setSelected(v)}
              className="rounded-2xl border border-bg-2 bg-bg-1 p-4 text-left transition active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-slate-100">
                    {v.session.plan_name_snapshot ?? '—'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {dateFmt.format(new Date(v.session.started_at))}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {v.session.rating != null && (
                    <span className="text-lg leading-none">{RATING_EMOJI[v.session.rating]}</span>
                  )}
                  <ChevronRight size={18} className="text-slate-600" />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Clock size={14} className="text-blueSoft" />
                  {v.durationMin} {t('history.minutesAbbr')}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Layers size={14} className="text-successGreen" />
                  {v.setCount} {t('history.sets')}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Dumbbell size={14} className="text-blueSoft" />
                  {v.exerciseCount} {t('history.exercises')}
                </span>
                {v.volumeKg > 0 && (
                  <span className="ml-auto font-semibold tabular-nums text-slate-300">
                    {v.volumeKg} kg
                  </span>
                )}
              </div>
            </button>
          ))}
          </div>
        </>
      )}

      <SessionDetailModal
        view={selected}
        onClose={() => setSelected(null)}
        dateLabel={selected ? dateFmt.format(new Date(selected.session.started_at)) : ''}
      />
    </AppShell>
  );
}

function SessionDetailModal({
  view,
  onClose,
  dateLabel,
}: {
  view: SessionView | null;
  onClose: () => void;
  dateLabel: string;
}) {
  const { t } = useTranslation();

  // Group sets by exercise, preserving first-seen order.
  const groups = useMemo(() => {
    if (!view) return [];
    const map = new Map<string, SessionSetRow[]>();
    for (const s of [...view.sets].sort((a, b) => a.set_number - b.set_number)) {
      const arr = map.get(s.exercise_name_snapshot) ?? [];
      arr.push(s);
      map.set(s.exercise_name_snapshot, arr);
    }
    return Array.from(map.entries());
  }, [view]);

  return (
    <Modal open={view !== null} onClose={onClose} title={t('history.detailTitle')}>
      {view && (
        <>
          <div className="mb-4">
            <p className="text-base font-bold text-slate-100">
              {view.session.plan_name_snapshot ?? '—'}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{dateLabel}</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <MiniStat value={`${view.durationMin}`} unit={t('history.minutesAbbr')} label={t('history.duration')} />
              <MiniStat value={`${view.setCount}`} label={t('history.sets')} />
              <MiniStat value={`${view.volumeKg}`} unit="kg" label={t('history.volume')} />
            </div>
          </div>

          {groups.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">{t('history.noSets')}</p>
          ) : (
            <div className="space-y-3">
              {groups.map(([name, sets]) => (
                <div key={name} className="rounded-xl border border-bg-3/60 bg-bg-0/40 p-3">
                  <p className="mb-2 text-sm font-semibold text-slate-200">{name}</p>
                  <div className="space-y-1.5">
                    {sets.map((s) => {
                      let detail: string;
                      if (s.reps_done != null) detail = `${s.reps_done} ${t('workout.repsShort')}`;
                      else if (s.duration_seconds_done != null) detail = formatTime(s.duration_seconds_done);
                      else detail = '—';
                      if (s.weight_kg != null) detail += ` · ${s.weight_kg} kg`;

                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-lg bg-bg-1/60 px-3 py-2 text-xs"
                        >
                          <span className="font-medium text-slate-400">
                            {t('workout.setNumber', { n: s.set_number })}
                          </span>
                          <span className="font-semibold tabular-nums text-slate-200">{detail}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {view.session.notes && (
            <div className="mt-4 rounded-xl border border-bg-3/60 bg-bg-0/40 p-3">
              <p className="text-xs leading-relaxed text-slate-300">{view.session.notes}</p>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

function MiniStat({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl bg-bg-2 px-2 py-2.5">
      <div className="flex items-baseline gap-0.5">
        <span className="text-lg font-black tabular-nums text-slate-100">{value}</span>
        {unit && <span className="text-xs text-slate-400">{unit}</span>}
      </div>
      <span className="text-center text-[10px] uppercase tracking-wide text-slate-500">{label}</span>
    </div>
  );
}
