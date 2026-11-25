import { useState } from 'react';
import Dial from './Dial.jsx';
import { questionProblem, toPayload } from '../lib/questions.js';
import { errorText } from '../lib/errors.js';

// نموذج إضافة/تعديل سؤال مع معاينة حية للنطاقات حول الهدف
export default function QuestionForm({ initial, submitLabel, onSubmit, onCancel, categories }) {
  const [q, setQ] = useState(initial);
  const [categoryId, setCategoryId] = useState(initial.categoryId ?? '');
  const [advanced, setAdvanced] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (patch) => {
    setQ((prev) => ({ ...prev, ...patch }));
    setError('');
  };
  const setPoint = (i, v) =>
    set({ points: q.points.map((p, k) => (k === i ? (v === '' ? '' : Number(v)) : p)) });

  const problem = questionProblem({ ...q, points: q.points.map((p) => (p === '' ? NaN : p)) });
  const w = Number(q.zoneWidth) || 5.56;
  const previewOk = Number.isFinite(Number(q.target)) && w >= 2 && w <= 10;

  // ليس <form>: هذا النموذج يُعرض داخل نموذج إنشاء الغرفة، والنماذج المتداخلة غير صالحة في HTML
  const submit = async () => {
    if (busy) return;
    if (problem) return setError(problem);
    setBusy(true);
    const payload = toPayload(q);
    if (categories) payload.categoryId = categoryId || null;
    const res = await onSubmit(payload);
    setBusy(false);
    if (!res?.ok) setError(errorText(res?.error));
  };

  return (
    <div
      className="qform glass"
      role="group"
      aria-label="نموذج السؤال"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'range') {
          e.preventDefault();
          submit();
        }
      }}
    >
      <div className="qform__fields">
        <div className="field field--wide">
          <label htmlFor="q-item">الشيء المطلوب تخمينه</label>
          <input
            id="q-item"
            className="input"
            value={q.item}
            maxLength={80}
            onChange={(e) => set({ item: e.target.value })}
            placeholder="مثال: كوب شاي بالنعناع"
            autoFocus
          />
        </div>
        {categories && (
          <div className="field field--wide">
            <label htmlFor="q-cat">التصنيف</label>
            <select id="q-cat" className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">بلا تصنيف</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="field">
          <label htmlFor="q-left">الطرف الأيسر</label>
          <input id="q-left" className="input" value={q.left} maxLength={24} onChange={(e) => set({ left: e.target.value })} placeholder="مثال: عادي" />
        </div>
        <div className="field">
          <label htmlFor="q-right">الطرف الأيمن</label>
          <input id="q-right" className="input" value={q.right} maxLength={24} onChange={(e) => set({ right: e.target.value })} placeholder="مثال: فاخر" />
        </div>
      </div>

      <div className="qform__target">
        <label htmlFor="q-target">
          مكان الهدف المخفي: <b dir="ltr">{Number(q.target).toFixed(1)}</b>
        </label>
        <input
          id="q-target"
          type="range"
          min="0"
          max="100"
          step="0.5"
          dir="ltr"
          value={q.target}
          onChange={(e) => set({ target: Number(e.target.value) })}
        />
        <div className="qform__ends" dir="ltr">
          <span>{q.left || 'الأيسر'}</span>
          <span>{q.right || 'الأيمن'}</span>
        </div>
      </div>

      {previewOk && (
        <div className="qform__preview">
          <Dial
            question={{
              left: q.left || 'الأيسر',
              right: q.right || 'الأيمن',
              target: Number(q.target),
              zoneWidth: w,
              points: q.points.map((p) => (Number.isFinite(Number(p)) ? Number(p) : 0)),
            }}
            markers={[]}
            reveal
          />
          <p className="qform__note">هذه معاينة لك فقط: اللاعبون لا يرون الهدف حتى يُكشف.</p>
        </div>
      )}

      <button type="button" className="linkbtn" onClick={() => setAdvanced((v) => !v)} aria-expanded={advanced}>
        {advanced ? 'إخفاء الإعدادات المتقدمة' : 'إعدادات متقدمة (الوقت والنقاط والنطاق)'}
      </button>

      {advanced && (
        <div className="qform__adv">
          <div className="field">
            <label htmlFor="q-time">وقت الجولة (ثانية)</label>
            <input id="q-time" type="number" min="10" max="180" className="input" dir="ltr" value={q.timeSec} onChange={(e) => set({ timeSec: e.target.value === '' ? '' : Number(e.target.value) })} />
          </div>
          <div className="field">
            <label htmlFor="q-zone">عرض كل نطاق (2 – 10)</label>
            <input id="q-zone" type="number" min="2" max="10" step="0.1" className="input" dir="ltr" value={q.zoneWidth} onChange={(e) => set({ zoneWidth: e.target.value === '' ? '' : Number(e.target.value) })} />
          </div>
          <div className="field field--wide">
            <label>نقاط النطاقات الخمسة (من اليسار إلى اليمين، الأوسط هو الأقرب للهدف)</label>
            <div className="qform__points" dir="ltr">
              {q.points.map((p, i) => (
                <input
                  key={i}
                  type="number"
                  min="0"
                  max="10"
                  className="input"
                  aria-label={`نقاط النطاق ${i + 1}`}
                  value={p}
                  onChange={(e) => setPoint(i, e.target.value)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <div className="qform__actions">
        <button type="button" className="btn btn--primary btn--small" onClick={submit} disabled={busy}>
          {busy ? 'جارٍ الحفظ...' : submitLabel}
        </button>
        <button type="button" className="btn btn--small" onClick={onCancel} disabled={busy}>
          إلغاء
        </button>
      </div>
    </div>
  );
}
