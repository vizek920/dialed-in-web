import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../lib/api.js';
import { errorText } from '../lib/errors.js';
import { useLoad } from '../state/useLoad.js';
import { toPayload } from '../lib/questions.js';

const STATUS = { private: 'خاص', pending: 'بانتظار المراجعة', approved: 'معتمد في البنك', rejected: 'مرفوض' };

// نافذة اختيار أسئلة جاهزة: «بنك الموقع» المعتمد، و«قائمتي» الشخصية (مع اقتراح أسئلتي للبنك)
export default function BankPicker({ onAdd, onClose }) {
  const [tab, setTab] = useState('site');
  const [catId, setCatId] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState({}); // id → سؤال
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [suggesting, setSuggesting] = useState(null); // id سؤال يُقترح الآن
  const [suggestCat, setSuggestCat] = useState('');

  const cats = useLoad(() => api('GET', '/bank/categories'), []);
  const site = useLoad(
    () => (tab === 'site' ? api('GET', `/bank/questions?categoryId=${encodeURIComponent(catId)}&q=${encodeURIComponent(search.trim())}`) : Promise.resolve({ ok: true, questions: [] })),
    [tab, catId, search]
  );
  const mine = useLoad(() => (tab === 'mine' ? api('GET', '/bank/mine') : Promise.resolve({ ok: true, questions: [] })), [tab]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const categories = cats.data?.categories ?? [];
  const list = (tab === 'site' ? site.data?.questions : mine.data?.questions) ?? [];
  const loadError = (tab === 'site' ? site.error : mine.error) || cats.error;
  const chosen = Object.values(selected);

  const toggle = (q) =>
    setSelected((s) => {
      const next = { ...s };
      if (next[q.id]) delete next[q.id];
      else next[q.id] = q;
      return next;
    });

  const addChosen = async () => {
    setBusy(true);
    const res = await onAdd(chosen.map(toPayload));
    setBusy(false);
    if (res?.ok) onClose();
    else setMessage(errorText(res?.error));
  };

  const removeMine = async (q) => {
    if (!window.confirm('حذف هذا السؤال من قائمتك؟')) return;
    const res = await api('DELETE', `/bank/mine/${q.id}`);
    setMessage(res.ok ? '' : errorText(res.error));
    mine.reload();
  };
  const suggest = async (q) => {
    const res = await api('POST', `/bank/mine/${q.id}/suggest`, { categoryId: suggestCat });
    setMessage(res.ok ? 'أُرسل اقتراحك للمراجعة، شكرًا لك!' : errorText(res.error));
    if (res.ok) setSuggesting(null);
    mine.reload();
  };

  // البوابة: الأب يستعمل backdrop-filter فيكسر تموضع fixed، فنعرض النافذة مباشرة في body
  return createPortal(
    <div className="modal" role="dialog" aria-modal="true" aria-label="بنك الأسئلة" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal__box glass">
        <header className="modal__head">
          <h2 className="qm__title">اختر أسئلة جاهزة</h2>
          <button type="button" className="mini" onClick={onClose}>
            إغلاق
          </button>
        </header>

        <nav className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'site'} className={`tabs__btn${tab === 'site' ? ' tabs__btn--on' : ''}`} onClick={() => setTab('site')}>
            بنك الموقع
          </button>
          <button type="button" role="tab" aria-selected={tab === 'mine'} className={`tabs__btn${tab === 'mine' ? ' tabs__btn--on' : ''}`} onClick={() => setTab('mine')}>
            قائمتي
          </button>
        </nav>

        {tab === 'site' && (
          <div className="modal__filters">
            <div className="chips">
              <button type="button" className={`chip${catId === '' ? ' chip--on' : ''}`} onClick={() => setCatId('')}>
                الكل
              </button>
              {categories.map((c) => (
                <button key={c.id} type="button" className={`chip${catId === c.id ? ' chip--on' : ''}`} onClick={() => setCatId(c.id)}>
                  {c.name} ({c.count})
                </button>
              ))}
            </div>
            <input className="input input--small" type="search" value={search} placeholder="ابحث..." onChange={(e) => setSearch(e.target.value)} />
          </div>
        )}

        {message && (
          <div className="form-error" role="status">
            {message}
          </div>
        )}
        {loadError && <div className="form-error">{errorText(loadError)}</div>}

        <ul className="modal__list">
          {list.length === 0 && !loadError && <li className="adm__empty">{tab === 'site' ? 'لا توجد أسئلة مطابقة.' : 'قائمتك فارغة. احفظ أسئلة من غرفتك لتظهر هنا.'}</li>}
          {list.map((q) => {
            return (
              <li key={q.id} className={`pick${selected[q.id] ? ' pick--on' : ''}`}>
                <label className="pick__main">
                  <input type="checkbox" checked={Boolean(selected[q.id])} onChange={() => toggle(q)} />
                  <span className="pick__text">
                    <b>{q.item}</b>
                    <small>
                      {q.left} ↔ {q.right} · {q.timeSec} ث
                      {tab === 'mine' && ` · ${STATUS[q.status]}`}
                    </small>
                    {tab === 'mine' && q.status === 'rejected' && q.rejectReason && <small className="pick__reason">سبب الرفض: {q.rejectReason}</small>}
                  </span>
                </label>

                {tab === 'mine' && (
                  <div className="pick__tools">
                    {(q.status === 'private' || q.status === 'rejected') &&
                      (suggesting === q.id ? (
                        <>
                          <select className="input input--small" value={suggestCat} onChange={(e) => setSuggestCat(e.target.value)} aria-label="تصنيف الاقتراح">
                            <option value="">اختر تصنيفًا</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                          <button type="button" className="mini" disabled={!suggestCat} onClick={() => suggest(q)}>
                            أرسل
                          </button>
                        </>
                      ) : (
                        <button type="button" className="mini" onClick={() => { setSuggesting(q.id); setSuggestCat(''); }}>
                          اقترحه للبنك
                        </button>
                      ))}
                    {q.status !== 'approved' && (
                      <button type="button" className="mini mini--danger" onClick={() => removeMine(q)}>
                        حذف
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <footer className="modal__foot">
          <button type="button" className="btn btn--primary btn--small" onClick={addChosen} disabled={busy || chosen.length === 0}>
            {busy ? 'جارٍ الإضافة...' : `أضف المحدد إلى الغرفة (${chosen.length})`}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
