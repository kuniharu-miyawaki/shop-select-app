/** アンケートフローコンポーネント */
import { useState } from 'react';
import type { ShopCategory, SurveyAnswers } from '../types';

interface SurveyProps {
  onComplete: (answers: SurveyAnswers) => void;
  onCancel: () => void;
}

/** カテゴリ選択肢 */
const CATEGORIES: { value: ShopCategory; label: string; icon: string }[] = [
  { value: 'food', label: '食事', icon: '🍽️' },
  { value: 'cafe', label: '喫茶', icon: '☕' },
  { value: 'souvenir', label: 'お土産', icon: '🎁' },
];

/** カテゴリごとの質問定義 */
const QUESTIONS: Record<ShopCategory, { label: string; options: string[] }[]> = {
  food: [
    { label: '食感の好み', options: ['コッテリ食べたい', 'さっぱりしたい'] },
    { label: '温度の好み', options: ['温かいもの', '冷たいもの', 'どちらでも'] },
    { label: '雰囲気', options: ['和の雰囲気', '洋の雰囲気', 'こだわらない'] },
    { label: '予算', options: ['〜1,000円', '〜2,000円', '〜3,000円', '4,000円〜'] },
    { label: '行列の許容', options: ['並びたくない', '5分まで', '15分まで', '並んでもOK'] },
  ],
  cafe: [
    { label: '過ごし方', options: ['ゆっくりしたい', 'さっと済ませたい'] },
    { label: '注文の好み', options: ['スイーツも！', 'ドリンクだけ'] },
    { label: '雰囲気', options: ['和の雰囲気', '洋の雰囲気', 'こだわらない'] },
    { label: '予算', options: ['〜500円', '〜1,000円', '〜2,000円', '2,000円〜'] },
    { label: '行列の許容', options: ['並びたくない', '5分まで', '15分まで', '並んでもOK'] },
  ],
  souvenir: [
    { label: 'テイスト', options: ['和のもの', '洋のもの', 'こだわらない'] },
    { label: '種類', options: ['食べ物・お菓子', '工芸品・雑貨', 'どちらでも'] },
    { label: '味の傾向', options: ['甘い系', 'しょっぱい系', 'どちらでも'] },
    { label: '予算', options: ['〜500円', '〜1,000円', '〜3,000円', '3,000円〜'] },
    { label: '行列の許容', options: ['並びたくない', '5分まで', '15分まで', '並んでもOK'] },
  ],
};

/**
 * カテゴリ選択 → 質問ステップのアンケートフロー
 */
export function Survey({ onComplete, onCancel }: SurveyProps) {
  const [category, setCategory] = useState<ShopCategory | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  // カテゴリ未選択: カテゴリ選択画面
  if (!category) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-6 flex flex-col gap-6">
        <h2 className="text-lg font-bold text-gray-800 text-center">何を探していますか？</h2>
        <div className="flex flex-col gap-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className="w-full min-h-[56px] flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-5 text-base font-medium text-gray-700 hover:border-blue-400 hover:bg-blue-50 transition-colors shadow-sm"
            >
              <span className="text-2xl">{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>
        <button
          onClick={onCancel}
          className="text-sm text-gray-400 hover:text-gray-600 min-h-[44px]"
        >
          キャンセル
        </button>
      </div>
    );
  }

  const questions = QUESTIONS[category];
  // お土産で種類が「工芸品・雑貨」の場合は「味の傾向」質問をスキップ
  const filteredQuestions = category === 'souvenir' && answers[1] === '工芸品・雑貨'
    ? questions.filter((_, i) => i !== 2)
    : questions;

  const currentQuestion = filteredQuestions[step];
  const total = filteredQuestions.length;

  const handleAnswer = (option: string) => {
    const newAnswers = [...answers, option];
    if (step + 1 >= total) {
      onComplete({ category, answers: newAnswers });
    } else {
      setAnswers(newAnswers);
      setStep(step + 1);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 flex flex-col gap-6">
      {/* 進捗バー */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>質問 {step + 1} / {total}</span>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            キャンセル
          </button>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <h2 className="text-lg font-bold text-gray-800">{currentQuestion.label}</h2>

      <div className="flex flex-col gap-3">
        {currentQuestion.options.map((option) => (
          <button
            key={option}
            onClick={() => handleAnswer(option)}
            className="w-full min-h-[52px] bg-white border border-gray-200 rounded-xl px-5 text-base text-gray-700 hover:border-blue-400 hover:bg-blue-50 transition-colors shadow-sm text-left"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
