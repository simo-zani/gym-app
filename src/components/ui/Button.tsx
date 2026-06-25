import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'danger' | 'success';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-blueGlow hover:bg-blueSoft text-white shadow-lg shadow-blueGlow/20 disabled:bg-bg-3',
  ghost: 'bg-bg-2 hover:bg-bg-3 text-slate-100',
  danger: 'bg-dangerRed/90 hover:bg-dangerRed text-white',
  success:
    'bg-successGreen hover:bg-emerald-400 text-white shadow-lg shadow-successGreen/20 disabled:bg-bg-3',
};

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {loading ? 'Attendi…' : children}
    </button>
  );
}
