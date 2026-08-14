// ── SAVEONE umumiy xavfsizlik yordamchilari ──
// HTML escaping + Gemini proxy chaqiruvi (API kalit brauzerda saqlanmaydi).

(function () {
  const ESCAPES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  // Ishonchsiz matnni innerHTML ichida ishlatishdan oldin tozalash
  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
  }

  // Gemini so'rovi — server tomonidagi /api/gemini proxy orqali
  async function geminiRequest(model, body) {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, ...body }),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  }

  window.escapeHtml = escapeHtml;
  window.geminiRequest = geminiRequest;
})();
