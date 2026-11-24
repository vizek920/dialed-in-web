import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Backdrop from '../components/Backdrop.jsx';
import Avatar from '../components/Avatar.jsx';
import { PlusIcon, LockIcon, SearchIcon } from '../components/Icons.jsx';
import { API_URL } from '../lib/config.js';

const STATUS = {
  waiting: { label: 'بانتظار اللاعبين', join: 'انضم', cls: 'waiting' },
  playing: { label: 'اللعب جارٍ', join: 'انضم الآن', cls: 'playing' },
  locked: { label: 'مقفلة', join: 'ممتلئة', cls: 'locked' },
};
const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'waiting', label: 'بانتظار اللاعبين' },
  { key: 'playing', label: 'اللعب جارٍ' },
];

export default function Lobby() {
  const [rooms, setRooms] = useState(null); // null = يحمّل
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  // تحديث القائمة كل 5 ثوانٍ
  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/rooms/public`, { signal: ctrl.signal });
        if (!res.ok) throw new Error('bad status');
        const data = await res.json();
        if (alive) {
          setRooms(data.rooms);
          setFailed(false);
        }
      } catch {
        if (alive && !ctrl.signal.aborted) setFailed(true);
      }
    };
    load();
    const id = setInterval(load, 5000);
    return () => {
      alive = false;
      ctrl.abort();
      clearInterval(id);
    };
  }, []);

  const visible = useMemo(() => {
    if (!rooms) return [];
    const q = query.trim().toLowerCase();
    return rooms.filter(
      (r) => (filter === 'all' || r.status === filter) && (!q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))
    );
  }, [rooms, query, filter]);

  return (
    <div className="page">
      <Backdrop />
      <main className="page__content lobby">
        <header className="lobby__head">
          <Link to="/" className="lobby__brand" aria-label="العودة إلى الرئيسية">
            <img src="/logo.png" alt="" width="72" height="72" />
            <div>
              <h1 className="title-gradient lobby__title">الغرف العامة</h1>
              <p className="lobby__sub">ادخل أي غرفة مفتوحة وابدأ اللعب مع الجميع</p>
            </div>
          </Link>
          <Link to="/host" className="btn btn--primary">
            <PlusIcon />
            إنشاء غرفة عامة
          </Link>
        </header>

        <div className="lobby__tools">
          <div className="search">
            <SearchIcon className="search__icon" />
            <label htmlFor="room-search" className="sr-only">
              ابحث عن غرفة
            </label>
            <input
              id="room-search"
              className="input search__input"
              placeholder="ابحث عن غرفة..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="chips" role="group" aria-label="تصفية الغرف">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={filter === f.key}
                className={`chip${filter === f.key ? ' chip--on' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {rooms === null && !failed && <p className="lobby__note">جارٍ تحميل الغرف... (قد يحتاج الخادم دقيقة ليستيقظ)</p>}
        {failed && rooms === null && (
          <p className="lobby__note lobby__note--err">تعذّر الاتصال بالخادم. سنعيد المحاولة تلقائيًا.</p>
        )}
        {rooms && visible.length === 0 && (
          <p className="lobby__note">{rooms.length === 0 ? 'لا توجد غرف عامة الآن. كن أول من ينشئ غرفة!' : 'لا غرف تطابق بحثك.'}</p>
        )}

        <div className="rooms">
          {visible.map((r) => {
            const st = STATUS[r.status] || STATUS.waiting;
            const disabled = r.status === 'locked';
            const pct = Math.min(100, Math.round((r.players / r.maxPlayers) * 100));
            return (
              <article key={r.code} className="room-card glass">
                <div className="room-card__top">
                  <div>
                    <h2 className="room-card__name">{r.name}</h2>
                    <div className="room-card__meta">الكود: {r.code}</div>
                  </div>
                  <span className={`status status--${st.cls}`}>{st.label}</span>
                </div>
                <div>
                  <div className="room-card__count">
                    <span>
                      اللاعبون {r.players} / {r.maxPlayers}
                    </span>
                    <span>{r.totalRounds} جولات</span>
                  </div>
                  <div className="bar">
                    <div className="bar__fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="room-card__foot">
                  <div className="stack">
                    {(r.avatars || []).map((a, i) => (
                      <span key={i} className="stack__item">
                        <Avatar id={a} size={36} />
                      </span>
                    ))}
                  </div>
                  {disabled ? (
                    <span className="btn btn--small room-card__join room-card__join--off" aria-disabled="true">
                      {st.join}
                    </span>
                  ) : (
                    <Link to={`/join/${r.code}`} className={`btn btn--small room-card__join room-card__join--${st.cls}`}>
                      {st.join}
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <aside className="invite glass">
          <div className="invite__text">
            <LockIcon width="30" height="30" style={{ color: 'var(--ice)' }} />
            <div>
              <h2>عندك كود دعوة؟</h2>
              <p>الغرف الخاصة لا تظهر هنا — ادخلها بالكود الذي أرسله لك المضيف.</p>
            </div>
          </div>
          <Link to="/join" className="btn">
            ادخل بالكود
          </Link>
        </aside>
      </main>
    </div>
  );
}
