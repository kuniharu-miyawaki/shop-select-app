/** Vercel Function: Google Places API + Anthropic APIで店舗を検索 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

interface SearchRequest {
  lat: number;
  lng: number;
  category: 'food' | 'cafe' | 'souvenir';
  answers: string[];
  excludedNames: string[];
}

interface PlaceResult {
  name: string;
  vicinity: string;
  rating?: number;
  place_id: string;
  geometry: { location: { lat: number; lng: number } };
}

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

  const { lat, lng, category, answers, excludedNames } = req.body as SearchRequest;

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

    const placesRes = await fetch(placesUrl.toString());
    const placesData = await placesRes.json() as PlacesResponse;

    if (!placesData.results?.length) {
      return res.status(200).json({ shops: [] });
    }

    // 除外店舗を除いて最大20件
    const candidates = placesData.results
      .filter((p) => !excludedNames.includes(p.name))
      .slice(0, 20);

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

上記リストの中からユーザーの希望に合う店を最大5件選び、以下のJSON配列形式のみで返答してください（余分なテキスト不要）:
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

    // place_idのURL・座標を付与
    const shopsWithUrls = shops.map((shop) => {
      const place = candidates.find((p) => p.name === shop.name);
      return {
        ...shop,
        mapsUrl: place
          ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
          : `https://maps.google.com/maps?q=${encodeURIComponent(shop.name)}`,
        placeLat: place?.geometry.location.lat,
        placeLng: place?.geometry.location.lng,
      };
    });

    return res.status(200).json({ shops: shopsWithUrls });
  } catch (err) {
    console.error('エラー:', err);
    const message = err instanceof Error ? err.message : '不明なエラー';
    return res.status(500).json({ error: message });
  }
}
