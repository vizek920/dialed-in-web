import { useState } from 'react';
import { api } from '../../lib/api.js';
import { errorText } from '../../lib/errors.js';
import { useLoad } from '../../state/useLoad.js';

// طابور مراجعة الأسئلة المقترحة للبنك العام (الأقدم أولًا)
export default function AdminSuggestions({ notify, onChanged }) {
  const list = useLoad(() => api('GET', '/admin/suggestions'), [], 15000);
  const cats = useLoad(() => api('GET', '/admin/categories'), []);
  const [picked, setPicked] = useState({}); // id → تصنيف مختار قبل الاعتماد
  const [rejecting, setRejecting] = useState(null); // id
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const questions = list.data?.questions ?? [];
  const categories = (cats.data?.categories ?? []).filter((c) => c.isActive);

  const finish = async (res) => {
    setBusy(false);
    notify(res.ok ? '' : errorText(res.error));
    setRejecting(null);
    setReason('');
    await list.reload();
    onChanged?.();
  };

  const approve = async (q) => {
    setBusy(true);
    finish(await api('POST', `/admin/questions/${q.id}/approve`, { categoryId: picked[q.id] ?? q.categoryId }));
  };
  const reject = async (q) => {
    setBusy(true);
    finish(await api('POST', `/admin/questions/${q.id}/reject`, { reason: reason.trim() || undefined }));
  };

  if (list.loading && !list.data) return <p className="adm__empty">جارٍ التحميل...</p>;
  if (list.error && !list.data) return <p className="form-error">{errorText(list.error)}</p>;
  if (questions.length === 0) return <p className="adm__empty">لا توجد مقترحات بانتظار المراجعة. 🎉</p>;

  return (
    <ol className="adm__stack">
      {questions.map((q) => (
        <li key={q.id} className="sugg glass">
          <div className="sugg__main">
            <b className="sugg__item">{q.item}</b>
            <span className="sugg__meta">
              {q.left} ↔ {q.right} · الهدف <bdi>{q.target}</bdi> · {q.timeSec} ث · النقاط <bdi dir="ltr">{q.points.join('-')}</bdi>
            </span>
            <span className="sugg__meta">
              اقترحه: {q.ownerName ?? '—'} · {new Date(q.createdAt).toLocaleDateString('ar-SA')}
            </span>
          </div>

          <div className="sugg__side">
            <select
              className="input input--small"
              aria-label="التصنيف"
              value={picked[q.id] ?? q.categoryId ?? ''}
              onChange={(e) => setPicked((p) => ({ ...p, [q.id]: e.target.value }))}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {rejecting === q.id ? (
              <div className="sugg__reject">
                <input
                  className="input input--small"
                  value={reason}
                  maxLength={200}
                  placeholder="سبب الرفض (اختياري)"
                  onChange={(e) => setReason(e.target.value)}
                  autoFocus
                />
                <button type="button" className="mini mini--danger" onClick={() => reject(q)} disabled={busy}>
                  تأكيد الرفض
                </button>
                <button type="button" className="mini" onClick={() => setRejecting(null)}>
                  تراجع
                </button>
              </div>
            ) : (
              <div className="sugg__btns">
                <button type="button" className="btn btn--small btn--primary" onClick={() => approve(q)} disabled={busy}>
                  اعتماد
                </button>
                <button type="button" className="btn btn--small btn--danger" onClick={() => setRejecting(q.id)} disabled={busy}>
                  رفض
                </button>
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
