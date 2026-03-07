/** 店舗検索フック（Google Places API + Anthropic API） */
import { useState } from 'react';
import type { Shop, SurveyAnswers, Location } from '../types';

interface UseSearchReturn {
  shops: Shop[];
  loading: boolean;
  error: string | null;
  search: (answers: SurveyAnswers, location: Location, excludedNames: string[]) => Promise<void>;
}

export function useSearch(): UseSearchReturn {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (
    answers: SurveyAnswers,
    location: Location,
    excludedNames: string[]
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    setShops([]);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          category: answers.category,
          answers: answers.answers,
          excludedNames,
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? `APIエラー: ${res.status}`);
      }

      const data = await res.json() as { shops: Shop[] };
      const sorted = data.shops.sort((a, b) => b.rating - a.rating);
      setShops(sorted);
    } catch (err) {
      const message = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return { shops, loading, error, search };
}
