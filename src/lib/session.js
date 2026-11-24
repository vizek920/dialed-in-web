// حفظ جلسة اللاعب في المتصفح ليعود تلقائيًا بعد الانقطاع أو تحديث الصفحة.
// كل القراءات والكتابات داخل try/catch لأن التخزين قد يكون محظورًا (تصفح خاص).
const sessionKey = (code) => `dialedin:session:${code}`;
const PROFILE_KEY = 'dialedin:profile';

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
    /* التخزين غير متاح: يعمل الموقع بدونه */
  }
}

export const loadSession = (code) => read(sessionKey(code));
export const saveSession = (code, data) => write(sessionKey(code), data);
export function clearSession(code) {
  try {
    localStorage.removeItem(sessionKey(code));
  } catch {
    /* تجاهل */
  }
}

// آخر اسم وشخصية وفريق استُخدمت (لتعبئة نموذج الدخول)
export const loadProfile = () => read(PROFILE_KEY) || {};
export const saveProfile = (data) => write(PROFILE_KEY, data);

// ينظّف كود الغرفة: أحرف كبيرة وأرقام فقط (يقبل الشرطات والمسافات)
export const normalizeCode = (value) =>
  String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5);
