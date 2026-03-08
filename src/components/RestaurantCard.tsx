/** 店舗推薦カードコンポーネント */
import { useState } from 'react';
import type { CorrectionType, Shop } from '../types';

interface RestaurantCardProps {
  shop: Shop;
  onSelect: (shop: Shop) => void;
  onDismiss?: (shop: Shop, reason: CorrectionType) => void;
  isFavorite?: boolean;
}

export function RestaurantCard({ shop, onSelect, onDismiss, isFavorite = false }: RestaurantCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const priceLabel = shop.priceLevel !== undefined
    ? ['', '¥', '¥¥', '¥¥¥', '¥¥¥¥'][shop.priceLevel] ?? ''
    : '';

  return (
    <div className="relative w-full max-w-md mx-auto bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:border-blue-400 hover:shadow-md transition-all">

      {/* 除外メニュー */}
      {showMenu && (
        <div className="absolute inset-0 z-10 bg-white/95 rounded-2xl flex flex-col items-center justify-center gap-3 p-4">
          <p className="text-sm font-medium text-gray-700">このお店を除外する理由は？</p>
          <button
            onClick={() => onDismiss?.(shop, 'skip_today')}
            className="w-full min-h-[44px] bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-700"
          >
            今日は行かない（7日間除外）
          </button>
          <button
            onClick={() => onDismiss?.(shop, 'takeout_only')}
            className="w-full min-h-[44px] bg-orange-50 hover:bg-orange-100 rounded-xl text-sm text-orange-700"
          >
            テイクアウト専門店だった（今後も除外）
          </button>
          <button
            onClick={() => setShowMenu(false)}
            className="text-xs text-gray-400 hover:text-gray-600 min-h-[44px]"
          >
            キャンセル
          </button>
        </div>
      )}

      {/* × ボタン */}
      {onDismiss && (
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(true); }}
          className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm leading-none"
          aria-label="除外"
        >
          ×
        </button>
      )}

      {/* 写真 */}
      {shop.photoUrl && (
        <img src={shop.photoUrl} alt={shop.name} className="w-full h-36 object-cover" />
      )}

      {/* カード本体 - タップでMaps */}
      <button
        onClick={() => onSelect(shop)}
        className="w-full p-4 flex flex-col gap-2 text-left"
      >
        {isFavorite && (
          <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full w-fit">
            お気に入り
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
            {priceLabel && <span className="text-xs text-gray-500">{priceLabel}</span>}
            {shop.distanceM !== undefined && (
              <span className="text-xs text-blue-500">
                {shop.distanceM < 1000 ? `${shop.distanceM}m` : `${(shop.distanceM / 1000).toFixed(1)}km`}
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500">{shop.address}</p>
        {shop.hours && <p className="text-xs text-green-600">営業時間: {shop.hours}</p>}
        <p className="text-sm text-gray-600 leading-relaxed">{shop.reason}</p>
        <span className="text-xs text-blue-500 mt-1">タップしてGoogle Mapsで開く →</span>
      </button>
    </div>
  );
}
