import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Database, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { useAccount, errorMessage } from '../lib/account';

type Mode = 'signin' | 'signup';

const signInSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});
const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(1, 'Enter your name'),
  password: z.string().min(8, 'Use at least 8 characters'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { path: ['confirm'], message: 'Passwords do not match' });

export default function AuthPage() {
  const { account, login, register } = useAccount();
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(location.pathname === '/signup' ? 'signup' : 'signin');
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: string } | null)?.from || '/dashboard';
  if (account) return <Navigate to={from} replace />;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const switchMode = (m: Mode) => { setMode(m); setErrors({}); setServerError(''); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    const parsed = (mode === 'signup' ? signUpSchema : signInSchema).safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach(i => { errs[String(i.path[0])] ??= i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      if (mode === 'signup') await register(form.fullName, form.email, form.password);
      else await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute top-[10%] left-[15%] w-[420px] h-[420px] rounded-full bg-primary/[0.07] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[5%] right-[10%] w-[420px] h-[420px] rounded-full bg-accent/[0.08] blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-md"
      >
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Database className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">AROVIA-AI ERP</span>
        </Link>

        <div className="glass rounded-2xl p-7 sm:p-8 shadow-2xl">
          <div className="grid grid-cols-2 rounded-lg bg-muted/60 p-1 mb-7">
            {(['signin', 'signup'] as Mode[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`rounded-md py-2 text-sm font-medium transition-all ${
                  mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            {mode === 'signin' ? 'Sign in to access your ERP workspace.' : 'Start asking your ERP data questions in seconds.'}
          </p>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {mode === 'signup' && (
              <Field id="fullName" label="Full name" icon={User} error={errors.fullName}>
                <Input id="fullName" value={form.fullName} onChange={set('fullName')} placeholder="Rahim Uddin" className="pl-9" autoComplete="name" />
              </Field>
            )}
            <Field id="email" label="Email address" icon={Mail} error={errors.email}>
              <Input id="email" type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" className="pl-9" autoComplete="email" />
            </Field>
            <Field id="password" label="Password" icon={Lock} error={errors.password}>
              <Input
                id="password"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                className="pl-9 pr-10"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </Field>
            {mode === 'signup' && (
              <Field id="confirm" label="Confirm password" icon={Lock} error={errors.confirm}>
                <Input id="confirm" type={showPw ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" className="pl-9" autoComplete="new-password" />
              </Field>
            )}

            {serverError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <Button type="submit" disabled={busy} className="w-full h-11 font-semibold glow-cyan">
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} className="font-medium text-primary hover:underline">
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ id, label, icon: Icon, error, children }: {
  id: string; label: string; icon: React.ElementType; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        {children}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
