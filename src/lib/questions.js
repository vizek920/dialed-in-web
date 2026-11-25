// أدوات الأسئلة في واجهة المضيف: القيم الافتراضية، التحقق المطابق للخادم، والمسودة المحفوظة.
export const DEFAULTS = { zoneWidth: 5.56, points: [2, 3, 4, 3, 2], timeSec: 40 };
export const MAX_QUESTIONS = 60;

export const emptyQuestion = () => ({
  item: '',
  left: '',
  right: '',
  target: 50,
  zoneWidth: DEFAULTS.zoneWidth,
  points: [...DEFAULTS.points],
  timeSec: DEFAULTS.timeSec,
});

// يُرجع نص الخطأ بالعربية أو '' إن كان السؤال سليمًا (نفس قيود الخادم)
export function questionProblem(q) {
  const item = q.item.trim();
  const left = q.left.trim();
  const right = q.right.trim();
  if (!item) return 'اكتب الشيء المطلوب تخمينه.';
  if (item.length > 80) return 'الشيء المطلوب أطول من 80 حرفًا.';
  if (!left || !right) return 'اكتب طرفي المقياس.';
  if (left.length > 24 || right.length > 24) return 'اسم طرف المقياس أطول من 24 حرفًا.';
  const w = Number(q.zoneWidth);
  if (!(w >= 2 && w <= 10)) return 'عرض النطاق يجب أن يكون بين 2 و10.';
  const t = Number(q.target);
  if (!Number.isFinite(t) || t < w * 2.5 || t > 100 - w * 2.5) return 'الهدف قريب جدًا من أحد الطرفين.';
  if (!Array.isArray(q.points) || q.points.length !== 5 || !q.points.every((p) => Number.isInteger(p) && p >= 0 && p <= 10)) {
    return 'نقاط النطاقات أرقام صحيحة من 0 إلى 10.';
  }
  if (!Number.isInteger(q.timeSec) || q.timeSec < 10 || q.timeSec > 180) return 'الوقت من 10 إلى 180 ثانية.';
  return '';
}

// الصيغة المرسلة للخادم
export const toPayload = (q) => ({
  item: q.item.trim(),
  left: q.left.trim(),
  right: q.right.trim(),
  target: Math.round(Number(q.target) * 100) / 100,
  zoneWidth: Number(q.zoneWidth),
  points: q.points.map(Number),
  timeSec: Number(q.timeSec),
});

// أسئلة تجريبية أصلية لتجربة اللعبة بسرعة
export const SAMPLE_QUESTIONS = [
  { item: 'كوب شاي بالنعناع', left: 'عادي جدًا', right: 'فاخر', target: 22 },
  { item: 'أول يوم مطر في السنة', left: 'مزعج', right: 'ساحر', target: 84 },
  { item: 'السفر وحيدًا', left: 'مخيف', right: 'ممتع', target: 68 },
  { item: 'الاستيقاظ الساعة الخامسة فجرًا', left: 'سهل', right: 'مستحيل', target: 78 },
  { item: 'لعبة الورق مع العائلة', left: 'مملة', right: 'حماسية', target: 62 },
  { item: 'قهوة الصباح', left: 'رفاهية', right: 'ضرورة', target: 82 },
].map((q) => ({ ...emptyQuestion(), ...q }));

// المسودة (الأسئلة والإعدادات) تُحفظ في المتصفح ليكمل المضيف لاحقًا
const DRAFT_KEY = 'dialedin:host-draft';
export function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function saveDraft(draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* تجاهل */
  }
}
