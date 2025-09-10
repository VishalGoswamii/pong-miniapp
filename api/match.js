import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let body;
  try { body = req.body || (await new Promise(r => {
    let d = ''; req.on('data', c => d += c); req.on('end', () => r(d));
  }), JSON.parse(body)); } catch (_) { body = null; }
  if (!body || !body.peerId) return res.status(400).json({ error: 'peerId required' });

  const self = { peerId: body.peerId, user: body.user || null, ts: Date.now() };
  const key = 'pong:waiting';

  const waiting = await kv.get(key);
  if (waiting && waiting.peerId && waiting.peerId !== self.peerId) {
    await kv.del(key);
    return res.status(200).json({ opponentPeerId: waiting.peerId, opponentUser: waiting.user || null });
    }
  await kv.set(key, self, { ex: 120 });
  return res.status(200).json({ wait: true });
}
