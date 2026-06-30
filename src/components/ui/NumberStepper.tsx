import { useState, useEffect } from 'react';
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
 * Allows both increments using buttons and direct manual numeric typing.
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

  // Local input state to manage typing smoothly without losing focus or weird decimals behavior
  const [inputValue, setInputValue] = useState<string>('');

  useEffect(() => {
    if (value === null) {
      setInputValue('');
    } else {
      // If active element is this input, don't overwrite user's typing
      if (document.activeElement?.getAttribute('data-stepper-label') !== label) {
        setInputValue(value.toFixed(decimals));
      }
    }
  }, [value, decimals, label]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleBlurOrEnter = () => {
    if (inputValue.trim() === '') {
      onChange(min);
      return;
    }
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      onChange(clamp(parsed));
    } else {
      setInputValue(value === null ? '' : value.toFixed(decimals));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlurOrEnter();
      (e.target as HTMLInputElement).blur();
    }
  };

  // Calculate dynamic width to keep the suffix immediately next to the number
  const textLength = inputValue.length || 1;
  const inputWidth = `${Math.max(3, textLength) * 9.5 + 8}px`;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <span className="text-xs font-bold uppercase tracking-wide text-slate-400 select-none">
          {label}
        </span>
      )}
      <div className="flex items-center justify-between rounded-xl border border-bg-3 bg-bg-2 px-3 py-1.5 focus-within:border-blueGlow/50 transition-colors">
        <div className="flex items-center gap-0.5 flex-1 min-w-0">
          <input
            type="number"
            data-stepper-label={label}
            inputMode={decimals > 0 ? 'decimal' : 'numeric'}
            step={step}
            min={min}
            max={max}
            value={inputValue}
            placeholder={placeholder}
            onChange={handleInputChange}
            onBlur={handleBlurOrEnter}
            onKeyDown={handleKeyDown}
            style={{ width: inputWidth }}
            className="bg-transparent text-base font-semibold tabular-nums text-slate-100 focus:outline-none placeholder-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {suffix && value !== null && (
            <span className="text-xs font-medium text-slate-400 select-none">{suffix}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={dec}
            aria-label="Diminuisci"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-3 text-slate-100 transition active:scale-90 hover:bg-bg-3/70"
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            onClick={inc}
            aria-label="Aumenta"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-3 text-slate-100 transition active:scale-90 hover:bg-bg-3/70"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
