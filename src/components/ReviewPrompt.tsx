/** 来店後レビュー入力コンポーネント */
import type { PendingVisit } from '../types';

interface ReviewPromptProps {
  visit: PendingVisit;
  onRate: (rating: number) => Promise<void>;
  onSkip: () => Promise<void>;
}

/**
 * 来店後に星1〜5のレビューを入力するカード
 */
export function ReviewPrompt({ visit, onRate, onSkip }: ReviewPromptProps) {
  const handleRate = async (rating: number) => {
    try {
      await onRate(rating);
    } catch (err) {
      console.error('レビュー保存エラー:', err);
    }
  };

  const handleSkip = async () => {
    try {
      await onSkip();
    } catch (err) {
      console.error('スキップエラー:', err);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-3">
      <p className="text-sm font-medium text-amber-800">来店後のご感想をどうぞ</p>
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-bold text-gray-800">{visit.shop_name}</span>
        {visit.cuisine && (
          <span className="text-xs text-gray-500">{visit.cuisine}</span>
        )}
      </div>
      {/* 星評価ボタン */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            className="flex-1 min-h-[44px] text-2xl hover:scale-110 transition-transform"
            aria-label={`${star}星`}
          >
            ★
          </button>
        ))}
      </div>
      <button
        onClick={handleSkip}
        className="text-xs text-gray-400 hover:text-gray-600 min-h-[44px]"
      >
        まだ行っていない / スキップ
      </button>
    </div>
  );
}
