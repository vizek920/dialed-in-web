import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Backdrop from '../components/Backdrop.jsx';
import Screen from '../components/Screen.jsx';
import Avatar from '../components/Avatar.jsx';
import Dial from '../components/Dial.jsx';
import TeamPanel from '../components/TeamPanel.jsx';
import TimerBar from '../components/TimerBar.jsx';
import Chat from '../components/Chat.jsx';
import { CheckIcon, CopyIcon } from '../components/Icons.jsx';
import { useRoom } from '../state/useRoom.js';
import { normalizeCode } from '../lib/session.js';
import { errorText } from '../lib/errors.js';

const TEAM_NAME = { red: 'الأحمر', blue: 'الأزرق' };

export default function Room() {
  const code = normalizeCode(useParams().code);
  const r = useRoom(code);

  if (r.status === 'connecting') {
    return (
      <Screen title="لحظة..." action={null}>
        جارٍ الاتصال بالغرفة. إن كان الخادم نائمًا فقد يستغرق ذلك حتى دقيقة.
      </Screen>
    );
  }
  if (r.status === 'no_session') {
    return (
      <Screen
        title="لست في هذه الغرفة"
        action={
          <Link to={`/join/${code}`} className="btn btn--primary">
            انضم إلى الغرفة
          </Link>
        }
      >
        ادخل اسمك واختر شخصيتك وفريقك للانضمام.
      </Screen>
    );
  }
  if (r.status === 'closed') return <Screen title="أُغلقت الغرفة">انتهت هذه الغرفة أو أغلقها المضيف.</Screen>;
  if (r.status === 'kicked') {
    return (
      <Screen title={r.banned ? 'تم حظرك' : 'تم إخراجك'}>
        {r.banned ? 'حظرك المضيف من هذه الغرفة.' : 'أخرجك المضيف من الغرفة.'}
      </Screen>
    );
  }
  if (r.status === 'error' || !r.room || !r.me) {
    return (
      <Screen
        title="تعذّر الاتصال"
        action={
          <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
            إعادة المحاولة
          </button>
        }
      >
        لم نتمكن من الوصول إلى الخادم.
      </Screen>
    );
  }
  return <RoomView r={r} code={code} />;
}

function RoomView({ r, code }) {
  const { room, me, markers, chat, online, serverNow } = r;
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const mePlayer = room.players.find((p) => p.id === me.playerId);
  const red = room.players.filter((p) => p.team === 'red');
  const blue = room.players.filter((p) => p.team === 'blue');
  const round = room.round;
  const connected = room.players.filter((p) => p.connected).length;

  const copyLink = async () => {
    const link = `${window.location.origin}/join/${code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('انسخ رابط الدعوة:', link);
    }
  };

  const leave = async () => {
    await r.leave();
    navigate('/');
  };

  const phaseChip =
    room.phase === 'lobby'
      ? 'بانتظار بدء اللعبة'
      : room.phase === 'playing'
        ? `الجولة ${round.index + 1} من ${room.totalRounds}`
        : room.phase === 'reveal'
          ? `كشف النتيجة — الجولة ${round.index + 1}`
          : 'انتهت اللعبة';

  const results = round?.results;
  const gains = {};
  const teamGain = {};
  if (results && room.phase === 'reveal') {
    for (const row of results.rows) {
      gains[row.playerId] = { total: row.total, bonus: row.bonus > 0 };
      teamGain[row.team] = { total: (teamGain[row.team]?.total ?? 0) + row.total, bonus: row.bonus > 0 };
    }
  }
  const activeIds = room.phase === 'playing' && round ? Object.values(round.players).filter(Boolean) : [];

  const panel = (team, list) => (
    <TeamPanel
      team={team}
      score={room.teams[team].score}
      players={list}
      activeId={activeIds.find((id) => list.some((p) => p.id === id))}
      meId={me.playerId}
      gains={gains}
      gain={teamGain[team]}
    />
  );

  return (
    <div className="page room-page">
      <Backdrop />
      <main className="page__content room">
        {!online && (
          <div className="banner banner--warn" role="status">
            انقطع الاتصال... جارٍ إعادة المحاولة تلقائيًا
          </div>
        )}

        <header className="room__head">
          <div className="room__chips">
            <button type="button" className="pill pill--btn" onClick={copyLink} title="انسخ رابط الدعوة">
              {room.name} · {code}
              {copied ? <CheckIcon width="16" height="16" /> : <CopyIcon />}
            </button>
            <span className="pill pill--gold">{phaseChip}</span>
          </div>
          <Link to="/" className="room__logo" aria-label="الرئيسية" onClick={(e) => (e.preventDefault(), leave())}>
            <span className="join__halo" />
            <img src="/logo.png" alt="شعار بين بين" width="86" height="86" />
          </Link>
          <div className="room__chips room__chips--end">
            <span className={`pill ${room.hostConnected ? '' : 'pill--warn'}`}>
              المضيف: {room.hostConnected ? 'متصل' : 'غير متصل'}
            </span>
            <span className="pill pill--green">{connected} متصلون</span>
          </div>
        </header>

        {room.phase === 'playing' && round && (
          <TimerBar
            key={round.index}
            startedAt={round.startedAt}
            endsAt={round.endsAt}
            serverNow={serverNow}
            active
          />
        )}

        <div className="stage">
          <div className="stage__side stage__side--red">{panel('red', red)}</div>

          <div className="stage__center">
            {room.phase === 'lobby' && <WaitingCenter room={room} code={code} copyLink={copyLink} copied={copied} />}
            {(room.phase === 'playing' || room.phase === 'reveal') && round && (
              <PlayCenter
                key={round.index}
                room={room}
                me={me}
                markers={markers}
                move={r.move}
                lock={r.lock}
              />
            )}
            {room.phase === 'finished' && <FinishedCenter room={room} mePlayer={mePlayer} />}
          </div>

          <div className="stage__side stage__side--blue">{panel('blue', blue)}</div>

          <div className="stage__chat">
            <Chat messages={chat} onSend={r.sendChat} canTeam={Boolean(mePlayer)} meId={me.playerId} />
          </div>
        </div>

        {room.phase !== 'finished' && (
          <button type="button" className="leave-link" onClick={leave}>
            مغادرة الغرفة
          </button>
        )}
      </main>
    </div>
  );
}

/* ───────── انتظار البدء ───────── */
function WaitingCenter({ room, code, copyLink, copied }) {
  const total = room.players.length;
  return (
    <div className="waiting glass">
      <div className="waiting__label">كود الغرفة</div>
      <div className="waiting__code" dir="ltr">
        {code}
      </div>
      <button type="button" className="btn btn--small" onClick={copyLink}>
        {copied ? <CheckIcon width="16" height="16" /> : <CopyIcon />}
        {copied ? 'تم النسخ' : 'انسخ رابط الدعوة'}
      </button>
      <p className="waiting__text">
        بانتظار المضيف ليبدأ اللعبة...
        <br />
        <b>{total}</b> {total === 1 ? 'لاعب' : 'لاعبين'} في الغرفة · {room.totalRounds} جولات · حتى {room.teamSize} لاعبين في كل فريق
      </p>
    </div>
  );
}

/* ───────── الجولة واللعب والكشف ───────── */
function PlayCenter({ room, me, markers, move, lock }) {
  const round = room.round;
  const q = round.question;
  const revealing = room.phase === 'reveal';
  const rows = round.results?.rows ?? [];

  const [localPos, setLocalPos] = useState(null);
  const [lockedLocal, setLockedLocal] = useState(false);
  const [error, setError] = useState('');
  const lastSent = useRef(0);
  const timer = useRef(null);
  const pending = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const myLive = markers[me.playerId];
  const iPlay = Boolean(myLive);
  const locked = Boolean(myLive?.locked) || lockedLocal;
  const interactive = room.phase === 'playing' && iPlay && !locked;

  // نرسل الموضع للخادم بحد أقصى ~16 مرة في الثانية
  const sendThrottled = useCallback(
    (pos) => {
      pending.current = pos;
      const wait = Math.max(0, 60 - (performance.now() - lastSent.current));
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        lastSent.current = performance.now();
        move(pending.current);
      }, wait);
    },
    [move]
  );

  const onMove = (pos) => {
    setLocalPos(pos);
    sendThrottled(pos);
  };

  const doLock = async () => {
    if (localPos === null) return;
    clearTimeout(timer.current);
    setLockedLocal(true);
    const res = await lock(localPos);
    if (!res.ok) {
      setLockedLocal(false);
      setError(errorText(res.error));
    }
  };

  // مؤشرات اللاعبَين الحاليين
  const dialMarkers = ['red', 'blue']
    .map((team) => {
      const id = round.players[team];
      const p = id && room.players.find((x) => x.id === id);
      if (!p) return null;
      const live = markers[id];
      const row = rows.find((x) => x.playerId === id);
      let pos = live?.pos ?? null;
      if (id === me.playerId && !live?.locked && localPos !== null) pos = localPos;
      if (revealing && row) pos = row.pos;
      return {
        id,
        name: p.name,
        avatar: p.avatar,
        team,
        pos,
        locked: Boolean(live?.locked) || (id === me.playerId && lockedLocal),
        isMe: id === me.playerId,
        gain: revealing && row ? row.total : undefined,
        bonus: revealing && row ? row.bonus > 0 : false,
      };
    })
    .filter(Boolean);

  const playingNames = dialMarkers.map((m) => `${m.name} (${TEAM_NAME[m.team]})`).join(' و ');
  const closest = rows.filter((x) => x.bonus > 0).map((x) => room.players.find((p) => p.id === x.playerId)?.name);
  const nearSide =
    typeof q.target === 'number'
      ? q.target < 45
        ? `أقرب إلى «${q.left}»`
        : q.target > 55
          ? `أقرب إلى «${q.right}»`
          : 'في منتصف المقياس تقريبًا'
      : '';

  return (
    <>
      <div className="clue glass">
        <div className="clue__tag">الشيء المطلوب</div>
        <div className="clue__item">{q.item}</div>
        <div className="clue__hint">
          {interactive
            ? `ضع مؤشرك على المقياس: ${q.left} ↔ ${q.right}`
            : revealing
              ? `المقياس: ${q.left} ↔ ${q.right}`
              : `المقياس: ${q.left} ↔ ${q.right}`}
        </div>
      </div>

      <Dial
        question={q}
        markers={dialMarkers}
        interactive={interactive}
        reveal={revealing}
        onMove={onMove}
        myPos={localPos}
      />

      {room.phase === 'playing' && (
        <div className="actions">
          {interactive && (
            <>
              <button type="button" className="btn btn--primary" onClick={doLock} disabled={localPos === null}>
                <CheckIcon />
                تثبيت المؤشر
              </button>
              <span className="actions__hint">
                {localPos === null ? 'اسحب مؤشرك أو اضغط على القرص لوضعه' : 'ثبّته قبل انتهاء الوقت، أو يُثبَّت تلقائيًا'}
              </span>
            </>
          )}
          {iPlay && locked && <span className="pill pill--green">تم التثبيت ✓ بانتظار بقية اللاعبين</span>}
          {!iPlay && (
            <span className="pill">
              {dialMarkers.length ? `يلعب الآن: ${playingNames}` : 'لا يوجد لاعبون في هذه الجولة'}
            </span>
          )}
          {error && (
            <span className="form-error" role="alert">
              {error}
            </span>
          )}
        </div>
      )}

      {revealing && (
        <div className="actions actions--col">
          <div className="actions">
            {nearSide && <span className="pill">الموقع الحقيقي: {nearSide}</span>}
            <span className={`pill ${closest.length ? 'pill--green' : ''}`}>
              {closest.length ? `الأقرب: ${closest.join(' و ')}` : 'لم يثبّت أحد مؤشره'}
            </span>
          </div>
          <span className="actions__hint actions__hint--wait">بانتظار المضيف لبدء الجولة التالية...</span>
        </div>
      )}
    </>
  );
}

/* ───────── نهاية اللعبة ───────── */
function FinishedCenter({ room, mePlayer }) {
  const { red, blue } = room.teams;
  const ranked = [...room.players].sort((a, b) => b.score - a.score);
  const top = ranked[0];
  const tie = room.winner === 'tie';
  const myTeamWon = mePlayer && room.winner === mePlayer.team;

  return (
    <div className="finish glass">
      <div className={`finish__banner finish__banner--${room.winner}`}>
        {tie ? 'تعادل!' : `الفريق ${TEAM_NAME[room.winner]} يفوز!`}
      </div>
      {!tie && mePlayer && <p className="finish__msg">{myTeamWon ? 'مبروك لفريقك! 🎉' : 'حظًا أوفر في المرة القادمة!'}</p>}
      {tie && <p className="finish__msg">بانتظار المضيف ليبدأ جولة فاصلة...</p>}

      <div className="finish__scores">
        <div className="finish__score finish__score--red">
          <span>الأحمر</span>
          <b>{red.score}</b>
        </div>
        <div className="finish__score finish__score--blue">
          <span>الأزرق</span>
          <b>{blue.score}</b>
        </div>
      </div>

      {top && top.score > 0 && (
        <div className="finish__mvp">
          <Avatar id={top.avatar} size={56} />
          <div>
            <div className="finish__mvp-tag">أفضل لاعب</div>
            <b>{top.name}</b> · {top.score} نقاط
          </div>
        </div>
      )}

      <ol className="finish__list">
        {ranked.map((p, i) => (
          <li key={p.id} className={`finish__row finish__row--${p.team}`}>
            <span className="finish__rank">{i + 1}</span>
            <Avatar id={p.avatar} size={36} />
            <span className="finish__name">{p.name}</span>
            <span className="finish__pts">{p.score}</span>
          </li>
        ))}
      </ol>

      <Link to="/" className="btn btn--primary">
        العودة للرئيسية
      </Link>
    </div>
  );
}
