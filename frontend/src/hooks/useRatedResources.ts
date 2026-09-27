import { useCallback, useState } from 'react';

const KEY = 'rated_resources';

function read(): number[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

/** Anti-spam for upvotes: each browser can upvote a resource only once. */
export function useRatedResources() {
  const [rated, setRated] = useState<number[]>(read);

  const hasRated = useCallback((id: number) => rated.includes(id), [rated]);

  const markRated = useCallback((id: number) => {
    const ids = read();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(KEY, JSON.stringify(ids));
      setRated(ids);
    }
  }, []);

  return { hasRated, markRated };
}
