// ═══════════════════════════════════════════════════════
// SAVEONE AI NAVIGATOR — AI saytni boshqaradi
// Gemini bilan o'ylaydi, sahifalar bo'ylab yo'llaydi,
// xatolarni o'zi tuzatadi, foydalanuvchini himoya qiladi.
// ═══════════════════════════════════════════════════════

const AINavi = (() => {
  // ── Ichki holat ──
  let _thinking = false;
  let _healTimer = null;
  let _barVisible = true;
  let _sessionContext = [];
  let _errorCount = 0;

  // ── Sahifalar xaritasi ──
  const PAGES = {
    'index':      { file:'index.html',          label:'Bosh sahifa',     emoji:'🏠' },
    'dashboard':  { file:'dashboard.html',       label:'Dashboard',       emoji:'📊' },
    'ai':         { file:'ai-assistant.html',    label:'AI Yordamchi',    emoji:'🤖' },
    'himoya':     { file:'call-protection.html', label:'Qo\'ng\'iroq Himoya', emoji:'🛡️' },
    'talim':      { file:'education.html',       label:'Ta\'lim Markazi', emoji:'📚' },
    'kirish':     { file:'auth.html',            label:'Kirish',          emoji:'🔑' },
  };

  // ── System Prompt — AI ning "ongi" ──
  const SYSTEM = `Sen SAVEONE platformasining AI navigatori va yordamchisisan. O'zbek tilida javob ber.

MUHIM: Har javobingni JSON formatida ber:
{
  "think": "o'z-o'zingcha fikrlash jarayoni (foydalanuvchiga ko'rinmaydi)",
  "reply": "foydalanuvchiga ko'rsatiladigan qisqa javob (1-2 jumlat)",
  "action": "navigate | scroll | none",
  "target": "sahifa nomi yoki scroll target (action=navigate uchun: index/dashboard/ai/himoya/talim/kirish)",
  "confidence": 0.0-1.0
}

Kontekst:
- Siz SAVEONE — O'zbekiston uchun AI xavfsizlik platformasi
- Sahifalar: index (bosh), dashboard, ai-assistant, call-protection (himoya), education (talim), auth (kirish)
- Foydalanuvchi xavfsizlik maslahat so'rasa — qisqa, aniq javob ber
- Sahifaga o'tish so'rasa — action: navigate
- "dashboard ko'rsat", "ta'lim bosh" kabi so'zlarda ham navigate ishla
- Har doim issiq, do'stona, professional ton saqlang
- Xato bo'lsa, "Bir daqiqa, tuzatyapman..." de va qayta urining`;

  // ── DOM elementlari ──
  const getEl = UI.$;

  // ── Sahifalar o'rtasida smooth transition ──
  function navigateTo(page) {
    const info = PAGES[page];
    if (!info) return;

    const overlay = getEl('page-transition');
    if (overlay) {
      overlay.style.transition = 'opacity 0.3s ease';
      overlay.classList.add('active');
      setTimeout(() => {
        window.location.href = info.file;
      }, 320);
    } else {
      window.location.href = info.file;
    }
  }

  // ── AI fikr ko'rsatish (thinking animation) ──
  function showThinking(text) {
    UI.toast(
      `<div class="ai-think">${UI.spinIcon('⚙️')} ${text || 'O\'ylayapman...'}</div>`,
      0
    );
  }

  // ── AI javob ko'rsatish ──
  function showReply(thinkText, replyText) {
    UI.toast(`
      ${thinkText ? `<div class="ai-think"><span>💭</span> ${thinkText}</div>` : ''}
      <div style="color:var(--text)">${replyText}</div>
    `, 5000);
  }

  // ── Self-healing banner ──
  function showHeal(msg) {
    const banner = getEl('heal-banner');
    if (!banner) return;
    clearTimeout(_healTimer);
    banner.innerHTML = `⚠️ <span>${msg}</span>`;
    banner.classList.add('show');
    _healTimer = setTimeout(() => banner.classList.remove('show'), 6000);
  }

  // ── Xatoni o'zi tuzatish ──
  async function selfHeal(error, originalQuery) {
    _errorCount++;
    if (_errorCount > 3) {
      showHeal('API bilan bog\'lanishda muammo. Internetni tekshiring.');
      _errorCount = 0;
      return;
    }

    showHeal(`Xatolik aniqlandi. Qayta urinilmoqda... (${_errorCount}/3)`);

    // 1.5 soniyadan keyin qayta urinish
    await new Promise(r => setTimeout(r, 1500));
    return askAI(originalQuery, true); // retry=true
  }

  // ── Gemini API chaqiruvi ──
  async function callGemini(userMsg, isRetry = false) {
    // Kontekstni saqlab borish (oxirgi 6 ta)
    _sessionContext.push({ role: 'user', parts: [{ text: userMsg }] });
    if (_sessionContext.length > 6) _sessionContext = _sessionContext.slice(-6);

    const { ok, raw, error } = await Gemini.generate({
      system: SYSTEM,
      contents: _sessionContext,
      temperature: 0.7,
      maxOutputTokens: 300,
    });

    if (!ok) throw new Error(error);

    const rawText = raw || '{}';
    const parsed = Gemini.parseJSON(rawText, { think: '', reply: rawText, action: 'none', confidence: 0.8 });

    // Model javobini kontekstga qo'shish
    _sessionContext.push({ role: 'model', parts: [{ text: rawText }] });

    return parsed;
  }

  // ── Asosiy AI so'rov funksiyasi ──
  async function askAI(query, isRetry = false) {
    if (_thinking) return;
    _thinking = true;

    const input = getEl('ai-input');
    if (input) { input.value = ''; input.disabled = true; }

    showThinking('Tahlil qilyapman...');

    try {
      const result = await callGemini(query, isRetry);
      _errorCount = 0; // muvaffaqiyat — errorCount ni reset

      // fikrlash jarayonini ko'rsat (qisqartirilgan)
      const thinkPreview = result.think
        ? result.think.substring(0, 60) + (result.think.length > 60 ? '...' : '')
        : '';

      showReply(thinkPreview, result.reply || 'Tushundim!');

      // Harakat bajarish
      if (result.action === 'navigate' && result.target) {
        setTimeout(() => navigateTo(result.target), 1200);
      } else if (result.action === 'scroll' && result.target) {
        const el = document.getElementById(result.target) || document.querySelector(result.target);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

    } catch (err) {
      console.warn('SAVEONE AI xato:', err.message);
      await selfHeal(err.message, query);
    } finally {
      _thinking = false;
      if (input) input.disabled = false;
    }
  }

  // ── AI bar'ni ko'rsatish/yashirish ──
  function toggleBar() {
    const bar = getEl('ai-bar');
    if (!bar) return;
    _barVisible = !_barVisible;
    if (_barVisible) {
      bar.classList.remove('hidden');
    } else {
      bar.classList.add('hidden');
    }
    // Toggle tugmasi matnini yangilash
    const btn = bar.querySelector('.ai-bar-toggle');
    if (btn) btn.innerHTML = _barVisible ? '✕ Yopish' : '🤖 AI Yordamchi';
  }

  // ── AI bar HTML yasash ──
  function createAIBar() {
    // Transition overlay
    if (!getEl('page-transition')) {
      const overlay = document.createElement('div');
      overlay.id = 'page-transition';
      document.body.appendChild(overlay);
    }

    // Heal banner
    if (!getEl('heal-banner')) {
      const banner = document.createElement('div');
      banner.id = 'heal-banner';
      banner.innerHTML = '⚠️ <span></span>';
      document.body.appendChild(banner);
    }

    // AI Toast
    if (!getEl('ai-toast')) {
      const toast = document.createElement('div');
      toast.id = 'ai-toast';
      document.body.appendChild(toast);
    }

    // AI Bar
    if (!getEl('ai-bar')) {
      const bar = document.createElement('div');
      bar.id = 'ai-bar';
      bar.innerHTML = `
        <button class="ai-bar-toggle" onclick="AINavi.toggle()">✕ Yopish</button>
        <div class="ai-bar-inner">
          <div class="ai-bar-icon">🤖</div>
          <input id="ai-input" type="text"
            placeholder="AI ga so'rang: sahifaga o'ting, raqam tekshiring, maslahat bering..."
            autocomplete="off" spellcheck="false" />
          <button class="ai-bar-send" onclick="AINavi.ask()" title="Yuborish">
            <svg viewBox="0 0 24 24"><path d="M2 21L23 12 2 3V10L17 12 2 14V21Z"/></svg>
          </button>
        </div>
      `;
      document.body.appendChild(bar);

      // Enter tugmasi
      const input = getEl('ai-input');
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            AINavi.ask();
          }
        });
      }
    }
  }

  // ── Tezkor buyruqlar ──
  const QUICK_CMDS = {
    'dashboard': () => navigateTo('dashboard'),
    'bosh sahifa': () => navigateTo('index'),
    'ai chat': () => navigateTo('ai'),
    'himoya': () => navigateTo('himoya'),
    "ta'lim": () => navigateTo('talim'),
    'kirish': () => navigateTo('kirish'),
    'logout': () => { if (typeof Auth !== 'undefined') Auth.logout(); },
  };

  // ── Ishga tushirish ──
  function init() {
    document.addEventListener('DOMContentLoaded', () => {
      createAIBar();

      // Sahifa kirish animatsiyasi
      const overlay = getEl('page-transition');
      if (overlay) {
        overlay.classList.add('active');
        setTimeout(() => {
          overlay.style.transition = 'opacity 0.4s ease';
          overlay.classList.remove('active');
        }, 50);
      }

      // Keyboard shortcut: Ctrl+Space → AI bar ga focus
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
          e.preventDefault();
          const input = getEl('ai-input');
          if (input) {
            if (!_barVisible) toggleBar();
            input.focus();
          }
        }
      });
    });
  }

  init();

  // ── Public API ──
  return {
    ask() {
      const input = getEl('ai-input');
      const query = input?.value?.trim();
      if (!query) return;

      // Tezkor buyruqlarni tekshirish
      const lower = query.toLowerCase();
      for (const [cmd, fn] of Object.entries(QUICK_CMDS)) {
        if (lower.includes(cmd)) {
          fn();
          return;
        }
      }

      askAI(query);
    },
    navigate: navigateTo,
    toggle: toggleBar,
    heal: showHeal,
  };
})();

// Global'ga chiqarish
window.AINavi = AINavi;
