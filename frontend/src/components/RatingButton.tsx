import { Check, Star } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';
import { useRatedResources } from '../hooks/useRatedResources';

interface Props {
  resourceId: number;
  ratingCount: number;
  averageRating: number;
  onChange?: (ratingCount: number, averageRating: number) => void;
}

export function RatingButton({ resourceId, ratingCount, averageRating, onChange }: Props) {
  const { hasRated, markRated } = useRatedResources();
  const [count, setCount] = useState(ratingCount);
  const [avg, setAvg] = useState(averageRating);
  const rated = hasRated(resourceId);
  const [busy, setBusy] = useState(false);

  const upvote = async () => {
    if (rated || busy) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/resources/${resourceId}/rate/`);
      setCount(data.rating_count);
      setAvg(data.average_rating);
      markRated(resourceId);
      onChange?.(data.rating_count, data.average_rating);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={upvote}
        disabled={rated || busy}
        className={`btn ${rated ? 'btn-secondary !text-teal-600 dark:!text-teal-400' : 'btn-secondary'}`}
        title={rated ? 'You already rated this resource' : 'Give this resource a thumbs up'}
      >
        {rated ? <Check size={16} /> : <Star size={16} />}
        {rated ? 'Rated' : 'Rate this resource'}
      </button>
      <div className="text-sm text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1 font-semibold text-amber-500">
          <Star size={15} className={count > 0 ? 'fill-amber-400' : ''} />
          {count > 0 ? avg : 'No ratings yet'}
        </span>
        {count > 0 && <span className="text-xs">from {count} student{count === 1 ? '' : 's'}</span>}
      </div>
    </div>
  );
}
