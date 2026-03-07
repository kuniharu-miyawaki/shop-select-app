/** 店舗検索フック（/api/search 経由でAnthropicAPIを呼ぶ） */
import { useState } from 'react';
import type { Shop, SurveyAnswers, Location } from '../types';

interface UseSearchReturn {
  shops: Shop[];
  loading: boolean;
  error: string | null;
  search: (answers: SurveyAnswers, location: Location, excludedNames: string[]) => Promise<void>;
}

/**
 * アンケート回答と現在地からAIが店舗を検索するフック
 */
export function useSearch(): UseSearchReturn {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * プロンプト文字列を生成する
   */
  const buildPrompt = (
    answers: SurveyAnswers,
    location: Location,
    excludedNames: string[]
  ): string => {
    const categoryLabel =
      answers.category === 'food' ? 'レストラン・食事店'
      : answers.category === 'cafe' ? 'カフェ・喫茶店'
      : 'お土産店';

    const now = new Date().toLocaleString('ja-JP');
    const exclusion = excludedNames.length > 0
      ? `\n除外店舗（表示しないこと）: ${excludedNames.join('、')}`
      : '';

    return `現在時刻: ${now}
現在地: 緯度${location.lat}, 経度${location.lng}（徒歩10分圏内で探してください）
カテゴリ: ${categoryLabel}
希望条件: ${answers.answers.join(' / ')}${exclusion}

上記の条件に合う${categoryLabel}を最大5件提案してください。
必ず実在する店舗のみを挙げ、以下のJSON配列形式のみで返答してください（余分なテキスト不要）:

[
  {
    "name": "店名",
    "cuisine": "ジャンル",
    "address": "住所",
    "rating": 4.2,
    "reason": "おすすめ理由（1〜2文）",
    "mapsUrl": "https://maps.google.com/maps?q=店名+住所"
  }
]`;
  };

  /**
   * 店舗を検索する
   */
  const search = async (
    answers: SurveyAnswers,
    location: Location,
    excludedNames: string[]
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    setShops([]);

    try {
      const prompt = buildPrompt(answers, location, excludedNames);

      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error(`APIエラー: ${res.status}`);
      }

      const data = await res.json() as { content: Array<{ type: string; text?: string }> };

      // textブロックからJSONを抽出
      const textBlock = data.content.find((c) => c.type === 'text');
      if (!textBlock?.text) {
        throw new Error('レスポンスにテキストが含まれていません');
      }

      const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('JSONの抽出に失敗しました');
      }

      const parsed = JSON.parse(jsonMatch[0]) as Shop[];

      // Googleレーティング降順ソート
      const sorted = parsed.sort((a, b) => b.rating - a.rating);
      setShops(sorted.slice(0, 5));
    } catch (err) {
      const message = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return { shops, loading, error, search };
}
