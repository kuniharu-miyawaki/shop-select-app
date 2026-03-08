/** Vercel Function: Google Places API + Anthropic APIで店舗を検索 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

interface SearchRequest {
  lat: number;
  lng: number;
  category: 'food' | 'cafe' | 'souvenir';
  answers: string[];
  excludedNames: string[];
  favoriteNames: string[];
}

interface PlaceResult {
  name: string;
  vicinity: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  place_id: string;
  geometry: { location: { lat: number; lng: number } };
  opening_hours?: { open_now: boolean };
  photos?: Array<{ photo_reference: string }>;
}

// 予算回答 → 許容price_level
const BUDGET_LEVELS: Record<string, number[]> = {
  'リーズナブル':   [0, 1],
  '普通':           [0, 1, 2, 3],
  '高くても良い':   [0, 1, 2, 3, 4],
};

interface PlacesResponse {
  results: PlaceResult[];
  status: string;
}

const CATEGORY_TYPE: Record<string, string> = {
  food: 'restaurant',
  cafe: 'cafe',
  souvenir: 'store',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { lat, lng, category, answers, excludedNames, favoriteNames } = req.body as SearchRequest;

  const googleKey = process.env.GOOGLE_PLACES_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!googleKey || !anthropicKey) {
    return res.status(500).json({ error: 'APIキーが設定されていません' });
  }

  try {
    // 1. Google Places Nearby Search で実在店舗を取得
    const type = CATEGORY_TYPE[category] ?? 'restaurant';
    const keyword = category === 'souvenir' ? 'お土産' : '';
    const placesUrl = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    placesUrl.searchParams.set('location', `${lat},${lng}`);
    placesUrl.searchParams.set('radius', '800');
    placesUrl.searchParams.set('type', type);
    placesUrl.searchParams.set('language', 'ja');
    placesUrl.searchParams.set('key', googleKey);
    if (keyword) placesUrl.searchParams.set('keyword', keyword);

    // まず営業中のみで検索
    placesUrl.searchParams.set('opennow', 'true');
    const openRes = await fetch(placesUrl.toString());
    const openData = await openRes.json() as PlacesResponse;

    // 営業中が0件の場合、opennowなしで再検索して候補の有無を確認
    if (!openData.results?.length) {
      placesUrl.searchParams.delete('opennow');
      const allRes = await fetch(placesUrl.toString());
      const allData = await allRes.json() as PlacesResponse;
      if (allData.results?.length) {
        return res.status(200).json({ shops: [], allClosed: true });
      }
      return res.status(200).json({ shops: [], allClosed: false });
    }

    const openResults = openData.results;

    // 予算によるprice_levelフィルタ
    const budgetAnswer = answers.find((a) => a in BUDGET_LEVELS);
    const allowedLevels = budgetAnswer ? BUDGET_LEVELS[budgetAnswer] : null;
    const priceFiltered = allowedLevels
      ? openResults.filter((p) => p.price_level === undefined || allowedLevels.includes(p.price_level))
      : openResults;

    // 5★お気に入り店舗が近くにあれば特別枠として抽出
    const favoriteSlotPlaces = priceFiltered.filter((p) =>
      favoriteNames.includes(p.name)
    );

    // 除外店舗・お気に入り特別枠を除いて取得
    const filtered = priceFiltered
      .filter((p) => !excludedNames.includes(p.name) && !favoriteNames.includes(p.name));

    // 人気・穴場の選好に応じて並び替え、最大12件をClaudeに渡す
    const popularityAnswer = answers.find((a) => ['人気店を選んで', '穴場・空いている店を選んで'].includes(a));
    const candidates = (() => {
      if (popularityAnswer === '人気店を選んで') {
        return filtered.sort((a, b) => (b.user_ratings_total ?? 0) - (a.user_ratings_total ?? 0)).slice(0, 12);
      } else if (popularityAnswer === '穴場・空いている店を選んで') {
        return filtered.sort((a, b) => (a.user_ratings_total ?? 9999) - (b.user_ratings_total ?? 9999)).slice(0, 12);
      } else {
        // どちらでも: ランダムにシャッフル（ワクワク感）
        return filtered.length > 5 ? filtered.sort(() => Math.random() - 0.5).slice(0, 12) : filtered;
      }
    })();

    if (!candidates.length) {
      return res.status(200).json({ shops: [] });
    }

    // 2. Claudeでユーザーの希望に合う店を選別・説明文生成
    const client = new Anthropic({ apiKey: anthropicKey });

    const candidateList = candidates
      .map((p) => `- ${p.name}（${p.vicinity}）評価: ${p.rating ?? 'なし'}`)
      .join('\n');

    const categoryLabel = category === 'food' ? 'レストラン' : category === 'cafe' ? 'カフェ' : 'お土産店';

    const prompt = `以下は実在する近隣の${categoryLabel}のリストです：
${candidateList}

ユーザーの希望: ${answers.join(' / ')}

上記リストの中からユーザーの希望に合う店を最大5件選んでください。
ただし、ファミリーレストラン（ガスト、デニーズ、サイゼリヤ、ジョナサン、バーミヤン等のチェーン系ファミレス）は除外してください。
以下のJSON配列形式のみで返答してください（余分なテキスト不要）:
[
  {
    "name": "店名（リストの店名をそのまま使用）",
    "cuisine": "ジャンル",
    "address": "住所（リストの住所をそのまま使用）",
    "rating": 評価数値,
    "reason": "おすすめ理由（1〜2文）",
    "mapsUrl": ""
  }
]`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((c) => c.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return res.status(200).json({ shops: [] });
    }

    const jsonMatch =
      textBlock.text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) ??
      textBlock.text.match(/(\[[\s\S]*\])/);

    if (!jsonMatch) {
      return res.status(200).json({ shops: [] });
    }

    const shops = JSON.parse(jsonMatch[1] ?? jsonMatch[0]) as Array<{ name: string; [key: string]: unknown }>;

    // Place Details で今日の営業時間を取得
    const todayIndex = new Date().getDay(); // 0=日, 1=月...6=土
    const weekdayIndex = todayIndex === 0 ? 6 : todayIndex - 1; // weekday_textは月曜=0

    const fetchHours = async (placeId: string): Promise<string | undefined> => {
      try {
        const detailUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
        detailUrl.searchParams.set('place_id', placeId);
        detailUrl.searchParams.set('fields', 'opening_hours');
        detailUrl.searchParams.set('language', 'ja');
        detailUrl.searchParams.set('key', googleKey);
        const r = await fetch(detailUrl.toString());
        const d = await r.json() as { result?: { opening_hours?: { weekday_text?: string[] } } };
        const text = d.result?.opening_hours?.weekday_text?.[weekdayIndex];
        return text ? text.replace(/^[^:]+:\s*/, '') : undefined;
      } catch {
        return undefined;
      }
    };

    // place_idのURL・座標・営業時間・写真・価格帯を付与
    const shopsWithUrls = await Promise.all(shops.map(async (shop) => {
      const place = candidates.find((p) => p.name === shop.name);
      const hours = place ? await fetchHours(place.place_id) : undefined;
      const photoRef = place?.photos?.[0]?.photo_reference;
      return {
        ...shop,
        mapsUrl: place
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.name)}&query_place_id=${place.place_id}`
          : `https://maps.google.com/maps?q=${encodeURIComponent(shop.name)}`,
        placeLat: place?.geometry.location.lat,
        placeLng: place?.geometry.location.lng,
        hours,
        photoUrl: photoRef ? `/api/photo?ref=${encodeURIComponent(photoRef)}` : undefined,
        priceLevel: place?.price_level,
      };
    }));

    // 特別枠を整形
    const favoriteSlot = favoriteSlotPlaces.map((p) => ({
      name: p.name,
      cuisine: '',
      address: p.vicinity,
      rating: p.rating ?? 0,
      reason: '以前★5をつけたお気に入りのお店です',
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}&query_place_id=${p.place_id}`,
      distanceM: undefined as number | undefined,
      placeLat: p.geometry.location.lat,
      placeLng: p.geometry.location.lng,
    }));

    return res.status(200).json({ shops: shopsWithUrls, favoriteSlot });
  } catch (err) {
    console.error('エラー:', err);
    const message = err instanceof Error ? err.message : '不明なエラー';
    return res.status(500).json({ error: message });
  }
}
