import { FileText, Pencil, Star, Trash2, TrendingUp, UploadCloud } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { Resource } from '../lib/types';
import { FileTypeBadge, timeAgo } from '../components/ResourceCard';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [uploads, setUploads] = useState<Resource[]>([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Resource | null>(null);
  const [form, setForm] = useState({ title: '', course_code: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(() => {
    api.get<Resource[]>('/me/uploads/')
      .then((r) => setUploads(r.data))
      .catch(() => setError('Could not load your uploads. Try refreshing.'));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!loading && !user) return <Navigate to="/login" replace />;
  if (!loading && user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (loading) return <div className="card h-64 animate-pulse bg-gray-100 dark:bg-slate-800" />;

  const totals = {
    uploads: uploads.length,
    downloads: uploads.reduce((n, r) => n + r.download_count, 0),
    upvotes: uploads.reduce((n, r) => n + r.rating_count, 0),
  };

  const openEdit = (r: Resource) => {
    setEditing(r);
    setForm({ title: r.title, course_code: r.course_code, description: r.description });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError('');
    try {
      await api.patch(`/resources/${editing.id}/`, form);
      setEditing(null);
      load();
    } catch {
      setError('Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: Resource) => {
    if (!window.confirm(`Delete "${r.title}" permanently? Students will no longer see it.`)) return;
    setDeleting(r.id);
    setError('');
    try {
      await api.delete(`/resources/${r.id}/`);
      setUploads((list) => list.filter((x) => x.id !== r.id));
    } catch {
      setError('Could not delete the resource.');
    } finally {
      setDeleting(null);
    }
  };

  const statCards = [
    { label: 'Your uploads', value: totals.uploads, icon: FileText, color: 'text-primary-600 bg-primary-50 dark:bg-primary-950' },
    { label: 'Downloads earned', value: totals.downloads, icon: TrendingUp, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950' },
    { label: 'Upvotes earned', value: totals.upvotes, icon: Star, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contributor dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Welcome back, {user?.full_name || user?.username}. Here's the impact of your materials.
          </p>
        </div>
        <Link to="/upload" className="btn-primary">
          <UploadCloud size={16} /> Upload new
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((c) => (
          <div key={c.label} className="card animate-slide-up flex items-center gap-4 p-5">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.color}`}>
              <c.icon size={20} />
            </span>
            <div>
              <p className="text-2xl font-extrabold">{c.value.toLocaleString()}</p>
              <p className="text-xs font-medium text-slate-400">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="card divide-y divide-gray-100 dark:divide-slate-800">
        <h2 className="p-4 pb-3 font-bold">My uploads</h2>
        {uploads.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <UploadCloud size={36} className="text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              You haven't uploaded anything yet — your first contribution is one click away.
            </p>
            <Link to="/upload" className="btn-secondary">Upload your first resource</Link>
          </div>
        ) : (
          uploads.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 p-4">
              <FileTypeBadge type={r.file_type} />
              <div className="min-w-0 flex-1">
                <Link to={`/resource/${r.id}`}
                  className="block truncate text-sm font-semibold hover:text-primary-600 dark:hover:text-primary-400">
                  {r.title}
                </Link>
                <p className="truncate text-xs text-slate-400">
                  {r.course_code && <>{r.course_code} · </>}{r.department_name}
                  {' · '}{r.download_count} downloads · ★ {r.rating_count}
                </p>
              </div>
              <span className="text-xs text-slate-400">{timeAgo(r.upload_date)}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(r)} title="Edit details"
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-950">
                  <Pencil size={15} />
                </button>
                <button onClick={() => remove(r)} disabled={deleting === r.id} title="Delete"
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setEditing(null)}>
          <form onSubmit={saveEdit} onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-lg space-y-4 p-6">
            <h3 className="text-lg font-bold">Edit resource details</h3>
            <div>
              <label className="label">Title</label>
              <input className="input" value={form.title} maxLength={200}
                onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="label">Course code</label>
              <input className="input" value={form.course_code} maxLength={20}
                onChange={(e) => setForm({ ...form, course_code: e.target.value })} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input min-h-24 resize-y" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
