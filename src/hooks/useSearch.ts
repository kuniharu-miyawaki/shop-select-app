/** 店舗検索フック（Google Places API + Anthropic API） */
import { useState } from 'react';
import type { Shop, SurveyAnswers, Location } from '../types';

interface UseSearchReturn {
  shops: Shop[];
  favoriteSlot: Shop[];
  loading: boolean;
  error: string | null;
  search: (answers: SurveyAnswers, location: Location, excludedNames: string[], favoriteNames: string[]) => Promise<void>;
}

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function useSearch(): UseSearchReturn {
  const [shops, setShops] = useState<Shop[]>([]);
  const [favoriteSlot, setFavoriteSlot] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (
    answers: SurveyAnswers,
    location: Location,
    excludedNames: string[],
    favoriteNames: string[]
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    setShops([]);
    setFavoriteSlot([]);

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
          favoriteNames,
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? `APIエラー: ${res.status}`);
      }

      const data = await res.json() as { shops: Array<Shop & { placeLat?: number; placeLng?: number }>; favoriteSlot: Array<Shop & { placeLat?: number; placeLng?: number }> };

      const shopsWithDistance = data.shops.map((shop) => {
        const { placeLat, placeLng, ...rest } = shop;
        const distanceM =
          placeLat !== undefined && placeLng !== undefined
            ? calcDistance(location.lat, location.lng, placeLat, placeLng)
            : undefined;
        return { ...rest, distanceM };
      });

      const sorted = shopsWithDistance.sort((a, b) => b.rating - a.rating);
      setShops(sorted);

      const favWithDistance = (data.favoriteSlot ?? []).map((shop) => {
        const { placeLat, placeLng, ...rest } = shop;
        const distanceM =
          placeLat !== undefined && placeLng !== undefined
            ? calcDistance(location.lat, location.lng, placeLat, placeLng)
            : undefined;
        return { ...rest, distanceM };
      });
      setFavoriteSlot(favWithDistance);
    } catch (err) {
      const message = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return { shops, favoriteSlot, loading, error, search };
}
