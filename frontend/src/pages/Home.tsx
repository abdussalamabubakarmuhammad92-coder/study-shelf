import { ArrowRight, BookOpen, Clock, Download, GraduationCap, Search, Star, UploadCloud } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Faculty, RecentDownload, Resource } from '../lib/types';
import { ResourceCard } from '../components/ResourceCard';
import { useRecentDownloads } from '../hooks/useRecentDownloads';

export default function Home() {
  const [featured, setFeatured] = useState<Resource[]>([]);
  const [recentUploads, setRecentUploads] = useState<Resource[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [query, setQuery] = useState('');
  const { recent } = useRecentDownloads();
  const navigate = useNavigate();

  useEffect(() => {
    api.get<Resource[]>('/resources/?featured=true').then((r) => setFeatured(r.data.slice(0, 6)));
    api.get<Resource[]>('/resources/').then((r) => setRecentUploads(r.data.slice(0, 8)));
    api.get<Faculty[]>('/faculties/').then((r) => setFaculties(r.data));
  }, []);

  const stats = useMemo(
    () => ({
      resources: faculties.reduce((n, f) => n + f.resource_count, 0),
      faculties: faculties.length,
      departments: faculties.reduce((n, f) => n + f.departments.length, 0),
    }),
    [faculties],
  );

  const recentById = (items: RecentDownload[]) =>
    items.map((r) => ({ recent: r, resource: recentUploads.find((u) => u.id === r.id) }));

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/browse?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 px-6 py-14 text-center text-white shadow-xl shadow-primary-900/20 sm:px-12">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <span className="badge mb-4 !bg-white/15 !text-white">
          <GraduationCap size={13} /> Open to every student — no account needed
        </span>
        <h1 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Your campus course materials,{' '}
          <span className="text-teal-200">one search away.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-primary-100 sm:text-lg">
          Lecture notes, handouts, past questions and more — organized across {stats.faculties} faculties and {stats.departments} departments.
        </p>

        <form onSubmit={submitSearch} className="mx-auto mt-8 flex max-w-xl gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, course code or filename…"
              className="input !border-transparent !bg-white !py-3.5 !pl-11 !text-slate-900 !shadow-lg"
            />
          </div>
          <button type="submit" className="btn bg-slate-900 !px-5 !py-3.5 text-white hover:bg-slate-800">
            Search
          </button>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-primary-100">
          <span className="flex items-center gap-2"><BookOpen size={16} /> {stats.resources} resources</span>
          <span className="flex items-center gap-2"><Star size={16} /> Community rated</span>
          <span className="flex items-center gap-2"><Download size={16} /> Free downloads</span>
        </div>
      </section>

      {/* Recent downloads (localStorage) */}
      {recent.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <Clock size={20} className="text-primary-600" /> Your recent downloads
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {recentById(recent).map(({ recent: r, resource }) => (
              <Link
                key={r.id}
                to={resource ? `/resource/${r.id}` : '#'}
                className="card flex items-center gap-3 p-4 hover:border-primary-300 hover:shadow-md dark:hover:border-primary-800"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                  <Download size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {resource?.title || r.title}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(r.timestamp).toLocaleString()}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Star size={20} className="fill-amber-400 text-amber-400" /> Featured resources
            </h2>
            <Link to="/browse" className="flex items-center gap-1 text-sm font-semibold text-primary-600 hover:underline dark:text-primary-400">
              Browse all <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((r) => <ResourceCard key={r.id} resource={r} />)}
          </div>
        </section>
      )}

      {/* Recent uploads */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
          <UploadCloud size={20} className="text-accent-500" /> Recently uploaded
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recentUploads.map((r) => <ResourceCard key={r.id} resource={r} />)}
        </div>
      </section>

      {/* Faculties quick links */}
      <section>
        <h2 className="mb-4 text-xl font-bold">Explore by faculty</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {faculties.map((f) => (
            <Link
              key={f.id}
              to={`/browse/${f.slug}`}
              className="card group flex items-center justify-between p-4 hover:border-primary-300 hover:shadow-md dark:hover:border-primary-800"
            >
              <div>
                <p className="font-semibold group-hover:text-primary-600 dark:group-hover:text-primary-400">{f.name}</p>
                <p className="text-xs text-slate-400">
                  {f.departments.length} departments · {f.resource_count} resources
                </p>
              </div>
              <ArrowRight size={16} className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-primary-500" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
