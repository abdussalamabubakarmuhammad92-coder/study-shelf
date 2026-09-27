import { FolderOpen, Search, SearchX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { Faculty, Resource } from '../lib/types';
import { ResourceCard } from '../components/ResourceCard';

export default function Browse() {
  const { faculty: facultySlug, department: departmentSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';

  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    api.get<Faculty[]>('/faculties/').then((r) => setFaculties(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (facultySlug) params.set('faculty', facultySlug);
    if (departmentSlug) params.set('department', departmentSlug);
    if (search) params.set('search', search);
    api
      .get<Resource[]>(`/resources/?${params.toString()}`)
      .then((r) => setResources(r.data))
      .finally(() => setLoading(false));
  }, [facultySlug, departmentSlug, search]);

  const faculty = faculties.find((f) => f.slug === facultySlug);
  const department = faculty?.departments.find((d) => d.slug === departmentSlug);

  const heading = department
    ? department.name
    : faculty
      ? faculty.name
      : search
        ? `Search results for “${search}”`
        : 'All resources';

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) next.set('search', searchInput.trim());
    else next.delete('search');
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-sm text-slate-400">
          <Link to="/browse" className="hover:underline">Resources</Link>
          {faculty && <> / <Link to={`/browse/${faculty.slug}`} className="hover:underline">{faculty.name}</Link></>}
          {department && <> / <span className="text-slate-500 dark:text-slate-400">{department.name}</span></>}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
        {faculty?.description && (
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{faculty.description}</p>
        )}
      </div>

      <form onSubmit={submitSearch} className="relative max-w-md">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search title, course code or filename…"
          className="input !pl-10"
        />
      </form>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-44 animate-pulse bg-gray-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <SearchX size={40} className="text-slate-300 dark:text-slate-600" />
          <p className="font-semibold">No resources found</p>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Nothing matches here yet. Try another department or a different search term.
          </p>
          <Link to="/browse" className="btn-secondary mt-2">Browse everything</Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <FolderOpen size={14} className="mr-1 inline" />
            {resources.length} resource{resources.length === 1 ? '' : 's'} available
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => <ResourceCard key={r.id} resource={r} />)}
          </div>
        </>
      )}
    </div>
  );
}
