# SAVEONE 🛡️

**O'zbekiston raqamli xavfsizlik platformasi**

AI yordamida scam, phishing va telefon firibgarligidan himoya.

## Sahifalar
- `index.html` — Bosh sahifa + AI raqam tekshiruvi
- `dashboard.html` — Shaxsiy xavfsizlik paneli
- `ai-assistant.html` — AI yordamchi (Gemini + Thinking)
- `call-protection.html` — Qo'ng'iroq himoyasi simulatori
- `education.html` — Ta'lim markazi + Quiz
- `auth.html` — Kirish / Ro'yxat

## Texnologiyalar
- Gemini 2.0 Flash / Flash Thinking API
- Glassmorphism + Space Grotesk dizayn
- AI Navigator — saytni AI boshqaradi
- Self-healing error handling
- Smooth page transitions

## Deploy
Vercel orqali deploy qiling (`api/gemini.js` serverless funksiya bo'lgani uchun
statik-only hosting, masalan GitHub Pages, ishlamaydi).

### Sozlash
1. Google AI Studio'da Gemini API kaliti oling.
2. Vercel → Project Settings → Environment Variables → `GEMINI_API_KEY`.
3. Lokal ishlab chiqishda: `.env.example` dan `.env` yasab, `vercel dev` ishlatiladi.

## Xavfsizlik
- API kaliti faqat serverda (`api/gemini.js`) ishlatiladi; brauzer `/api/gemini`
  proxy'siga murojaat qiladi. Kalitni HTML/JS ichiga yozish taqiqlanadi.
- Foydalanuvchi yoki AI qaytargan matn `innerHTML` ichiga faqat `escapeHtml()`
  (`security.js`) orqali qo'yiladi.
- `auth.js` — demo autentifikatsiya (localStorage, PBKDF2 xesh). Bu **server
  tomonidagi** autentifikatsiya o'rnini bosmaydi; ishlab chiqarish uchun
  Supabase yoki shunga o'xshash backend kerak.
