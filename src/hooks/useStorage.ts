/** Supabase CRUD フック */
import { supabase } from '../lib/supabase';
import type { ExcludedShop, PendingVisit, Review, Shop } from '../types';

/**
 * Supabaseデータ操作フック
 */
export function useStorage() {
  /**
   * 除外店舗リストを取得（有効期限内のみ）
   */
  const getExcludedShops = async (): Promise<ExcludedShop[]> => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('excluded_shops')
      .select('*')
      .gt('excluded_until', now);
    if (error) throw error;
    return data ?? [];
  };

  /**
   * 店舗を7日間除外リストに追加
   */
  const addExcludedShop = async (shopName: string): Promise<void> => {
    const excludedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from('excluded_shops').insert({
      shop_name: shopName,
      excluded_until: excludedUntil,
    });
    if (error) throw error;
  };

  /**
   * 来店予定を追加
   */
  const addPendingVisit = async (shop: Shop): Promise<void> => {
    const { error } = await supabase.from('pending_visits').insert({
      shop_name: shop.name,
      cuisine: shop.cuisine,
      address: shop.address,
    });
    if (error) throw error;
  };

  /**
   * 未レビューの来店予定を取得
   */
  const getPendingVisits = async (): Promise<PendingVisit[]> => {
    const { data, error } = await supabase
      .from('pending_visits')
      .select('*')
      .order('visited_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  };

  /**
   * 来店予定を削除
   */
  const deletePendingVisit = async (id: string): Promise<void> => {
    const { error } = await supabase.from('pending_visits').delete().eq('id', id);
    if (error) throw error;
  };

  /**
   * レビューを保存
   */
  const addReview = async (
    shopName: string,
    cuisine: string | null,
    rating: number
  ): Promise<void> => {
    const { error } = await supabase.from('reviews').insert({
      shop_name: shopName,
      cuisine,
      rating,
    });
    if (error) throw error;
  };

  /**
   * レビュー一覧を取得
   */
  const getReviews = async (): Promise<Review[]> => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('reviewed_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  };

  return {
    getExcludedShops,
    addExcludedShop,
    addPendingVisit,
    getPendingVisits,
    deletePendingVisit,
    addReview,
    getReviews,
  };
}
