import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dumbbell, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const createSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t('auth.validationEmailInvalid')),
    password: z.string().min(6, t('auth.validationMinChars')),
  });

type FormValues = {
  email: string;
  password: string;
};

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = createSchema(t);

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
      setServerError(err instanceof Error ? err.message : t('common.unexpectedError'));
    }
  });

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-12">
      {/* Language selector */}
      <div className="absolute right-6 top-6 flex items-center gap-2">
        <Globe size={16} className="text-slate-500" />
        <Select
          value={i18n.language}
          onChange={handleLanguageChange}
          className="text-sm"
        >
          <option value="it">{t('profile.italian')}</option>
          <option value="en">{t('profile.english')}</option>
        </Select>
      </div>
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blueGlow/15 text-blueSoft">
          <Dumbbell size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-100">{t('auth.appTitle')}</h1>
        <p className="text-sm text-slate-400">
          {mode === 'signin' ? t('auth.loginPrompt') : t('auth.signupPrompt')}
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          id="email"
          type="email"
          label={t('auth.email')}
          placeholder={t('auth.emailPlaceholder')}
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          id="password"
          type="password"
          label={t('auth.password')}
          placeholder={t('auth.passwordPlaceholder')}
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
          {mode === 'signin' ? t('auth.login') : t('auth.signup')}
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
        {mode === 'signin' ? t('auth.noAccount') : t('auth.hasAccount')}
      </button>
    </div>
  );
}
