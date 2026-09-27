import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';

export default function InviteRegister() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', full_name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get(`/invites/validate/?token=${encodeURIComponent(token)}`)
      .then(() => setValid(true))
      .catch(() => setValid(false))
      .finally(() => setValidating(false));
  }, [token]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/auth/register/', { ...form, token });
      navigate('/upload', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="card animate-slide-up p-8">
        {validating ? (
          <div className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-800" />
        ) : valid ? (
          <>
            <p className="badge mb-3 bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              <CheckCircle2 size={12} /> Valid invite
            </p>
            <h1 className="text-2xl font-bold tracking-tight">Create your contributor account</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              This invite link was shared with you by the portal administrator.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="label">Full name</label>
                <input className="input" placeholder="Ada Lovelace" value={form.full_name} onChange={set('full_name')} required />
              </div>
              <div>
                <label className="label">Username</label>
                <input className="input" placeholder="ada.lovelace" value={form.username} onChange={set('username')} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="you@university.edu" value={form.email} onChange={set('email')} required />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" className="input" placeholder="At least 8 characters" value={form.password} onChange={set('password')} minLength={8} required />
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-300">
                  {error}
                </p>
              )}

              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? 'Creating account…' : 'Create account & start uploading'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="badge mb-3 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
              <XCircle size={12} /> Invalid invite
            </p>
            <h1 className="text-2xl font-bold tracking-tight">This invite link is not usable</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              It may have expired, already been used, or been revoked by the administrator.
              Contact your portal admin to receive a fresh link.
            </p>
            <Link to="/" className="btn-secondary mt-6">Back to home</Link>
          </>
        )}
      </div>
    </div>
  );
}
