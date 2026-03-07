/** 来店履歴一覧コンポーネント */
import type { Review } from '../types';

interface VisitedListProps {
  reviews: Review[];
}

/**
 * 過去のレビュー一覧を表示するコンポーネント
 */
export function VisitedList({ reviews }: VisitedListProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">
        まだ来店履歴がありません
      </p>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-gray-600">来店履歴</h3>
      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between gap-2"
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-medium text-gray-800 truncate">{review.shop_name}</span>
            {review.cuisine && (
              <span className="text-xs text-gray-400">{review.cuisine}</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-yellow-400 text-sm">{'★'.repeat(review.rating)}</span>
            <span className="text-xs text-gray-400">
              {new Date(review.reviewed_at).toLocaleDateString('ja-JP')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
