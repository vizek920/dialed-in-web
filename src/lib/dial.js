// هندسة قرص المقياس (SVG بحجم 800×470، مركز القرص عند 400,430).
// الموقع pos نسبة من 0 إلى 100: 0 = الطرف الأيسر، 100 = الطرف الأيمن.
// الزاوية تُقاس من الأفق الأيمن: pos 100 ← 0°، pos 0 ← 180°.
export const VB_W = 800;
export const VB_H = 470;
export const CX = 400;
export const CY = 430;
export const R_RIM = 360;
export const R_BAND_OUT = 352;
export const R_BAND_IN = 98;
export const R_ORBIT = 250; // المدار الذي تتحرك عليه المؤشرات

export const clampPos = (p) => Math.min(98, Math.max(2, p));
export const posToAngle = (pos) => 180 - 1.8 * pos;

export function polar(r, angleDeg) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) };
}

export const pointAt = (pos, r) => polar(r, posToAngle(pos));

const f = (p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;

// قطاع حلقي بين موقعين على المقياس
export function bandPath(pos1, pos2) {
  const a1 = posToAngle(pos1);
  const a2 = posToAngle(pos2);
  const o1 = polar(R_BAND_OUT, a1);
  const o2 = polar(R_BAND_OUT, a2);
  const i1 = polar(R_BAND_IN, a1);
  const i2 = polar(R_BAND_IN, a2);
  return `M${f(i1)}L${f(o1)}A${R_BAND_OUT} ${R_BAND_OUT} 0 0 1 ${f(o2)}L${f(i2)}A${R_BAND_IN} ${R_BAND_IN} 0 0 0 ${f(i1)}Z`;
}

// خطوط التدريج على حافة القرص كل 10 درجات
export const TICKS = Array.from({ length: 17 }, (_, i) => {
  const angle = 10 + i * 10;
  const a = polar(336, angle);
  const b = polar(350, angle);
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}).join('');

// من إحداثيات المؤشر على الشاشة إلى موقع على المقياس
export function pointerToPos(clientX, clientY, rect) {
  const k = rect.width / VB_W;
  const dx = clientX - rect.left - CX * k;
  const dy = CY * k - (clientY - rect.top);
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (dy < 0) angle = dx >= 0 ? 0 : 180; // أسفل خط القاعدة: ألصقه بأقرب طرف
  return clampPos((180 - angle) / 1.8);
}

// ألوان النطاقات الخمسة وألوان أرقامها (من تصميم الكشف)
export const BAND_STYLE = [
  { fill: '#FFD166', text: '#5A3B00' },
  { fill: '#F4974B', text: '#4A1E00' },
  { fill: '#7FD8F5', text: '#05263B' },
  { fill: '#F4974B', text: '#4A1E00' },
  { fill: '#FFD166', text: '#5A3B00' },
];
