/** アプリ全体の型定義 */

/** 画面フェーズ */
export type AppPhase =
  | 'login'
  | 'intro'
  | 'locating'
  | 'survey'
  | 'loading'
  | 'results'
  | 'departure'
  | 'reviewed'
  | 'error';

/** カテゴリ */
export type ShopCategory = 'food' | 'cafe' | 'souvenir';

/** アンケート回答 */
export interface SurveyAnswers {
  category: ShopCategory;
  answers: string[];
}

/** 推薦店舗 */
export interface Shop {
  name: string;
  cuisine: string;
  address: string;
  rating: number;
  reason: string;
  mapsUrl: string;
}

/** 除外店舗（Supabase: excluded_shops） */
export interface ExcludedShop {
  id: string;
  user_id: string;
  shop_name: string;
  excluded_until: string;
  created_at: string;
}

/** 来店予定（Supabase: pending_visits） */
export interface PendingVisit {
  id: string;
  user_id: string;
  shop_name: string;
  cuisine: string | null;
  address: string | null;
  visited_at: string;
}

/** レビュー（Supabase: reviews） */
export interface Review {
  id: string;
  user_id: string;
  shop_name: string;
  cuisine: string | null;
  rating: number;
  reviewed_at: string;
}

/** 現在地 */
export interface Location {
  lat: number;
  lng: number;
  address?: string;
}
