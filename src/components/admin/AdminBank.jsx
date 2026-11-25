import { useState } from 'react';
import { api } from '../../lib/api.js';
import { emptyQuestion } from '../../lib/questions.js';
import { errorText } from '../../lib/errors.js';
import { useLoad } from '../../state/useLoad.js';
import QuestionForm from '../QuestionForm.jsx';

// بنك الأسئلة (للمدير): التصنيفات وأسئلة البنك المعتمدة
export default function AdminBank({ notify, onChanged }) {
  const [filter, setFilter] = useState(''); // '' الكل | 'none' بلا تصنيف | id
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [newCat, setNewCat] = useState('');

  const cats = useLoad(() => api('GET', '/admin/categories'), []);
  const qs = useLoad(
    () => api('GET', `/admin/bank?categoryId=${encodeURIComponent(filter)}&q=${encodeURIComponent(search.trim())}`),
    [filter, search]
  );
  const categories = cats.data?.categories ?? [];
  const questions = qs.data?.questions ?? [];
  const catName = (id) => categories.find((c) => c.id === id)?.name ?? 'بلا تصنيف';

  const done = async (res) => {
    notify(res.ok ? '' : errorText(res.error));
    await Promise.all([cats.reload(), qs.reload()]);
    onChanged?.();
    return res;
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    const res = await done(await api('POST', '/admin/categories', { name: newCat.trim() }));
    if (res.ok) setNewCat('');
  };
  const renameCategory = async (c) => {
    const name = window.prompt('الاسم الجديد للتصنيف:', c.name);
    if (name && name.trim() !== c.name) await done(await api('PATCH', `/admin/categories/${c.id}`, { name: name.trim() }));
  };
  const removeCategory = async (c) => {
    if (window.confirm(`حذف تصنيف «${c.name}»؟ ستبقى أسئلته في البنك بلا تصنيف.`)) {
      if (filter === c.id) setFilter('');
      await done(await api('DELETE', `/admin/categories/${c.id}`));
    }
  };
  const removeQuestion = async (q) => {
    if (window.confirm('حذف هذا السؤال من البنك نهائيًا؟')) await done(await api('DELETE', `/admin/bank/${q.id}`));
  };

  return (
    <div className="bank">
      <aside className="bank__cats glass">
        <h3 className="adm__h">التصنيفات</h3>
        <button type="button" className={`catrow${filter === '' ? ' catrow--on' : ''}`} onClick={() => setFilter('')}>
          <span>كل الأسئلة</span>
        </button>
        {categories.map((c) => (
          <div key={c.id} className={`catrow${filter === c.id ? ' catrow--on' : ''}${c.isActive ? '' : ' catrow--off'}`}>
            <button type="button" className="catrow__name" onClick={() => setFilter(c.id)}>
              {c.name} <small>({c.count})</small>
              {!c.isActive && <small> · مخفي</small>}
            </button>
            <span className="catrow__tools">
              <button type="button" className="mini" onClick={() => renameCategory(c)}>
                اسم
              </button>
              <button type="button" className="mini" onClick={async () => done(await api('PATCH', `/admin/categories/${c.id}`, { isActive: !c.isActive }))}>
                {c.isActive ? 'إخفاء' : 'إظهار'}
              </button>
              <button type="button" className="mini mini--danger" onClick={() => removeCategory(c)}>
                حذف
              </button>
            </span>
          </div>
        ))}
        <button type="button" className={`catrow${filter === 'none' ? ' catrow--on' : ''}`} onClick={() => setFilter('none')}>
          <span>بلا تصنيف</span>
        </button>
        <form className="bank__newcat" onSubmit={addCategory}>
          <input className="input input--small" value={newCat} maxLength={40} placeholder="تصنيف جديد" onChange={(e) => setNewCat(e.target.value)} />
          <button type="submit" className="btn btn--small btn--accent">
            إضافة
          </button>
        </form>
      </aside>

      <section className="bank__list">
        <div className="bank__tools">
          <input className="input input--small" type="search" value={search} placeholder="ابحث في الأسئلة" onChange={(e) => setSearch(e.target.value)} />
          <button type="button" className="btn btn--small btn--accent" onClick={() => setEditing('new')} disabled={editing !== null}>
            سؤال جديد
          </button>
        </div>

        {editing === 'new' && (
          <QuestionForm
            initial={{ ...emptyQuestion(), categoryId: filter && filter !== 'none' ? filter : '' }}
            categories={categories}
            submitLabel="إضافة إلى البنك"
            onCancel={() => setEditing(null)}
            onSubmit={async (payload) => {
              const res = await done(await api('POST', '/admin/bank', payload));
              if (res.ok) setEditing(null);
              return res;
            }}
          />
        )}

        {qs.loading && !qs.data && <p className="adm__empty">جارٍ التحميل...</p>}
        {qs.data && questions.length === 0 && <p className="adm__empty">لا توجد أسئلة بهذا الفلتر.</p>}

        <ol className="adm__stack">
          {questions.map((q) =>
            editing === q.id ? (
              <li key={q.id}>
                <QuestionForm
                  initial={{ ...q, categoryId: q.categoryId ?? '' }}
                  categories={categories}
                  submitLabel="حفظ التعديل"
                  onCancel={() => setEditing(null)}
                  onSubmit={async (payload) => {
                    const res = await done(await api('PATCH', `/admin/bank/${q.id}`, payload));
                    if (res.ok) setEditing(null);
                    return res;
                  }}
                />
              </li>
            ) : (
              <li key={q.id} className="sugg glass">
                <div className="sugg__main">
                  <b className="sugg__item">{q.item}</b>
                  <span className="sugg__meta">
                    {q.left} ↔ {q.right} · الهدف <bdi>{q.target}</bdi> · {q.timeSec} ث
                  </span>
                  <span className="sugg__meta">
                    {catName(q.categoryId)} · {q.ownerName ? `من ${q.ownerName}` : 'رسمي'}
                  </span>
                </div>
                <div className="sugg__btns">
                  <button type="button" className="mini" onClick={() => setEditing(q.id)} disabled={editing !== null}>
                    تعديل
                  </button>
                  <button type="button" className="mini mini--danger" onClick={() => removeQuestion(q)}>
                    حذف
                  </button>
                </div>
              </li>
            )
          )}
        </ol>
      </section>
    </div>
  );
}
