import { Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>();

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;

  const onSubmit = async (values: FormValues) => {
    setError('');
    try {
      const me = await login(values.username, values.password);
      navigate(me.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="card animate-slide-up p-8">
        <h1 className="text-2xl font-bold tracking-tight">Contributor login</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          For uploaders and administrators. Students can browse and download without an account.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="label">Username</label>
            <input className="input" placeholder="admin or contributor" {...register('username')} />
            {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>}
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" placeholder="••••••••" {...register('password')} />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 rounded-xl bg-primary-50 p-4 text-xs leading-relaxed text-primary-800 dark:bg-primary-950/60 dark:text-primary-200">
          <p className="font-semibold">Demo accounts (seeded)</p>
          <p>Admin — admin / admin123</p>
          <p>Contributor — contributor / contributor123</p>
          <p className="mt-2">Forgot your password? Contact your portal admin — they can send you a reset link.</p>
        </div>
      </div>
    </div>
  );
}
