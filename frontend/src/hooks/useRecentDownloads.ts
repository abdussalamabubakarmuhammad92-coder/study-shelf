import { useCallback, useState } from 'react';
import type { RecentDownload } from '../lib/types';

const KEY = 'recent_downloads';
const MAX_ITEMS = 3;

function read(): RecentDownload[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

/** Last 3 downloaded resources, tracked in localStorage. */
export function useRecentDownloads() {
  const [recent, setRecent] = useState<RecentDownload[]>(read);

  const add = useCallback((id: number, title: string) => {
    const items = read().filter((r) => r.id !== id);
    items.unshift({ id, title, timestamp: Date.now() });
    const trimmed = items.slice(0, MAX_ITEMS);
    localStorage.setItem(KEY, JSON.stringify(trimmed));
    setRecent(trimmed);
  }, []);

  return { recent, add };
}
