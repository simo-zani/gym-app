import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dumbbell } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Minimo 6 caratteri'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setServerError(null);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Errore imprevisto');
    }
  });

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blueGlow/15 text-blueSoft">
          <Dumbbell size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-100">GymApp</h1>
        <p className="text-sm text-slate-400">
          {mode === 'signin' ? 'Accedi al tuo account' : 'Crea un nuovo account'}
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="tu@esempio.it"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          id="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          error={errors.password?.message}
          {...register('password')}
        />

        {serverError && (
          <p className="rounded-lg bg-dangerRed/10 px-3 py-2 text-sm text-dangerRed">
            {serverError}
          </p>
        )}

        <Button type="submit" loading={isSubmitting} className="mt-2">
          {mode === 'signin' ? 'Accedi' : 'Registrati'}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setServerError(null);
          setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
        }}
        className="mt-6 text-center text-sm text-slate-400 transition hover:text-blueSoft"
      >
        {mode === 'signin'
          ? 'Non hai un account? Registrati'
          : 'Hai già un account? Accedi'}
      </button>
    </div>
  );
}
