/** Vercel Function: Google Places写真プロキシ */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ref, maxwidth = '400' } = req.query as { ref?: string; maxwidth?: string };
  const key = process.env.GOOGLE_PLACES_API_KEY;

  if (!ref || !key) {
    return res.status(400).json({ error: 'invalid request' });
  }

  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photo_reference=${ref}&key=${key}`;
  const photoRes = await fetch(url);
  const buffer = await photoRes.arrayBuffer();

  res.setHeader('Content-Type', photoRes.headers.get('content-type') ?? 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(Buffer.from(buffer));
}
