import { BarChart3, Check, Copy, Download, FileText, KeyRound, Plus, Shield, Star, Trash2, UserX, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { AdminStats, Contributor, Faculty, Invite, Resource } from '../lib/types';
import { FileTypeBadge, formatBytes, timeAgo } from '../components/ResourceCard';

type Tab = 'stats' | 'invites' | 'contributors' | 'resources';

export default function Admin() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>('stats');

  if (!loading && user?.role !== 'admin') return <Navigate to="/login" replace />;
  if (loading) return <div className="card h-64 animate-pulse bg-gray-100 dark:bg-slate-800" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Shield size={22} className="text-primary-600" /> Admin dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Welcome, {user?.full_name || user?.username}. Manage invites, resources and portal stats.
          </p>
        </div>
        <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {(
            [
              ['stats', 'Stats'],
              ['invites', 'Invites'],
              ['contributors', 'Contributors'],
              ['resources', 'Resources'],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                tab === key
                  ? 'bg-primary-600 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'stats' && <StatsTab />}
      {tab === 'invites' && <InvitesTab />}
      {tab === 'contributors' && <ContributorsTab />}
      {tab === 'resources' && <ResourcesTab />}
    </div>
  );
}

/* ------------------------------------------------------------------ stats */

function StatsTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.get<AdminStats>('/admin/stats/').then((r) => setStats(r.data));
  }, []);

  if (!stats) return <div className="card h-64 animate-pulse bg-gray-100 dark:bg-slate-800" />;

  const cards = [
    { label: 'Resources', value: stats.total_resources, icon: FileText, color: 'text-primary-600 bg-primary-50 dark:bg-primary-950' },
    { label: 'Total downloads', value: stats.total_downloads, icon: Download, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950' },
    { label: 'Ratings given', value: stats.total_ratings, icon: Star, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950' },
    { label: 'Contributors', value: stats.total_contributors, icon: Users, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950' },
  ];

  const maxByFaculty = Math.max(...stats.by_faculty.map((f) => f.resource_count), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-bold"><BarChart3 size={17} /> Resources by faculty</h2>
          <div className="space-y-3">
            {stats.by_faculty.map((f) => (
              <div key={f.name}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-300">{f.name}</span>
                  <span className="text-slate-400">{f.resource_count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500"
                    style={{ width: `${(f.resource_count / maxByFaculty) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-bold"><Download size={17} /> Most downloaded</h2>
          {stats.top_downloaded.length === 0 ? (
            <p className="text-sm text-slate-400">No downloads yet.</p>
          ) : (
            <ol className="space-y-3">
              {stats.top_downloaded.map((r, i) => (
                <li key={r.title} className="flex items-center gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{r.title}</span>
                  <span className="text-slate-400">{r.download_count} downloads</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- invites */

function InvitesTab() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    api.get<Invite[]>('/invites/').then((r) => setInvites(r.data));
  }, []);

  useEffect(load, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/invites/', { note });
      setNote('');
      load();
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async (invite: Invite) => {
    const link = `${window.location.origin}/invite/${invite.token}`;
    await navigator.clipboard.writeText(link);
    setCopied(invite.id);
    setTimeout(() => setCopied(null), 1500);
  };

  const statusBadge = (invite: Invite) => {
    if (invite.is_used)
      return <span className="badge bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">Used</span>;
    if (invite.is_revoked)
      return <span className="badge bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300">Revoked</span>;
    return <span className="badge bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">Active</span>;
  };

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="card flex flex-wrap items-end gap-3 p-5">
        <div className="min-w-0 flex-1">
          <label className="label">Note <span className="font-normal text-slate-400">(who is this invite for?)</span></label>
          <input
            className="input"
            placeholder="e.g. CSC 300 level class rep"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
          />
        </div>
        <button type="submit" disabled={creating} className="btn-primary">
          <Plus size={16} /> {creating ? 'Generating…' : 'Generate invite link'}
        </button>
      </form>

      <div className="card divide-y divide-gray-100 dark:divide-slate-800">
        {invites.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">
            No invites yet. Generate one and share the link over WhatsApp, email or SMS.
          </p>
        ) : (
          invites.map((invite) => (
            <div key={invite.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
                  {statusBadge(invite)}
                  {invite.note && <span className="truncate">{invite.note}</span>}
                </p>
                <p className="truncate font-mono text-xs text-slate-400">{invite.token}</p>
                <p className="text-xs text-slate-400">
                  Created {timeAgo(invite.created_at)} · expires {new Date(invite.expires_at).toLocaleDateString()}
                  {invite.used_by_name && <> · used by {invite.used_by_name}</>}
                </p>
              </div>
              {!invite.is_used && !invite.is_revoked && (
                <button onClick={() => copyLink(invite)} className="btn-secondary !py-2">
                  {copied === invite.id ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy link</>}
                </button>
              )}
              {!invite.is_used && !invite.is_revoked && (
                <button
                  onClick={async () => {
                    if (!window.confirm('Revoke this invite? The link will stop working immediately.')) return;
                    await api.post(`/invites/${invite.id}/revoke/`);
                    load();
                  }}
                  className="btn-secondary !py-2 !text-red-600 dark:!text-red-400"
                >
                  <UserX size={14} /> Revoke
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ contributors */

function ContributorsTab() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [resetLink, setResetLink] = useState<{ name: string; link: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(() => {
    api.get<Contributor[]>('/admin/contributors/').then((r) => setContributors(r.data));
  }, []);

  useEffect(load, [load]);

  const toggleActive = async (c: Contributor) => {
    setBusy(c.id);
    try {
      await api.patch(`/admin/contributors/${c.id}/`, { is_active_contributor: !c.is_active_contributor });
      load();
    } finally {
      setBusy(null);
    }
  };

  const generateReset = async (c: Contributor) => {
    setBusy(c.id);
    setCopied(false);
    try {
      const { data } = await api.post<{ token: string }>(`/admin/users/${c.id}/reset-password/`);
      setResetLink({ name: c.full_name || c.username, link: `${window.location.origin}/reset/${data.token}` });
    } finally {
      setBusy(null);
    }
  };

  const copyReset = async () => {
    if (!resetLink) return;
    await navigator.clipboard.writeText(resetLink.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Deactivated contributors keep their uploads but can no longer sign in to upload.
        Reset links expire after 24 hours and work once.
      </p>
      <div className="card divide-y divide-gray-100 dark:divide-slate-800">
        {contributors.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">
            No contributors yet — generate an invite on the Invites tab.
          </p>
        ) : (
          contributors.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 p-4">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                c.is_active_contributor
                  ? 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300'
                  : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300'
              }`}>
                {(c.full_name || c.username).charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {c.full_name || c.username}
                  <span className="ml-1.5 font-normal text-slate-400">@{c.username}</span>
                </p>
                <p className="truncate text-xs text-slate-400">
                  {c.department_name || 'No department'} · {c.upload_count} upload{c.upload_count === 1 ? '' : 's'}
                  {' · '}{c.downloads_earned || 0} downloads · ★ {c.upvotes_earned || 0}
                </p>
              </div>
              <span className={`badge ${
                c.is_active_contributor
                  ? 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300'
                  : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300'
              }`}>
                {c.is_active_contributor ? 'Active' : 'Deactivated'}
              </span>
              <button onClick={() => generateReset(c)} disabled={busy === c.id} className="btn-secondary !py-2">
                <KeyRound size={14} /> Reset password
              </button>
              <button onClick={() => toggleActive(c)} disabled={busy === c.id} className="btn-secondary !py-2">
                {c.is_active_contributor ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          ))
        )}
      </div>

      {resetLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setResetLink(null)}>
          <div className="card w-full max-w-lg space-y-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Password reset link</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Send this link to <span className="font-semibold">{resetLink.name}</span> via
              WhatsApp, email or SMS. It expires in 24 hours and works only once.
            </p>
            <p className="break-all rounded-xl bg-gray-50 p-3 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {resetLink.link}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setResetLink(null)} className="btn-secondary">Close</button>
              <button onClick={copyReset} className="btn-primary">
                {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy link</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- resources */

function ResourcesTab() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    api.get<Faculty[]>('/faculties/').then((r) => setFaculties(r.data));
  }, []);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (faculty) params.set('faculty', faculty);
    if (department) params.set('department', department);
    if (search) params.set('search', search);
    const qs = params.toString();
    api.get<Resource[]>(`/admin/resources/${qs ? `?${qs}` : ''}`).then((r) => setResources(r.data));
  }, [faculty, department, search]);

  useEffect(load, [load]);

  const departments = faculties.find((f) => f.slug === faculty)?.departments || [];

  const remove = async (id: number) => {
    if (!window.confirm('Delete this resource permanently? The file will also be removed.')) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/resources/${id}/`);
      setResources((rs) => rs.filter((r) => r.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select
          className="input max-w-56"
          value={faculty}
          onChange={(e) => { setFaculty(e.target.value); setDepartment(''); }}
          aria-label="Filter by faculty"
        >
          <option value="">All faculties</option>
          {faculties.map((f) => <option key={f.id} value={f.slug}>{f.name}</option>)}
        </select>
        <select
          className="input max-w-56"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          disabled={!faculty}
          aria-label="Filter by department"
        >
          <option value="">{faculty ? 'All departments' : 'Choose a faculty first'}</option>
          {departments.map((d) => <option key={d.id} value={d.slug}>{d.name}</option>)}
        </select>
        <input
          className="input max-w-md flex-1"
          placeholder="Search resources…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="card divide-y divide-gray-100 dark:divide-slate-800">
        {resources.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No resources match.</p>
        ) : (
          resources.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 p-4">
              <FileTypeBadge type={r.file_type} />
              <div className="min-w-0 flex-1">
                <Link to={`/resource/${r.id}`} className="block truncate text-sm font-semibold hover:text-primary-600 dark:hover:text-primary-400">
                  {r.title}
                </Link>
                <p className="truncate text-xs text-slate-400">
                  {r.course_code && <>{r.course_code} · </>}
                  {r.department_name} · {formatBytes(r.file_size)} · {r.download_count} downloads
                </p>
              </div>
              <span className="text-xs text-slate-400">{timeAgo(r.upload_date)}</span>
              <button
                onClick={() => remove(r.id)}
                disabled={deleting === r.id}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                aria-label={`Delete ${r.title}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
