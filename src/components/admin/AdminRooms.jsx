import { api } from '../../lib/api.js';
import { errorText } from '../../lib/errors.js';
import { useLoad } from '../../state/useLoad.js';
import Avatar from '../Avatar.jsx';

const PHASE = { lobby: 'بانتظار البدء', playing: 'جولة جارية', reveal: 'كشف النتيجة', finished: 'منتهية' };

// الغرف الحية: كل الغرف (عامة وخاصة) مع أدوات الإدارة. تتحدّث كل 5 ثوانٍ.
export default function AdminRooms({ notify }) {
  const { data, error, loading, reload } = useLoad(() => api('GET', '/admin/rooms'), [], 5000);
  const rooms = data?.rooms ?? [];

  const run = async (method, path, body, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    const res = await api(method, path, body);
    notify(res.ok ? '' : errorText(res.error));
    reload();
  };

  if (loading && !data) return <p className="adm__empty">جارٍ التحميل...</p>;
  if (error && !data) return <p className="form-error">{errorText(error)}</p>;
  if (rooms.length === 0) return <p className="adm__empty">لا توجد غرف حية الآن.</p>;

  return (
    <div className="adm__grid">
      {rooms.map((r) => (
        <article key={r.code} className="admroom glass">
          <header className="admroom__head">
            <div>
              <h3 className="admroom__name">{r.name}</h3>
              <div className="admroom__meta">
                <bdi dir="ltr">{r.code}</bdi> · {r.isPublic ? 'عامة' : 'خاصة'} · المضيف: {r.ownerName ?? '—'}
              </div>
            </div>
            <div className="admroom__chips">
              <span className="pill pill--gold">{PHASE[r.phase]}</span>
              <span className={`pill ${r.hostConnected ? 'pill--green' : 'pill--warn'}`}>{r.hostConnected ? 'المضيف متصل' : 'المضيف غائب'}</span>
              {r.locked && <span className="pill pill--warn">مقفلة</span>}
            </div>
          </header>

          <ul className="admroom__players">
            {r.players.length === 0 && <li className="adm__empty">لا لاعبين</li>}
            {r.players.map((p) => (
              <li key={p.id} className={`admp admp--${p.team}${p.connected ? '' : ' admp--off'}`}>
                <Avatar id={p.avatar} size={32} />
                <span className="admp__name">
                  {p.name}
                  {!p.connected && <small> · غير متصل</small>}
                </span>
                <span className="admp__score">{p.score}</span>
                <div className="admp__actions">
                  <button type="button" className="mini" onClick={() => run('POST', `/admin/rooms/${r.code}/players/${p.id}/mute`, { muted: !p.muted })}>
                    {p.muted ? 'إلغاء الكتم' : 'كتم'}
                  </button>
                  <button type="button" className="mini" onClick={() => run('POST', `/admin/rooms/${r.code}/players/${p.id}/kick`, { ban: false }, `إخراج ${p.name}؟`)}>
                    طرد
                  </button>
                  <button type="button" className="mini mini--danger" onClick={() => run('POST', `/admin/rooms/${r.code}/players/${p.id}/kick`, { ban: true }, `حظر ${p.name} نهائيًا من هذه الغرفة؟`)}>
                    حظر
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <footer className="admroom__foot">
            <button type="button" className="btn btn--small" onClick={() => run('POST', `/admin/rooms/${r.code}/lock`, { locked: !r.locked })}>
              {r.locked ? 'فتح الغرفة' : 'قفل الغرفة'}
            </button>
            <button type="button" className="btn btn--small btn--danger" onClick={() => run('POST', `/admin/rooms/${r.code}/close`, undefined, `إغلاق غرفة «${r.name}» وإخراج كل من فيها؟`)}>
              إغلاق الغرفة
            </button>
          </footer>
        </article>
      ))}
    </div>
  );
}
