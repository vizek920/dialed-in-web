import { API_URL } from './config.js';

// جلسة المضيف: رمز الدخول (JWT) محفوظ في المتصفح مع اسم الحساب.
const AUTH_KEY = 'dialedin:host-auth';
const roomKey = (code) => `dialedin:host-room:${code}`;
const LAST_KEY = 'dialedin:host-last';

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* التخزين غير متاح */
  }
}
function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* تجاهل */
  }
}

// قراءة محتوى الرمز دون التحقق من توقيعه (التحقق الحقيقي في الخادم)؛ نستعمله لمعرفة انتهاء الصلاحية فقط
function decode(token) {
  try {
    const body = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(body))));
  } catch {
    return null;
  }
}

export function loadHostAuth() {
  const auth = read(AUTH_KEY);
  if (!auth?.token) return null;
  const payload = decode(auth.token);
  if (!payload || payload.exp * 1000 < Date.now() + 30_000) {
    remove(AUTH_KEY);
    return null;
  }
  return auth;
}
export const clearHostAuth = () => remove(AUTH_KEY);

export async function hostLogin(username, password) {
  try {
    const res = await fetch(`${API_URL}/api/host/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || 'server_error' };
    const auth = { token: data.token, id: data.host.id, username: data.host.displayName || data.host.username, role: data.host.role };
    write(AUTH_KEY, auth);
    return { ok: true, ...auth };
  } catch {
    return { ok: false, error: 'offline' };
  }
}

// رمز عودة المضيف إلى غرفة بعينها (يُحفظ عند الإنشاء)
export const loadHostRoom = (code) => read(roomKey(code));
export function saveHostRoom(code, hostToken) {
  write(roomKey(code), { hostToken });
  write(LAST_KEY, { code });
}
export const clearHostRoom = (code) => {
  remove(roomKey(code));
  const last = read(LAST_KEY);
  if (last?.code === code) remove(LAST_KEY);
};
export const loadLastHostRoom = () => read(LAST_KEY)?.code || null;
