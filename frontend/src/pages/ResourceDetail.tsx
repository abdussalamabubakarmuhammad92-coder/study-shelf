import { ArrowLeft, BookOpen, Download, FileText, Hash, Star, UploadCloud, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { Resource } from '../lib/types';
import { FileTypeBadge, formatBytes, timeAgo } from '../components/ResourceCard';
import { RatingButton } from '../components/RatingButton';
import { useRecentDownloads } from '../hooks/useRecentDownloads';

export default function ResourceDetail() {
  const { id } = useParams();
  const [resource, setResource] = useState<Resource | null>(null);
  const [error, setError] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);
  const { add } = useRecentDownloads();

  useEffect(() => {
    api
      .get<Resource>(`/resources/${id}/`)
      .then((r) => setResource(r.data))
      .catch(() => setError(true));
  }, [id]);

  const download = async () => {
    if (!resource) return;
    // POST to bump the counter, then trigger a real browser download
    const { data } = await api.post(`/resources/${resource.id}/download/`, null, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = resource.file_name;
    a.click();
    URL.revokeObjectURL(url);
    add(resource.id, resource.title);
    setResource({ ...resource, download_count: resource.download_count + 1 });
  };

  if (error)
    return (
      <div className="card p-12 text-center">
        <p className="font-semibold">Resource not found.</p>
        <Link to="/browse" className="btn-secondary mt-4">Back to browse</Link>
      </div>
    );
  if (!resource)
    return <div className="card h-64 animate-pulse bg-gray-100 dark:bg-slate-800" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to={`/browse/${resource.faculty_slug}/${resource.department_slug}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
      >
        <ArrowLeft size={15} /> Back to {resource.department_name}
      </Link>

      <div className="card animate-slide-up p-6 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <FileTypeBadge type={resource.file_type} />
          {resource.is_featured && (
            <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <Star size={11} className="fill-amber-500 text-amber-500" /> Featured
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{resource.title}</h1>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
          {resource.course_code && (
            <span className="flex items-center gap-1.5">
              <Hash size={14} /> {resource.course_code}
            </span>
          )}
          <span>
            {resource.faculty_name} · {resource.department_name}
          </span>
          {resource.uploaded_by_name && (
            <span className="flex items-center gap-1.5">
              <User size={14} /> {resource.uploaded_by_name}
            </span>
          )}
          <span>{timeAgo(resource.upload_date)}</span>
        </div>

        {resource.description && (
          <p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-300">
            {resource.description}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-gray-50 p-4 sm:flex-row sm:flex-wrap sm:items-center dark:bg-slate-800/60">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
            <FileText size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{resource.file_name}</p>
            <p className="whitespace-nowrap text-xs text-slate-400">
              {formatBytes(resource.file_size)} · {resource.download_count} downloads
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {resource.file_type === 'pdf' && resource.file_url && (
              <button onClick={() => setReaderOpen((v) => !v)} className="btn-secondary">
                {readerOpen ? <><X size={16} /> Close reader</> : <><BookOpen size={16} /> Read in browser</>}
              </button>
            )}
            <button onClick={download} className="btn-primary">
              <Download size={17} /> Download
            </button>
          </div>
        </div>

        {/* Inline image preview (WS9: images render on the page, not just as downloads) */}
        {resource.file_type === 'image' && resource.file_url && (
          <img
            src={resource.file_url}
            alt={resource.title}
            className="mt-4 max-h-[70vh] w-full rounded-2xl border border-gray-200 object-contain dark:border-slate-700"
          />
        )}

        {/* In-site PDF reader */}
        {readerOpen && resource.file_url && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 shadow-inner dark:border-slate-700">
            <iframe
              src={`${resource.file_url}#view=FitH`}
              title={`Reading ${resource.title}`}
              className="h-[80vh] w-full bg-white"
            />
            <p className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-slate-400 dark:border-slate-700 dark:bg-slate-900">
              Reading “{resource.title}” right here on the portal — use the viewer's toolbar to zoom or jump pages.
            </p>
          </div>
        )}

        <div className="mt-6 border-t border-gray-100 pt-6 dark:border-slate-800">
          <RatingButton
            resourceId={resource.id}
            ratingCount={resource.rating_count}
            averageRating={resource.average_rating}
          />
        </div>
      </div>

      <div className="card flex items-center gap-4 p-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
          <UploadCloud size={19} />
        </span>
        <p className="flex-1 text-sm text-slate-500 dark:text-slate-400">
          Have materials for this course? Contribute to help your classmates.
        </p>
        <Link to="/upload" className="btn-secondary">Share a file</Link>
      </div>
    </div>
  );
}
