import { FileText, Trash2, UploadCloud, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { Faculty, Resource } from '../lib/types';
import { FileTypeBadge, formatBytes } from '../components/ResourceCard';

const MAX_FILE_MB = 50;
const ACCEPTED = '.pdf,.docx,.doc,.pptx,.ppt,.txt,.jpg,.jpeg,.png,.gif,.webp';

interface Queued {
  file: File;
  error?: string;
}

export default function Upload() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [facultySlug, setFacultySlug] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [description, setDescription] = useState('');
  const [queue, setQueue] = useState<Queued[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Resource[] | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<Faculty[]>('/faculties/').then((r) => setFaculties(r.data));
  }, []);

  const faculty = faculties.find((f) => f.slug === facultySlug);
  const departments = faculty?.departments || [];

  const validate = (file: File): string | undefined => {
    if (file.size > MAX_FILE_MB * 1024 * 1024) return `Larger than ${MAX_FILE_MB}MB`;
    return undefined;
  };

  const addFiles = useCallback((files: FileList | File[]) => {
    const queued = Array.from(files).map((file) => ({ file, error: validate(file) }));
    setQueue((q) => [...q, ...queued]);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const removeQueued = (index: number) => setQueue((q) => q.filter((_, i) => i !== index));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const files = queue.filter((q) => !q.error).map((q) => q.file);
    if (!files.length) {
      setError('Add at least one valid file to upload.');
      return;
    }
    if (!departmentId) {
      setError('Choose a faculty and department.');
      return;
    }
    setUploading(true);
    setProgress(0);
    setResults(null);
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    formData.append('department', departmentId);
    if (courseCode.trim()) formData.append('course_code', courseCode.trim().toUpperCase());
    if (description.trim()) formData.append('description', description.trim());

    try {
      const { data } = await api.post<Resource[]>('/resources/', formData, {
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });
      setResults(data);
      setQueue([]);
      setCourseCode('');
      setDescription('');
    } catch (err: any) {
      setError(err.response?.data?.detail || Object.values(err.response?.data || {})[0] as string || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  if (!loading && !user) return <Navigate to="/login" replace />;
  if (loading) return <div className="card h-64 animate-pulse bg-gray-100 dark:bg-slate-800" />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload resources</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Sharing as <span className="font-semibold">{user?.full_name || user?.username}</span>. Files up to {MAX_FILE_MB}MB each — PDF, DOCX, PPTX, TXT or images.
        </p>
      </div>

      {results && (
        <div className="card animate-slide-up border-teal-300 bg-teal-50 p-5 dark:border-teal-800 dark:bg-teal-950/40">
          <p className="font-semibold text-teal-700 dark:text-teal-300">
            Uploaded {results.length} file{results.length === 1 ? '' : 's'} successfully 🎉
          </p>
          <div className="mt-3 space-y-2">
            {results.map((r) => (
              <Link
                key={r.id}
                to={`/resource/${r.id}`}
                className="flex items-center gap-2 text-sm text-teal-800 hover:underline dark:text-teal-200"
              >
                <FileTypeBadge type={r.file_type} /> {r.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={submit} className="card space-y-5 p-6">
        {/* Drag & drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
            dragging
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50 dark:border-slate-700 dark:hover:border-primary-700 dark:hover:bg-slate-800/50'
          }`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
            <UploadCloud size={22} />
          </span>
          <div>
            <p className="font-semibold">Drag &amp; drop files here</p>
            <p className="text-xs text-slate-400">or click to browse — select multiple files at once</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>

        {/* Queue */}
        {queue.length > 0 && (
          <ul className="space-y-2">
            {queue.map((q, i) => (
              <li
                key={`${q.file.name}-${i}`}
                className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm ${
                  q.error
                    ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40'
                    : 'border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/60'
                }`}
              >
                <FileText size={16} className="shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{q.file.name}</span>
                  <span className="text-xs text-slate-400">
                    {formatBytes(q.file.size)}
                    {q.error && <span className="text-red-500"> — {q.error}</span>}
                  </span>
                </span>
                <button type="button" onClick={() => removeQueued(i)} aria-label="Remove file" className="text-slate-400 hover:text-red-500">
                  <X size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Metadata */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Faculty</label>
            <select
              className="input"
              value={facultySlug}
              onChange={(e) => { setFacultySlug(e.target.value); setDepartmentId(''); }}
              required
            >
              <option value="">Select faculty…</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.slug}>{f.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Department</label>
            <select
              className="input"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              required
              disabled={!facultySlug}
            >
              <option value="">{facultySlug ? 'Select department…' : 'Choose a faculty first'}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Course code <span className="font-normal text-slate-400">(optional)</span></label>
          <input
            className="input"
            placeholder="e.g. CSC301"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            maxLength={20}
          />
        </div>
        <div>
          <label className="label">Description <span className="font-normal text-slate-400">(optional)</span></label>
          <textarea
            className="input min-h-24 resize-y"
            placeholder="What's in these materials? Semester covered, topics…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </p>
        )}

        {uploading && (
          <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        <button type="submit" disabled={uploading || queue.every((q) => q.error) || queue.length === 0} className="btn-primary w-full !py-3">
          {uploading ? `Uploading… ${progress}%` : <><UploadCloud size={17} /> Upload {queue.filter((q) => !q.error).length || ''} file{queue.length === 1 ? '' : 's'}</>}
        </button>
      </form>
    </div>
  );
}
