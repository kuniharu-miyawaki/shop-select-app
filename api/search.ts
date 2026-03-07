/** Vercel Function: APIキーを保護してAnthropicAPIを呼ぶ */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

/**
 * POST /api/search
 * body: { prompt: string }
 * response: { content: Anthropic.ContentBlock[] }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body as { prompt?: string };
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'promptが必要です' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'APIキーが設定されていません' });
  }

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      tools: [{ type: 'web_search_20250305' as const, name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }],
    });

    return res.status(200).json({ content: response.content });
  } catch (err) {
    console.error('Anthropic APIエラー:', err);
    const message = err instanceof Error ? err.message : '不明なエラー';
    return res.status(500).json({ error: message });
  }
}
