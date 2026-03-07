/** 現在地取得フック */
import { useState } from 'react';
import type { Location } from '../types';

/** 根津のデフォルト座標（取得失敗時のフォールバック） */
const DEFAULT_LOCATION: Location = { lat: 35.7219, lng: 139.7628 };

interface UseLocationReturn {
  location: Location | null;
  error: string | null;
  loading: boolean;
  getLocation: () => Promise<Location>;
}

/**
 * Geolocation APIで現在地を取得するフック
 */
export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * 現在地を取得する。失敗時はデフォルト座標を返す
   */
  const getLocation = (): Promise<Location> => {
    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setError('このブラウザでは位置情報を取得できません');
        setLocation(DEFAULT_LOCATION);
        setLoading(false);
        resolve(DEFAULT_LOCATION);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(loc);
          setLoading(false);
          resolve(loc);
        },
        (err) => {
          console.error('位置情報取得エラー:', err);
          setError('位置情報の取得に失敗しました。デフォルト地点を使用します。');
          setLocation(DEFAULT_LOCATION);
          setLoading(false);
          resolve(DEFAULT_LOCATION);
        },
        { timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  return { location, error, loading, getLocation };
}
