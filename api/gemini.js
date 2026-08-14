// SAVEONE Gemini proxy — API kaliti faqat serverda saqlanadi.
// Vercel env: GEMINI_API_KEY

const ALLOWED_MODELS = new Set([
  'gemini-2.0-flash',
  'gemini-2.0-flash-thinking-exp',
]);

const MAX_BODY_BYTES = 32 * 1024;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 1000;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const bucket = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  bucket.push(now);
  hits.set(ip, bucket);
  if (hits.size > 5000) hits.clear();
  return bucket.length > RATE_LIMIT;
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // curl / server-side chaqiruvlar
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  if (!sameOrigin(req)) {
    return res.status(403).json({ error: { message: 'Forbidden origin' } });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'GEMINI_API_KEY sozlanmagan' } });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ error: { message: 'Juda ko\'p so\'rov. Biroz kutib turing.' } });
  }

  const payload = typeof req.body === 'string' ? safeParse(req.body) : req.body;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: { message: 'JSON body kutilgan' } });
  }

  const { model, ...body } = payload;
  if (!ALLOWED_MODELS.has(model)) {
    return res.status(400).json({ error: { message: 'Ruxsat etilmagan model' } });
  }
  if (Buffer.byteLength(JSON.stringify(body)) > MAX_BODY_BYTES) {
    return res.status(413).json({ error: { message: 'So\'rov juda katta' } });
  }

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
      }
    );
    const data = await upstream.json().catch(() => ({}));
    res.setHeader('Cache-Control', 'no-store');
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: { message: 'Upstream xatosi' } });
  }
};

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
