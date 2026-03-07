/** 店舗推薦カードコンポーネント */
import type { Shop } from '../types';

interface RestaurantCardProps {
  shop: Shop;
  onSelect: (shop: Shop) => void;
  isFavorite?: boolean;
}

/**
 * 推薦店舗の情報を表示するカード
 */
export function RestaurantCard({ shop, onSelect, isFavorite = false }: RestaurantCardProps) {
  return (
    <button
      onClick={() => onSelect(shop)}
      className="w-full max-w-md mx-auto bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-2 text-left hover:border-blue-400 hover:shadow-md transition-all shadow-sm"
    >
      {isFavorite && (
        <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full w-fit">
          ⭐ お気に入り
        </span>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-bold text-gray-800">{shop.name}</span>
          <span className="text-xs text-gray-500">{shop.cuisine}</span>
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-yellow-400 text-sm">★</span>
            <span className="text-sm font-semibold text-gray-700">{shop.rating.toFixed(1)}</span>
          </div>
          {shop.distanceM !== undefined && (
            <span className="text-xs text-blue-500">
              {shop.distanceM < 1000
                ? `${shop.distanceM}m`
                : `${(shop.distanceM / 1000).toFixed(1)}km`}
            </span>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500">{shop.address}</p>
      {shop.hours && (
        <p className="text-xs text-green-600">営業時間: {shop.hours}</p>
      )}
      <p className="text-sm text-gray-600 leading-relaxed">{shop.reason}</p>
      <span className="text-xs text-blue-500 mt-1">タップしてGoogle Mapsで開く →</span>
    </button>
  );
}
