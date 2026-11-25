import { useState } from 'react';
import QuestionForm from './QuestionForm.jsx';
import BankPicker from './BankPicker.jsx';
import { PlusIcon } from './Icons.jsx';
import { emptyQuestion, MAX_QUESTIONS, SAMPLE_QUESTIONS } from '../lib/questions.js';
import { errorText } from '../lib/errors.js';

/**
 * قائمة الأسئلة وإدارتها. تعمل في الإنشاء (محليًا) وداخل الغرفة (عبر الخادم) بنفس الواجهة.
 * onAdd / onUpdate / onRemove ترجع وعدًا بـ { ok, error }.
 * lockedThrough: آخر فهرس مقفل (سؤال لُعب أو يُلعب الآن)، و-1 يعني لا قفل.
 * activeIndex: فهرس السؤال الجاري لوسمه «الآن».
 */
export default function QuestionsManager({ questions, lockedThrough = -1, activeIndex = -1, onAdd, onUpdate, onRemove, onAddSamples, onAddMany, onSaveMine, neededRounds }) {
  const [editing, setEditing] = useState(null); // null | 'new' | فهرس
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [picking, setPicking] = useState(false);

  const full = questions.length >= MAX_QUESTIONS;
  const remove = async (i) => {
    if (!window.confirm('حذف هذا السؤال؟')) return;
    const res = await onRemove(i);
    setError(res?.ok ? '' : errorText(res?.error));
  };

  const saveMine = async (q) => {
    const res = await onSaveMine(q);
    setInfo(res?.ok ? 'حُفظ السؤال في قائمتك الشخصية.' : '');
    setError(res?.ok ? '' : errorText(res?.error));
  };

  return (
    <section className="qm" aria-label="الأسئلة">
      <header className="qm__head">
        <h2 className="qm__title">الأسئلة ({questions.length})</h2>
        <div className="qm__tools">
          {onAddMany && (
            <button type="button" className="btn btn--small" onClick={() => setPicking(true)} disabled={full}>
              من البنك
            </button>
          )}
          {onAddSamples && (
            <button type="button" className="btn btn--small" onClick={onAddSamples} disabled={full}>
              أضف أسئلة تجريبية
            </button>
          )}
          <button type="button" className="btn btn--small btn--accent" onClick={() => setEditing('new')} disabled={full || editing !== null}>
            <PlusIcon width="16" height="16" />
            سؤال جديد
          </button>
        </div>
      </header>

      {typeof neededRounds === 'number' && questions.length < neededRounds && (
        <p className="qm__warn">
          عدد الجولات {neededRounds} وأسئلتك {questions.length}. تحتاج سؤالًا لكل جولة، ويمكنك إضافة الباقي أثناء اللعب.
        </p>
      )}
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      {info && (
        <p className="qm__info" role="status">
          {info}
        </p>
      )}
      {picking && (
        <BankPicker
          onClose={() => setPicking(false)}
          onAdd={async (list) => {
            const res = await onAddMany(list);
            if (res?.ok) setInfo(`أُضيف ${list.length} من الأسئلة.`);
            return res;
          }}
        />
      )}

      {editing === 'new' && (
        <QuestionForm
          initial={emptyQuestion()}
          submitLabel="إضافة السؤال"
          onCancel={() => setEditing(null)}
          onSubmit={async (payload) => {
            const res = await onAdd(payload);
            if (res?.ok) setEditing(null);
            return res;
          }}
        />
      )}

      {questions.length === 0 && editing !== 'new' && <p className="qm__empty">لا أسئلة بعد. أضف سؤالك الأول أو جرّب الأسئلة التجريبية.</p>}

      <ol className="qm__list">
        {questions.map((q, i) => {
          const locked = i <= lockedThrough;
          const state = i < activeIndex || (locked && i !== activeIndex) ? 'played' : i === activeIndex ? 'now' : 'next';
          if (editing === i) {
            return (
              <li key={i}>
                <QuestionForm
                  initial={q}
                  submitLabel="حفظ التعديل"
                  onCancel={() => setEditing(null)}
                  onSubmit={async (payload) => {
                    const res = await onUpdate(i, payload);
                    if (res?.ok) setEditing(null);
                    return res;
                  }}
                />
              </li>
            );
          }
          return (
            <li key={i} className={`qitem qitem--${state}`}>
              <span className="qitem__num">{i + 1}</span>
              <div className="qitem__body">
                <b className="qitem__name">{q.item}</b>
                <span className="qitem__meta">
                  {q.left} ↔ {q.right} · الهدف <bdi>{q.target}</bdi> · {q.timeSec} ث
                </span>
              </div>
              {state !== 'next' && (
                <span className={`qitem__state qitem__state--${state}`}>{state === 'played' ? 'لُعب' : 'الآن'}</span>
              )}
              <div className="qitem__actions">
                {onSaveMine && (
                  <button type="button" className="mini" onClick={() => saveMine(q)} title="احفظه لتستعمله في غرف أخرى">
                    حفظ في قائمتي
                  </button>
                )}
                <button type="button" className="mini" onClick={() => setEditing(i)} disabled={locked || editing !== null}>
                  تعديل
                </button>
                <button type="button" className="mini mini--danger" onClick={() => remove(i)} disabled={locked}>
                  حذف
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export { SAMPLE_QUESTIONS };
