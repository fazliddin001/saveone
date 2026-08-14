// ═══════════════════════════════════════════════════════
// SAVEONE UI UTILS — sahifalar o'rtasida takrorlanadigan
// DOM, xavf ranglari, toast, ro'yxat va navbar kodi.
// ═══════════════════════════════════════════════════════

const UI = (() => {
  const $ = (id) => document.getElementById(id);

  // ── Xavf darajasi → CSS klass va ranglar ──
  const RISK_CLASS = { HIGH: 'danger', MEDIUM: 'warn', LOW: 'safe', UNKNOWN: 'warn' };
  const RISK_COLORS = {
    danger: { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', text: 'var(--danger)' },
    warn:   { bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)',  text: 'var(--warn)' },
    safe:   { bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)',  text: 'var(--safe)' },
  };

  const riskClass = (risk) => RISK_CLASS[String(risk || '').toUpperCase()] || 'warn';
  const riskColors = (cls) => RISK_COLORS[cls] || RISK_COLORS.warn;

  // ── Toast (#ai-toast) ──
  let _toastTimer = null;
  function toast(html, duration = 3000) {
    const el = $('ai-toast');
    if (!el) return;
    clearTimeout(_toastTimer);
    el.innerHTML = html;
    el.classList.add('show');
    if (duration > 0) {
      _toastTimer = setTimeout(() => el.classList.remove('show'), duration);
    }
  }
  const hideToast = () => { clearTimeout(_toastTimer); $('ai-toast')?.classList.remove('show'); };
  const toastText = (text, duration) => toast(`<div style="color:var(--text)">${text}</div>`, duration);

  // ── Aylanuvchi ikonka (yuklanish) ──
  const spinIcon = (char = '⟳') =>
    `<span style="animation:spin 0.8s linear infinite;display:inline-block">${char}</span>`;

  // ── Vaqt formati ──
  function formatTime(withSeconds = false) {
    const opts = { hour: '2-digit', minute: '2-digit' };
    if (withSeconds) opts.second = '2-digit';
    return new Date().toLocaleTimeString('uz-UZ', opts);
  }

  // ── Ro'yxatni shablon bilan chizish ──
  function renderList(target, items, template) {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    el.innerHTML = (items || []).map(template).join('');
  }

  // ── Raqamli hisoblagich animatsiyasi ──
  function countUp(target, value, duration = 1500) {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    const step = value / 60;
    let current = 0;
    const id = setInterval(() => {
      current += step;
      if (current >= value) { current = value; clearInterval(id); }
      el.textContent = Math.floor(current).toLocaleString();
    }, duration / 60);
  }

  // ── Topnav ──
  const NAV_LINKS = [
    { key: 'index',     href: 'index.html',           label: 'Tekshirish' },
    { key: 'dashboard', href: 'dashboard.html',       label: 'Dashboard' },
    { key: 'ai',        href: 'ai-assistant.html',    label: 'AI Chat' },
    { key: 'himoya',    href: 'call-protection.html', label: 'Himoya' },
    { key: 'talim',     href: 'education.html',       label: "Ta'lim" },
  ];

  function renderNav({ active, links = NAV_LINKS, actions = '', user = true } = {}) {
    const nav = $('topnav');
    if (!nav) return;
    nav.innerHTML = `
      <a href="index.html" class="logo"><div class="logo-ring">⚡</div><span>SAVE</span>ONE</a>
      <div class="nav-links">
        ${links.map(l =>
          `<a href="${l.href}"${(l.key || l.href) === active ? ' class="active"' : ''}>${l.label}</a>`
        ).join('')}
      </div>
      ${user || actions ? `<div class="nav-right">
        ${user ? `<div id="navUser"${actions ? ' style="margin-right:8px"' : ''}></div>` : ''}
        ${actions}
      </div>` : ''}`;
  }

  return {
    $, riskClass, riskColors, toast, toastText, hideToast, spinIcon,
    formatTime, renderList, countUp, renderNav, NAV_LINKS,
  };
})();

window.UI = UI;
