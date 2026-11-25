import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Backdrop from '../components/Backdrop.jsx';
import QuestionsManager from '../components/QuestionsManager.jsx';
import { ArrowLeftIcon } from '../components/Icons.jsx';
import { clearHostAuth, loadHostAuth, loadLastHostRoom, saveHostRoom } from '../lib/hostAuth.js';
import { api } from '../lib/api.js';
import { connectSocket, request } from '../lib/socket.js';
import { loadDraft, MAX_QUESTIONS, questionProblem, saveDraft, SAMPLE_QUESTIONS, toPayload } from '../lib/questions.js';
import { errorText } from '../lib/errors.js';

function Stepper({ id, label, value, min, max, onChange }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="stepper">
        <button type="button" className="stepper__btn" aria-label="أنقص" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
          −
        </button>
        <output id={id} className="stepper__val">
          {value}
        </output>
        <button type="button" className="stepper__btn" aria-label="زِد" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
          +
        </button>
      </div>
    </div>
  );
}

// إنشاء غرفة: الإعدادات والأسئلة. المسودة تُحفظ تلقائيًا في المتصفح.
export default function HostCreate() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(loadHostAuth);
  const draft = useRef(loadDraft()).current;

  const [name, setName] = useState(draft?.name ?? '');
  const [isPublic, setIsPublic] = useState(draft?.isPublic ?? false);
  const [teamSize, setTeamSize] = useState(draft?.teamSize ?? 3);
  const [rounds, setRounds] = useState(draft?.rounds ?? 6);
  const [questions, setQuestions] = useState(draft?.questions ?? []);
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState('');
  const lastRoom = loadLastHostRoom();

  useEffect(() => {
    saveDraft({ name, isPublic, teamSize, rounds, questions });
  }, [name, isPublic, teamSize, rounds, questions]);

  if (!auth) return <Navigate to="/host" replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 30) return setError(errorText('bad_room_name'));
    for (let i = 0; i < questions.length; i += 1) {
      const problem = questionProblem(questions[i]);
      if (problem) return setError(`السؤال رقم ${i + 1}: ${problem}`);
    }
    setError('');
    setBusy(true);
    const timer = setTimeout(() => setSlow(true), 4000);
    try {
      try {
        await connectSocket();
      } catch {
        setError('تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.');
        return;
      }
      const res = await request('room:create', {
        auth: auth.token,
        name: cleanName,
        isPublic,
        teamSize,
        totalRounds: rounds,
        questions,
      });
      if (!res.ok) {
        if (res.error === 'unauthorized') {
          clearHostAuth();
          setAuth(null);
        }
        setError(errorText(res.error));
        return;
      }
      saveHostRoom(res.code, res.hostToken);
      navigate(`/host/room/${res.code}`);
    } finally {
      clearTimeout(timer);
      setSlow(false);
      setBusy(false);
    }
  };

  // معالجات الأسئلة المحلية (قبل إنشاء الغرفة) بنفس واجهة الغرفة الحية
  const local = {
    onAdd: async (q) => {
      if (questions.length >= MAX_QUESTIONS) return { ok: false, error: 'too_many_questions' };
      setQuestions((l) => [...l, q]);
      return { ok: true };
    },
    onUpdate: async (i, q) => {
      setQuestions((l) => l.map((x, k) => (k === i ? q : x)));
      return { ok: true };
    },
    onRemove: async (i) => {
      setQuestions((l) => l.filter((_, k) => k !== i));
      return { ok: true };
    },
    onAddSamples: () => setQuestions((l) => [...l, ...SAMPLE_QUESTIONS].slice(0, MAX_QUESTIONS)),
    onAddMany: async (list) => {
      if (questions.length + list.length > MAX_QUESTIONS) return { ok: false, error: 'too_many_questions' };
      setQuestions((l) => [...l, ...list]);
      return { ok: true };
    },
    onSaveMine: (q) => api('POST', '/bank/mine', toPayload(q)),
  };

  return (
    <div className="page">
      <Backdrop />
      <main className="page__content">
        <form className="hostform" onSubmit={submit} noValidate>
          <header className="hostform__head">
            <Link to="/host" className="join__logo" aria-label="منطقة المضيف">
              <span className="join__halo" />
              <img src="/logo.png" alt="شعار بين بين" width="84" height="84" />
            </Link>
            <div>
              <h1 className="join__title title-gradient">غرفة جديدة</h1>
              <p className="join__sub">أهلًا {auth.username}، جهّز إعدادات اللعبة وأسئلتها</p>
            </div>
            {lastRoom && (
              <Link to={`/host/room/${lastRoom}`} className="btn btn--small">
                غرفتي الحالية ({lastRoom})
              </Link>
            )}
          </header>

          <section className="glass hostform__card">
            <div className="field field--wide">
              <label htmlFor="room-name">اسم الغرفة</label>
              <input id="room-name" className="input" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} placeholder="مثال: سهرة الثلج" />
            </div>

            <div className="hostform__row">
              <Stepper id="team-size" label="لاعبون في كل فريق" value={teamSize} min={1} max={8} onChange={setTeamSize} />
              <Stepper id="rounds" label="عدد الجولات" value={rounds} min={1} max={40} onChange={setRounds} />
            </div>

            <div className="seg" role="radiogroup" aria-label="نوع الغرفة">
              <button type="button" role="radio" aria-checked={!isPublic} className={`seg__opt${!isPublic ? ' seg__opt--on' : ''}`} onClick={() => setIsPublic(false)}>
                <b>خاصة</b>
                <span>بالكود والرابط فقط</span>
              </button>
              <button type="button" role="radio" aria-checked={isPublic} className={`seg__opt${isPublic ? ' seg__opt--on' : ''}`} onClick={() => setIsPublic(true)}>
                <b>عامة</b>
                <span>تظهر في قائمة الغرف</span>
              </button>
            </div>
            {isPublic && <p className="hostform__hint">في الغرف العامة، إن غبت أكثر من 45 ثانية تنتقل القيادة لأقدم لاعب متصل.</p>}
          </section>

          <section className="glass hostform__card">
            <QuestionsManager questions={questions} neededRounds={rounds} {...local} />
          </section>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <button type="submit" className="btn btn--primary btn--block hostform__submit" disabled={busy}>
            {busy ? (slow ? 'جارٍ إيقاظ الخادم، قد يستغرق دقيقة...' : 'جارٍ إنشاء الغرفة...') : 'أنشئ الغرفة'}
            {!busy && <ArrowLeftIcon />}
          </button>
        </form>
      </main>
    </div>
  );
}
