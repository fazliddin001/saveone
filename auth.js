// ── SAVEONE AUTH SYSTEM ──
// DIQQAT: bu faqat demo (localStorage). Haqiqiy autentifikatsiya server
// tomonida bo'lishi shart — brauzerdagi tekshiruvlarni foydalanuvchi
// o'zgartira oladi. Keyinchalik Supabase bilan almashtiriladi.

const PBKDF2_ITERATIONS = 150000;

function _bufToHex(buf) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function _randomSaltHex() {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return _bufToHex(salt);
}

// Parol xeshi — PBKDF2-SHA256 (btoa() qaytarib ochiladigan kodlash edi)
async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const salt = Uint8Array.from(saltHex.match(/.{2}/g).map(h => parseInt(h, 16)));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  return _bufToHex(bits);
}

// Vaqt bo'yicha barqaror taqqoslash
function _safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Sessiyaga faqat maxfiy bo'lmagan maydonlar yoziladi
function _publicUser(user) {
  const { passwordHash, salt, ...rest } = user;
  return rest;
}

const Auth = {
  // Foydalanuvchini olish
  getUser() {
    const u = localStorage.getItem('saveone_user');
    return u ? JSON.parse(u) : null;
  },

  // Kirish tekshirish
  isLoggedIn() {
    return !!this.getUser();
  },

  // Ro'yxatdan o'tish
  async register(name, email, password) {
    name = String(name).trim().slice(0, 60);
    email = String(email).trim().toLowerCase().slice(0, 254);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return { ok: false, error: 'Email formati noto\'g\'ri' };
    }
    if (!name) return { ok: false, error: 'Ismni kiriting' };
    if (typeof password !== 'string' || password.length < 8 || password.length > 200) {
      return { ok: false, error: 'Parol 8 va 200 belgi orasida bo\'lishi kerak' };
    }

    const users = JSON.parse(localStorage.getItem('saveone_users') || '[]');
    if (users.find(u => u.email === email)) {
      return { ok: false, error: 'Bu email allaqachon ro\'yxatdan o\'tgan' };
    }
    const salt = _randomSaltHex();
    const user = {
      id: crypto.randomUUID(),
      name, email,
      salt,
      passwordHash: await hashPassword(password, salt),
      joinedAt: new Date().toISOString(),
      points: 0,
      checksCount: 0,
      modulesCompleted: 0,
      avatar: name.charAt(0).toUpperCase(),
    };
    users.push(user);
    localStorage.setItem('saveone_users', JSON.stringify(users));
    localStorage.setItem('saveone_user', JSON.stringify(_publicUser(user)));
    return { ok: true, user: _publicUser(user) };
  },

  // Kirish
  async login(email, password) {
    email = String(email).trim().toLowerCase();
    const users = JSON.parse(localStorage.getItem('saveone_users') || '[]');
    const user = users.find(u => u.email === email);
    const generic = { ok: false, error: 'Email yoki parol noto\'g\'ri' };
    if (!user || !user.salt || typeof password !== 'string') return generic;
    const hash = await hashPassword(password, user.salt);
    if (!_safeEqual(hash, user.passwordHash || '')) return generic;
    localStorage.setItem('saveone_user', JSON.stringify(_publicUser(user)));
    return { ok: true, user: _publicUser(user) };
  },

  // Chiqish
  logout() {
    localStorage.removeItem('saveone_user');
    window.location.href = 'index.html';
  },

  // Foydalanuvchini yangilash
  updateUser(updates) {
    const user = this.getUser();
    if (!user) return;
    const { passwordHash, salt, ...safeUpdates } = updates || {};
    const updated = { ..._publicUser(user), ...safeUpdates };
    localStorage.setItem('saveone_user', JSON.stringify(updated));
    // users arrayni ham yangilash (parol xeshi saqlanib qoladi)
    const users = JSON.parse(localStorage.getItem('saveone_users') || '[]');
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...safeUpdates };
      localStorage.setItem('saveone_users', JSON.stringify(users));
    }
    return updated;
  },

  // Ball qo'shish
  addPoints(pts) {
    const user = this.getUser();
    if (!user) return;
    return this.updateUser({ points: (user.points || 0) + pts });
  },

  // Tekshirishlar sonini oshirish
  addCheck() {
    const user = this.getUser();
    if (!user) return;
    return this.updateUser({ checksCount: (user.checksCount || 0) + 1 });
  },

  // Sahifani himoya qilish (login bo'lmasa auth.html ga yuborish)
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'auth.html?redirect=' + encodeURIComponent(window.location.pathname);
    }
    return this.getUser();
  },
};

// Navbarda foydalanuvchi ma'lumotlarini ko'rsatish
function renderNavUser() {
  const user = Auth.getUser();
  const container = document.getElementById('navUser');
  if (!container) return;

  if (user) {
    const name = escapeHtml(user.name);
    const avatar = escapeHtml(user.avatar);
    const points = Number(user.points) || 0;
    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <div style="
          width:32px;height:32px;border-radius:9px;
          background:linear-gradient(135deg,var(--p2),var(--p1));
          display:flex;align-items:center;justify-content:center;
          font-size:0.85rem;font-weight:700;color:#fff;
          box-shadow:0 0 12px rgba(168,85,247,0.35)
        ">${avatar}</div>
        <div>
          <div style="font-size:0.82rem;font-weight:600">${name}</div>
          <div style="font-size:0.7rem;color:var(--p1)">⭐ ${points} ball</div>
        </div>
        <button onclick="Auth.logout()" style="
          background:none;border:1px solid var(--border);color:var(--muted);
          padding:4px 10px;border-radius:7px;font-size:0.75rem;cursor:pointer;
          font-family:'DM Sans';transition:all 0.2s;margin-left:4px;
        " onmouseover="this.style.borderColor='var(--p1)';this.style.color='var(--p3)'"
           onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">Chiqish</button>
      </div>`;
  } else {
    container.innerHTML = `
      <div style="display:flex;gap:8px">
        <a href="auth.html" style="
          border:1px solid var(--border);color:var(--muted);
          padding:5px 14px;border-radius:8px;font-size:0.82rem;
          text-decoration:none;transition:all 0.2s;font-weight:500;
        " onmouseover="this.style.borderColor='var(--p1)';this.style.color='var(--p3)'"
           onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">Kirish</a>
        <a href="auth.html?tab=register" class="btn-nav">Ro'yxat →</a>
      </div>`;
  }
}

document.addEventListener('DOMContentLoaded', renderNavUser);
