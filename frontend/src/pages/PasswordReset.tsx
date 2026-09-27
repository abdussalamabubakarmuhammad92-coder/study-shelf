import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';

export default function PasswordReset() {
  const { token = '' } = useParams();
  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/auth/password-reset/validate/', { params: { token } })
      .then((r) => { setValid(r.data.valid); setUsername(r.data.username || ''); })
      .catch(() => setValid(false))
      .finally(() => setValidating(false));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/password-reset/confirm/', { token, password });
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Reset failed. The link may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="card animate-slide-up p-8">
        {validating ? (
          <div className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-800" />
        ) : done ? (
          <>
            <p className="badge mb-3 bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              <CheckCircle2 size={12} /> Password updated
            </p>
            <h1 className="text-2xl font-bold tracking-tight">All set!</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Your new password is active. Log in with it as usual.
            </p>
            <Link to="/login" className="btn-primary mt-6 w-full">Go to login</Link>
          </>
        ) : valid ? (
          <>
            <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Choosing a new password for <span className="font-semibold">{username}</span>.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="label">New password</label>
                <input type="password" className="input" placeholder="At least 8 characters"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  minLength={8} required />
              </div>
              <div>
                <label className="label">Confirm new password</label>
                <input type="password" className="input" placeholder="Repeat it"
                  value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  minLength={8} required />
              </div>
              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-300">
                  {error}
                </p>
              )}
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="badge mb-3 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
              <XCircle size={12} /> Invalid reset link
            </p>
            <h1 className="text-2xl font-bold tracking-tight">This reset link is not usable</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              It may have expired (links last 24 hours), already been used, or been
              superseded by a newer one. Ask your portal admin for a fresh link.
            </p>
            <Link to="/" className="btn-secondary mt-6">Back to home</Link>
          </>
        )}
      </div>
    </div>
  );
}
