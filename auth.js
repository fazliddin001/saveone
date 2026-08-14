// ── SAVEONE AUTH SYSTEM ──
// localStorage asosida ishlaydi (demo uchun)
// Keyinchalik Supabase bilan almashtiriladi

const STORAGE = { user: 'saveone_user', users: 'saveone_users' };
const STORAGE_ERROR = 'Brauzer xotirasi ishlamayapti — ma\'lumot saqlanmadi';

// localStorage'dan JSON o'qish. Buzilgan yoki o'qilmaydigan qiymat
// butun sahifani sindirmasligi kerak — log yozib fallback qaytaramiz.
function readJSON(key, fallback) {
  let raw;
  try {
    raw = localStorage.getItem(key);
  } catch (err) {
    console.error(`SAVEONE: localStorage o'qilmadi (${key}):`, err);
    return fallback;
  }
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(`SAVEONE: buzilgan ma'lumot tozalandi (${key}):`, err);
    try { localStorage.removeItem(key); } catch (rmErr) { console.error('SAVEONE: tozalash xatosi:', rmErr); }
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (err) {
    console.error(`SAVEONE: localStorage yozilmadi (${key}):`, err);
    return { ok: false, error: STORAGE_ERROR };
  }
}

function readUsers() {
  const users = readJSON(STORAGE.users, []);
  return Array.isArray(users) ? users : [];
}

const Auth = {
  // Foydalanuvchini olish
  getUser() {
    const u = readJSON(STORAGE.user, null);
    return u && typeof u === 'object' ? u : null;
  },

  // Kirish tekshirish
  isLoggedIn() {
    return !!this.getUser();
  },

  // Ro'yxatdan o'tish
  register(name, email, password) {
    const users = readUsers();
    if (users.find(u => u.email === email)) {
      return { ok: false, error: 'Bu email allaqachon ro\'yxatdan o\'tgan' };
    }
    let encoded;
    try {
      encoded = btoa(password);
    } catch (err) {
      console.error('SAVEONE: parolni kodlash xatosi:', err);
      return { ok: false, error: 'Parolda qo\'llab-quvvatlanmaydigan belgilar bor' };
    }
    const user = {
      id: Date.now().toString(),
      name, email,
      password: encoded, // demo uchun oddiy encoding
      joinedAt: new Date().toISOString(),
      points: 0,
      checksCount: 0,
      modulesCompleted: 0,
      avatar: name.charAt(0).toUpperCase(),
    };
    users.push(user);
    const usersWrite = writeJSON(STORAGE.users, users);
    if (!usersWrite.ok) return usersWrite;
    const sessionWrite = writeJSON(STORAGE.user, user);
    if (!sessionWrite.ok) return sessionWrite;
    return { ok: true, user };
  },

  // Kirish
  login(email, password) {
    const users = readUsers();
    let encoded;
    try {
      encoded = btoa(password);
    } catch (err) {
      console.error('SAVEONE: parolni kodlash xatosi:', err);
      return { ok: false, error: 'Parolda qo\'llab-quvvatlanmaydigan belgilar bor' };
    }
    const user = users.find(u => u.email === email && u.password === encoded);
    if (!user) return { ok: false, error: 'Email yoki parol noto\'g\'ri' };
    const sessionWrite = writeJSON(STORAGE.user, user);
    if (!sessionWrite.ok) return sessionWrite;
    return { ok: true, user };
  },

  // Chiqish
  logout() {
    try {
      localStorage.removeItem(STORAGE.user);
    } catch (err) {
      console.error('SAVEONE: sessiyani tozalash xatosi:', err);
    }
    window.location.href = 'index.html';
  },

  // Foydalanuvchini yangilash
  updateUser(updates) {
    const user = this.getUser();
    if (!user) return { ok: false, error: 'Foydalanuvchi tizimga kirmagan' };
    const updated = { ...user, ...updates };
    const sessionWrite = writeJSON(STORAGE.user, updated);
    if (!sessionWrite.ok) return sessionWrite;
    // users arrayni ham yangilash
    const users = readUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = updated;
      const usersWrite = writeJSON(STORAGE.users, users);
      if (!usersWrite.ok) return usersWrite;
    }
    return { ok: true, user: updated };
  },

  // Ball qo'shish
  addPoints(pts) {
    const user = this.getUser();
    if (!user) return { ok: false, error: 'Foydalanuvchi tizimga kirmagan' };
    return this.updateUser({ points: (user.points || 0) + pts });
  },

  // Tekshirishlar sonini oshirish
  addCheck() {
    const user = this.getUser();
    if (!user) return { ok: false, error: 'Foydalanuvchi tizimga kirmagan' };
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

  if (user && user.name) {
    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <div style="
          width:32px;height:32px;border-radius:9px;
          background:linear-gradient(135deg,var(--p2),var(--p1));
          display:flex;align-items:center;justify-content:center;
          font-size:0.85rem;font-weight:700;color:#fff;
          box-shadow:0 0 12px rgba(168,85,247,0.35)
        ">${user.avatar || user.name.charAt(0).toUpperCase()}</div>
        <div>
          <div style="font-size:0.82rem;font-weight:600">${user.name}</div>
          <div style="font-size:0.7rem;color:var(--p1)">⭐ ${user.points || 0} ball</div>
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
