import { Minus, Plus } from 'lucide-react';

interface NumberStepperProps {
  label?: string;
  value: number | null;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  // Suffix shown next to the value (e.g. "kg", "s", '"').
  suffix?: string;
  // Number of decimals to display (e.g. 2 for weight). Defaults to 0.
  decimals?: number;
  // Value shown when value is null (e.g. for optional weight).
  placeholder?: string;
}

/**
 * Touch-friendly ± stepper used for sets, reps, weight, rest.
 * Used inside the plan-exercise config bottom sheet.
 */
export function NumberStepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  suffix,
  decimals = 0,
  placeholder = '—',
}: NumberStepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const dec = () => onChange(clamp((value ?? min) - step));
  const inc = () => onChange(clamp((value ?? min) + step));

  const display = value === null ? placeholder : value.toFixed(decimals);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {label}
        </span>
      )}
      <div className="flex items-center justify-between rounded-xl border border-bg-3 bg-bg-2 px-3 py-2">
        <span className="text-base font-semibold tabular-nums text-slate-100">
          {display}
          {suffix && value !== null && (
            <span className="ml-1 text-xs font-medium text-slate-400">{suffix}</span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={dec}
            aria-label="Diminuisci"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-3 text-slate-100 transition active:scale-95 hover:bg-bg-3/70"
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            onClick={inc}
            aria-label="Aumenta"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-3 text-slate-100 transition active:scale-95 hover:bg-bg-3/70"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
