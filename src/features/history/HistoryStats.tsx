import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarClock, Flame, Dumbbell } from 'lucide-react';
import type { MuscleGroup } from '@/types/db';
import type { SessionRow, SessionSetRow } from '@/lib/db';
import { muscleGroupBadgeClass, muscleGroupLabelKey } from '@/features/exercises/muscleGroups';

export interface HistorySessionLite {
  session: SessionRow;
  sets: SessionSetRow[];
}

const DAY_MS = 86_400_000;
const HEATMAP_WEEKS = 53; // ≈ 1 year → can show parts of two calendar years

// Pixel model — MUST match the Tailwind classes used for cells/margins:
// cell = w-3/h-3 (12px), week gap = ml-1 (4px), month gap = ml-2 (8px).
const CELL = 12;
const WEEK_GAP = 4;
const MONTH_GAP = 8;
const YEAR_LABEL_W = 30; // approx width of a "2026" label, for push math

/** Local YYYY-MM-DD key (not UTC, so days line up with the user's calendar). */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

interface HeatCell {
  key: string;
  date: Date;
  trained: boolean;
  future: boolean;
}
interface HeatColumn {
  firstDate: Date;
  newMonth: boolean;
  left: number; // px offset of the column's left edge within the content
  cells: HeatCell[];
}
interface YearMarker {
  year: number;
  left: number; // natural left of this year's first visible column
  nextLeft: number | null; // natural left of the following year (for push math)
}

export function HistoryStats({
  views,
  exerciseMuscle,
}: {
  views: HistorySessionLite[];
  exerciseMuscle: Map<string, MuscleGroup | null>;
}) {
  const { t, i18n } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const yearRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null);

  const monthFmt = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { month: 'short' }),
    [i18n.language],
  );
  const dayFmt = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { weekday: 'short', day: '2-digit', month: 'long' }),
    [i18n.language],
  );

  const { daysSince, total, last30, topMuscle, columns, contentWidth, yearMarkers } = useMemo(() => {
    const today = startOfDay(new Date());

    const trainedDays = new Set<string>();
    let lastMs = -Infinity;
    for (const { session } of views) {
      const d = new Date(session.started_at);
      trainedDays.add(dayKey(d));
      lastMs = Math.max(lastMs, d.getTime());
    }

    const daysSince =
      lastMs === -Infinity
        ? null
        : Math.max(0, Math.round((today.getTime() - startOfDay(new Date(lastMs)).getTime()) / DAY_MS));

    const cutoff = today.getTime() - 29 * DAY_MS;
    const last30 = views.filter((v) => new Date(v.session.started_at).getTime() >= cutoff).length;

    const muscleCount = new Map<MuscleGroup, number>();
    for (const { sets } of views) {
      for (const s of sets) {
        const m = exerciseMuscle.get(s.exercise_id);
        if (!m) continue;
        muscleCount.set(m, (muscleCount.get(m) ?? 0) + 1);
      }
    }
    let topMuscle: MuscleGroup | null = null;
    let topN = 0;
    for (const [m, n] of muscleCount) {
      if (n > topN) {
        topN = n;
        topMuscle = m;
      }
    }

    // Build the grid (Monday-first), accumulating each column's px offset so the
    // month/year labels can be positioned to match exactly.
    const dowMon = (today.getDay() + 6) % 7;
    const startMs = today.getTime() - dowMon * DAY_MS - (HEATMAP_WEEKS - 1) * 7 * DAY_MS;
    const columns: HeatColumn[] = [];
    const yearMarkers: YearMarker[] = [];
    let prevMonth = -1;
    let prevYear = -1;
    let x = 0;
    for (let w = 0; w < HEATMAP_WEEKS; w++) {
      const cells: HeatCell[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startMs + (w * 7 + d) * DAY_MS);
        const key = dayKey(date);
        cells.push({ key, date, trained: trainedDays.has(key), future: date.getTime() > today.getTime() });
      }
      const first = cells[0].date;
      const month = first.getMonth();
      const newMonth = month !== prevMonth;
      if (w > 0) x += newMonth ? MONTH_GAP : WEEK_GAP;
      columns.push({ firstDate: first, newMonth, left: x, cells });

      const year = first.getFullYear();
      if (year !== prevYear) {
        yearMarkers.push({ year, left: x, nextLeft: null });
        prevYear = year;
      }
      x += CELL;
      prevMonth = month;
    }
    const contentWidth = x;
    for (let i = 0; i < yearMarkers.length - 1; i++) {
      yearMarkers[i].nextLeft = yearMarkers[i + 1].left;
    }

    return { daysSince, total: views.length, last30, topMuscle, columns, contentWidth, yearMarkers };
  }, [views, exerciseMuscle]);

  // Position the year labels: each sticks to the left edge of the scroll viewport
  // while its year is showing, and gets pushed out by the next year's label.
  const updateYearLabels = useCallback(() => {
    const s = scrollRef.current?.scrollLeft ?? 0;
    for (let i = 0; i < yearMarkers.length; i++) {
      const el = yearRefs.current[i];
      const m = yearMarkers[i];
      if (!el) continue;
      let p = Math.max(m.left, s);
      if (m.nextLeft != null) p = Math.min(p, m.nextLeft - YEAR_LABEL_W);
      p = Math.max(p, m.left);
      el.style.left = `${p}px`;
    }
  }, [yearMarkers]);

  // Start scrolled to the most recent week, then place the year labels.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
    updateYearLabels();
  }, [columns, updateYearLabels]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (tooltip) setTooltip(null);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateYearLabels);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [updateYearLabels, tooltip]);

  // Dismiss the tooltip when tapping outside the card.
  useEffect(() => {
    if (!tooltip) return;
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) setTooltip(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [tooltip]);

  function handleCellClick(e: React.MouseEvent, cell: HeatCell) {
    e.stopPropagation();
    if (cell.future) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const label = dayFmt.format(cell.date);
    setTooltip((prev) =>
      prev && prev.label === label
        ? null
        : { x: rect.left - cardRect.left + rect.width / 2, y: rect.top - cardRect.top, label },
    );
  }

  const lastLabel =
    daysSince === null
      ? t('history.neverTrained')
      : daysSince === 0
        ? t('history.today')
        : daysSince === 1
          ? t('history.yesterday')
          : t('history.daysAgo', { count: daysSince });

  const colMargin = (w: number, newMonth: boolean) =>
    w === 0 ? '' : newMonth ? 'ml-2' : 'ml-1';

  return (
    <div className="mb-5 space-y-3">
      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatTile
          icon={<CalendarClock size={16} className="text-blueSoft" />}
          value={lastLabel}
          label={t('history.lastWorkout')}
        />
        <StatTile
          icon={<Flame size={16} className="text-amber-400" />}
          value={`${last30}`}
          label={t('history.last30')}
        />
        <StatTile
          icon={<Dumbbell size={16} className="text-successGreen" />}
          value={
            topMuscle ? (
              <span className={`rounded-md px-2 py-0.5 text-sm font-bold ${muscleGroupBadgeClass(topMuscle)}`}>
                {t(muscleGroupLabelKey(topMuscle))}
              </span>
            ) : (
              t('history.noData')
            )
          }
          label={t('history.topMuscle')}
        />
      </div>

      {/* GitHub-style activity heatmap */}
      <div ref={cardRef} className="relative rounded-2xl border border-bg-2 bg-bg-1 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {t('history.activity')}
          </span>
          <span className="text-[11px] font-semibold tabular-nums text-slate-500">
            {total} {t('history.workoutsUnit')}
          </span>
        </div>

        <div ref={scrollRef} className="no-scrollbar overflow-x-auto">
          <div className="inline-block" style={{ width: contentWidth }}>
            {/* Month labels */}
            <div className="mb-1 flex">
              {columns.map((c, w) => (
                <div key={w} className={`relative h-3 w-3 ${colMargin(w, c.newMonth)}`}>
                  {c.newMonth && (
                    <span className="absolute left-0 top-0 whitespace-nowrap text-[10px] leading-none text-slate-500">
                      {monthFmt.format(c.firstDate).slice(0, 3)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="flex">
              {columns.map((c, w) => (
                <div key={w} className={`flex flex-col gap-1 ${colMargin(w, c.newMonth)}`}>
                  {c.cells.map((cell) => (
                    <button
                      key={cell.key}
                      type="button"
                      onClick={(e) => handleCellClick(e, cell)}
                      aria-label={cell.future ? undefined : dayFmt.format(cell.date)}
                      className={`h-3 w-3 rounded-[3px] transition-colors ${
                        cell.future
                          ? 'pointer-events-none opacity-0'
                          : cell.trained
                            ? 'bg-successGreen'
                            : 'bg-bg-2'
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Year labels (dynamic: stick left, pushed out by the next year) */}
            <div className="relative mt-1.5 h-3">
              {yearMarkers.map((m, i) => (
                <span
                  key={m.year}
                  ref={(el) => {
                    yearRefs.current[i] = el;
                  }}
                  className="absolute top-0 whitespace-nowrap text-[11px] font-semibold leading-none text-slate-400"
                  style={{ left: m.left }}
                >
                  {m.year}
                </span>
              ))}
            </div>
          </div>
        </div>

        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-bg-3 px-2 py-1 text-[11px] font-semibold text-slate-100 shadow-lg ring-1 ring-black/20"
            style={{ left: tooltip.x, top: tooltip.y - 6 }}
          >
            {tooltip.label}
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-bg-2 bg-bg-1 px-3 py-3">
      {icon}
      <div className="text-sm font-black leading-tight text-slate-100">{value}</div>
      <span className="text-[10px] uppercase leading-tight tracking-wide text-slate-500">{label}</span>
    </div>
  );
}
