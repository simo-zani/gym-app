import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className = '', id, rows = 3, ...rest },
  ref,
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={`resize-none rounded-xl border border-bg-3 bg-bg-1 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-blueSoft focus:ring-2 focus:ring-blueGlow/30 ${className}`}
        {...rest}
      />
      {error && <span className="text-xs text-dangerRed">{error}</span>}
    </div>
  );
});
