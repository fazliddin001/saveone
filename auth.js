// ── SAVEONE AUTH SYSTEM ──
// localStorage asosida ishlaydi (demo uchun)
// Keyinchalik Supabase bilan almashtiriladi

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
  register(name, email, password) {
    const users = JSON.parse(localStorage.getItem('saveone_users') || '[]');
    if (users.find(u => u.email === email)) {
      return { ok: false, error: 'Bu email allaqachon ro\'yxatdan o\'tgan' };
    }
    const user = {
      id: Date.now().toString(),
      name, email,
      password: btoa(password), // demo uchun oddiy encoding
      joinedAt: new Date().toISOString(),
      points: 0,
      checksCount: 0,
      modulesCompleted: 0,
      avatar: name.charAt(0).toUpperCase(),
    };
    users.push(user);
    localStorage.setItem('saveone_users', JSON.stringify(users));
    localStorage.setItem('saveone_user', JSON.stringify(user));
    return { ok: true, user };
  },

  // Kirish
  login(email, password) {
    const users = JSON.parse(localStorage.getItem('saveone_users') || '[]');
    const user = users.find(u => u.email === email && u.password === btoa(password));
    if (!user) return { ok: false, error: 'Email yoki parol noto\'g\'ri' };
    localStorage.setItem('saveone_user', JSON.stringify(user));
    return { ok: true, user };
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
    const updated = { ...user, ...updates };
    localStorage.setItem('saveone_user', JSON.stringify(updated));
    // users arrayni ham yangilash
    const users = JSON.parse(localStorage.getItem('saveone_users') || '[]');
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) { users[idx] = updated; localStorage.setItem('saveone_users', JSON.stringify(users)); }
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
    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <div style="
          width:32px;height:32px;border-radius:9px;
          background:linear-gradient(135deg,var(--p2),var(--p1));
          display:flex;align-items:center;justify-content:center;
          font-size:0.85rem;font-weight:700;color:#fff;
          box-shadow:0 0 12px rgba(168,85,247,0.35)
        ">${user.avatar}</div>
        <div>
          <div style="font-size:0.82rem;font-weight:600">${user.name}</div>
          <div style="font-size:0.7rem;color:var(--p1)">⭐ ${user.points} ball</div>
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
