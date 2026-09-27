import { Download, FileText, FileImage, File as FileIcon, Presentation, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Resource } from '../lib/types';

const TYPE_STYLES: Record<string, { label: string; classes: string; icon: typeof FileText }> = {
  pdf: { label: 'PDF', classes: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300', icon: FileText },
  docx: { label: 'DOCX', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', icon: FileText },
  pptx: { label: 'PPTX', classes: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300', icon: Presentation },
  txt: { label: 'TXT', classes: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', icon: FileText },
  image: { label: 'Image', classes: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300', icon: FileImage },
  other: { label: 'File', classes: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', icon: FileIcon },
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const units: [number, string][] = [
    [31536000, 'y'], [2592000, 'mo'], [604800, 'w'], [86400, 'd'], [3600, 'h'], [60, 'm'],
  ];
  for (const [secs, label] of units) {
    const n = Math.floor(seconds / secs);
    if (n >= 1) return `${n}${label} ago`;
  }
  return 'just now';
}

export function FileTypeBadge({ type }: { type: string }) {
  const style = TYPE_STYLES[type] || TYPE_STYLES.other;
  const Icon = style.icon;
  return (
    <span className={`badge ${style.classes}`}>
      <Icon size={11} /> {style.label}
    </span>
  );
}

export function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Link
      to={`/resource/${resource.id}`}
      className="card group animate-slide-up flex flex-col p-5 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5 dark:hover:shadow-black/30"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <FileTypeBadge type={resource.file_type} />
        {resource.is_featured && (
          <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <Star size={11} className="fill-amber-500 text-amber-500" /> Featured
          </span>
        )}
      </div>

      <h3 className="mb-1 line-clamp-2 font-semibold leading-snug text-slate-900 transition group-hover:text-primary-600 dark:text-slate-100 dark:group-hover:text-primary-400">
        {resource.title}
      </h3>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
        {resource.course_code || resource.department_name}
      </p>
      {resource.description && (
        <p className="mb-4 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
          {resource.description}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Download size={13} /> {resource.download_count}
        </span>
        <span className="flex items-center gap-1 text-amber-500">
          <Star size={13} className={resource.rating_count > 0 ? 'fill-amber-400' : ''} />
          <span className="text-slate-600 dark:text-slate-300">
            {resource.rating_count > 0 ? resource.average_rating : '—'}
          </span>
        </span>
        <span>{timeAgo(resource.upload_date)}</span>
      </div>
    </Link>
  );
}
