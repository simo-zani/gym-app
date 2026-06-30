import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className = '', id, ...rest },
  ref,
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`rounded-xl border border-bg-3 bg-bg-1 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-blueSoft focus:ring-2 focus:ring-blueGlow/30 ${className}`}
        {...rest}
      />
      {error && <span className="text-xs text-dangerRed">{error}</span>}
    </div>
  );
});
