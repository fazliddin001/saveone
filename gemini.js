// ═══════════════════════════════════════════════════════
// SAVEONE GEMINI CLIENT — barcha sahifalar uchun umumiy
// API kaliti, so'rov qurish va JSON javobni ajratish
// shu yerda bir joyda saqlanadi.
// ═══════════════════════════════════════════════════════

const Gemini = (() => {
  const API_KEY = 'AIzaSyCgJGT--Dv104gEYZ8tY8Ed6UzS5wgEtxs';
  const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

  const MODELS = {
    flash: 'gemini-2.0-flash',
    thinking: 'gemini-2.0-flash-thinking-exp',
  };

  // So'rov yuborish. Xato tashlamaydi — { ok, raw, error } qaytaradi.
  async function generate({
    model = MODELS.flash,
    system,
    prompt,
    contents,
    temperature = 0.7,
    maxOutputTokens = 400,
    json = true,
  } = {}) {
    const body = {
      contents: contents || [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens },
    };
    if (json) body.generationConfig.responseMimeType = 'application/json';
    if (system) body.system_instruction = { parts: [{ text: system }] };

    let res, data;
    try {
      res = await fetch(`${BASE_URL}/${model}:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      data = await res.json().catch(() => ({}));
    } catch (err) {
      return { ok: false, raw: '', error: err.message || 'Tarmoq xatosi' };
    }

    if (!res.ok) {
      return {
        ok: false,
        raw: '',
        status: res.status,
        error: data?.error?.message || `HTTP ${res.status}`,
      };
    }

    const raw = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
    return { ok: true, raw };
  }

  // Model javobidan JSON ajratish (matn orasidagi JSON blok ham qo'llanadi)
  function parseJSON(raw, fallback = {}) {
    if (raw) {
      try { return JSON.parse(raw); } catch { /* pastdagi regex bilan urinamiz */ }
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch { /* fallback */ }
      }
    }
    return { ...fallback };
  }

  return { MODELS, generate, parseJSON };
})();

window.Gemini = Gemini;
