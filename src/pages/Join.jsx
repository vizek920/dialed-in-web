import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Backdrop from '../components/Backdrop.jsx';
import Avatar from '../components/Avatar.jsx';
import { ArrowLeftIcon, CheckIcon } from '../components/Icons.jsx';
import { AVATARS, avatarName } from '../lib/avatars.js';
import { connectSocket, request } from '../lib/socket.js';
import { loadProfile, loadSession, saveProfile, saveSession, clearSession, normalizeCode } from '../lib/session.js';
import { errorText } from '../lib/errors.js';

const TEAMS = [
  { key: 'red', label: 'الفريق الأحمر' },
  { key: 'blue', label: 'الفريق الأزرق' },
];

export default function Join() {
  const { code: codeParam } = useParams();
  const navigate = useNavigate();
  const profile = loadProfile();

  const [name, setName] = useState(profile.name || '');
  const [code, setCode] = useState(normalizeCode(codeParam));
  const [avatar, setAvatar] = useState(profile.avatar || '');
  const [team, setTeam] = useState(profile.team || '');
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (codeParam) setCode(normalizeCode(codeParam));
  }, [codeParam]);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 16) return setError(errorText('bad_name'));
    if (code.length !== 5) return setError('كود الغرفة مكوّن من 5 أحرف وأرقام.');
    if (!avatar) return setError(errorText('bad_avatar'));
    if (!team) return setError(errorText('bad_team'));

    setError('');
    setBusy(true);
    const slowTimer = setTimeout(() => setSlow(true), 4000); // الخادم المجاني قد يكون نائمًا
    try {
      try {
        await connectSocket();
      } catch {
        setError('تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.');
        return;
      }

      // عودة تلقائية إن كان لدينا جلسة سابقة في هذه الغرفة
      const old = loadSession(code);
      if (old?.token) {
        const back = await request('room:rejoin', { code, token: old.token });
        if (back.ok) {
          navigate(`/room/${code}`);
          return;
        }
        clearSession(code);
      }

      const payload = { code, name: cleanName, avatar, team };
      let res = await request('room:join', payload);
      if (res.error === 'already_in_room') {
        await request('room:leave'); // كان في غرفة أخرى ويريد الانتقال
        res = await request('room:join', payload);
      }
      if (!res.ok) {
        setError(errorText(res.error));
        return;
      }
      saveSession(code, { token: res.token, playerId: res.playerId, name: cleanName, avatar, team });
      saveProfile({ name: cleanName, avatar, team });
      navigate(`/room/${code}`);
    } finally {
      clearTimeout(slowTimer);
      setSlow(false);
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <Backdrop />
      <main className="page__content">
        <form className="join glass" onSubmit={submit} noValidate>
          <header className="join__head">
            <Link to="/" className="join__logo" aria-label="العودة إلى الرئيسية">
              <span className="join__halo" />
              <img src="/logo.png" alt="شعار بين بين" width="104" height="104" />
            </Link>
            <div>
              <h1 className="join__title title-gradient">انضم إلى اللعبة</h1>
              <p className="join__sub">بدون حساب — اسمك وشخصيتك فقط، ثم ادخل!</p>
            </div>
          </header>

          <div className="join__row">
            <div className="field">
              <label htmlFor="player-name">اسمك</label>
              <input
                id="player-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={16}
                placeholder="اكتب اسمك"
                autoComplete="nickname"
              />
            </div>
            <div className="field">
              <label htmlFor="room-code">كود الغرفة</label>
              <input
                id="room-code"
                className="input input--code"
                value={code}
                onChange={(e) => setCode(normalizeCode(e.target.value))}
                placeholder="مثال: K7M2X"
                dir="ltr"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="join__label">
            <span>اختر شخصيتك</span>
            <b>{avatar ? avatarName(avatar) : ''}</b>
          </div>
          <div className="avatar-grid" role="radiogroup" aria-label="اختر شخصيتك">
            {AVATARS.map((a) => (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={avatar === a.id}
                aria-label={a.name}
                className={`avatar-pick${avatar === a.id ? ' avatar-pick--on' : ''}`}
                onClick={() => setAvatar(a.id)}
              >
                <Avatar id={a.id} size={70} />
              </button>
            ))}
          </div>

          <div className="join__teams" role="radiogroup" aria-label="اختر فريقك">
            {TEAMS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="radio"
                aria-checked={team === t.key}
                className={`team-pick team-pick--${t.key}${team === t.key ? ' team-pick--on' : ''}${team && team !== t.key ? ' team-pick--dim' : ''}`}
                onClick={() => setTeam(t.key)}
              >
                {team === t.key && <CheckIcon />}
                {t.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? (slow ? 'جارٍ إيقاظ الخادم، قد يستغرق دقيقة...' : 'جارٍ الدخول...') : 'ادخل اللعبة'}
            {!busy && <ArrowLeftIcon />}
          </button>
        </form>
      </main>
    </div>
  );
}
