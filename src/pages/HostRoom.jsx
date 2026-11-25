import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Backdrop from '../components/Backdrop.jsx';
import Screen from '../components/Screen.jsx';
import Avatar from '../components/Avatar.jsx';
import Dial from '../components/Dial.jsx';
import TeamPanel from '../components/TeamPanel.jsx';
import TimerBar from '../components/TimerBar.jsx';
import Chat from '../components/Chat.jsx';
import QuestionsManager from '../components/QuestionsManager.jsx';
import { CheckIcon, CopyIcon } from '../components/Icons.jsx';
import { useHostRoom } from '../state/useHostRoom.js';
import { api } from '../lib/api.js';
import { toPayload } from '../lib/questions.js';
import { clearHostRoom } from '../lib/hostAuth.js';
import { normalizeCode } from '../lib/session.js';
import { errorText } from '../lib/errors.js';

const TEAM_NAME = { red: 'الأحمر', blue: 'الأزرق' };

export default function HostRoom() {
  const code = normalizeCode(useParams().code);
  const h = useHostRoom(code);

  if (h.status === 'connecting') {
    return (
      <Screen title="لحظة..." action={null}>
        جارٍ الاتصال بغرفتك. إن كان الخادم نائمًا فقد يستغرق ذلك حتى دقيقة.
      </Screen>
    );
  }
  if (h.status === 'no_session') {
    return (
      <Screen
        title="لا تملك هذه الغرفة"
        action={
          <Link to="/host" className="btn btn--primary">
            منطقة المضيف
          </Link>
        }
      >
        لا نجد مفتاح المضيف لهذه الغرفة في هذا المتصفح. افتحها من الجهاز الذي أنشأتها منه.
      </Screen>
    );
  }
  if (h.status === 'closed') {
    return (
      <Screen
        title="أُغلقت الغرفة"
        action={
          <Link to="/host/new" className="btn btn--primary">
            إنشاء غرفة جديدة
          </Link>
        }
      >
        انتهت هذه الغرفة أو أُغلقت.
      </Screen>
    );
  }
  if (h.status === 'error' || !h.room) {
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
  return <HostView h={h} code={code} />;
}

function HostView({ h, code }) {
  const { room, questions, markers, chat, online, serverNow, act } = h;
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const round = room.round;
  const red = room.players.filter((p) => p.team === 'red');
  const blue = room.players.filter((p) => p.team === 'blue');
  const connected = room.players.filter((p) => p.connected).length;
  const mutedIds = room.players.filter((p) => p.muted).map((p) => p.id);
  const inRound = room.phase === 'playing' || room.phase === 'reveal';

  // يشغّل أمرًا ويعرض خطأه إن فشل
  const run = async (event, payload) => {
    setBusy(true);
    const res = await act(event, payload);
    setBusy(false);
    setError(res.ok ? '' : errorText(res.error));
    return res;
  };

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

  const closeRoom = async () => {
    if (!window.confirm('إغلاق الغرفة نهائيًا؟ سيُخرج كل اللاعبين.')) return;
    const res = await run('host:close');
    if (res.ok) {
      clearHostRoom(code);
      navigate('/host');
    }
  };

  const kick = (p, ban) => {
    const msg = ban ? `حظر ${p.name} من الغرفة نهائيًا؟` : `إخراج ${p.name} من الغرفة؟`;
    if (window.confirm(msg)) run('host:kick', { playerId: p.id, ban });
  };

  const phaseChip =
    room.phase === 'lobby'
      ? 'بانتظار البدء'
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

  const actions = (p) => (
    <>
      <button type="button" className="mini" onClick={() => run('host:mute', { playerId: p.id, muted: !p.muted })}>
        {p.muted ? 'إلغاء الكتم' : 'كتم'}
      </button>
      <button type="button" className="mini" onClick={() => kick(p, false)}>
        طرد
      </button>
      <button type="button" className="mini mini--danger" onClick={() => kick(p, true)}>
        حظر
      </button>
    </>
  );

  const panel = (team, list) => (
    <TeamPanel
      team={team}
      score={room.teams[team].score}
      players={list}
      activeId={activeIds.find((id) => list.some((p) => p.id === id))}
      gains={gains}
      gain={teamGain[team]}
      renderActions={actions}
    />
  );

  // الأسئلة: ما فهرسه ≤ الجولة الحالية مقفل
  const lockedThrough = room.roundIndex;
  const activeIndex = inRound ? round.index : -1;

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
          <Link to="/host" className="room__logo" aria-label="منطقة المضيف">
            <span className="join__halo" />
            <img src="/logo.png" alt="شعار بين بين" width="86" height="86" />
          </Link>
          <div className="room__chips room__chips--end">
            <span className="pill pill--host">أنت المضيف</span>
            <span className="pill pill--green">{connected} متصلون</span>
            {room.locked && <span className="pill pill--warn">الغرفة مقفلة</span>}
          </div>
        </header>

        {room.phase === 'playing' && round && (
          <TimerBar key={round.index} startedAt={round.startedAt} endsAt={round.endsAt} serverNow={serverNow} active />
        )}

        <div className="stage">
          <div className="stage__side stage__side--red">{panel('red', red)}</div>

          <div className="stage__center">
            {room.phase === 'lobby' && <HostLobby room={room} code={code} questions={questions} copyLink={copyLink} copied={copied} busy={busy} run={run} />}
            {inRound && round && <HostPlay key={round.index} room={room} questions={questions} markers={markers} busy={busy} run={run} />}
            {room.phase === 'finished' && <HostFinished room={room} questions={questions} busy={busy} run={run} />}

            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
          </div>

          <div className="stage__side stage__side--blue">{panel('blue', blue)}</div>

          <div className="stage__chat">
            <Chat
              messages={chat}
              onSend={h.sendChat}
              canTeam
              teamMode="read"
              meId="host"
              mutedIds={mutedIds}
              onMute={(playerId, muted) => run('host:mute', { playerId, muted })}
            />
          </div>
        </div>

        <section className="hostbar glass" aria-label="أدوات الغرفة">
          <button type="button" className="btn btn--small" onClick={() => run('host:lockRoom', { locked: !room.locked })} disabled={busy}>
            {room.locked ? 'فتح الغرفة للدخول' : 'قفل الغرفة'}
          </button>
          <button type="button" className="btn btn--small" onClick={copyLink}>
            {copied ? 'تم النسخ' : 'انسخ رابط الدعوة'}
          </button>
          <button type="button" className="btn btn--small btn--danger" onClick={closeRoom} disabled={busy}>
            إغلاق الغرفة
          </button>
        </section>

        <div className="glass hostq">
          <QuestionsManager
            questions={questions}
            lockedThrough={lockedThrough}
            activeIndex={activeIndex}
            onAdd={(q) => act('host:addQuestion', { question: q })}
            onUpdate={(i, q) => act('host:updateQuestion', { index: i, question: q })}
            onRemove={(i) => act('host:removeQuestion', { index: i })}
            onAddMany={async (list) => {
              for (const question of list) {
                const res = await act('host:addQuestion', { question });
                if (!res.ok) return res;
              }
              return { ok: true };
            }}
            onSaveMine={(q) => api('POST', '/bank/mine', toPayload(q))}
          />
        </div>
      </main>
    </div>
  );
}

/* ───────── قبل البدء ───────── */
function HostLobby({ room, code, questions, copyLink, copied, busy, run }) {
  const online = room.players.filter((p) => p.connected).length;
  const noQuestion = questions.length === 0;
  const can = online > 0 && !noQuestion;
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
        <b>{room.players.length}</b> {room.players.length === 1 ? 'لاعب' : 'لاعبين'} في الغرفة · {room.totalRounds} جولات · حتى {room.teamSize} في كل فريق
      </p>
      <button type="button" className="btn btn--primary" onClick={() => run('host:start')} disabled={!can || busy}>
        ابدأ اللعبة
      </button>
      {!can && <span className="actions__hint">{noQuestion ? 'أضف سؤالًا واحدًا على الأقل من قائمة الأسئلة بالأسفل.' : 'بانتظار دخول لاعب واحد على الأقل.'}</span>}
    </div>
  );
}

/* ───────── الجولة ───────── */
function HostPlay({ room, questions, markers, busy, run }) {
  const round = room.round;
  const q = round.question;
  const revealing = room.phase === 'reveal';
  const rows = round.results?.rows ?? [];
  const secret = questions[round.index]?.target;

  const dialMarkers = ['red', 'blue']
    .map((team) => {
      const id = round.players[team];
      const p = id && room.players.find((x) => x.id === id);
      if (!p) return null;
      const live = markers[id];
      const row = rows.find((x) => x.playerId === id);
      return {
        id,
        name: p.name,
        avatar: p.avatar,
        team,
        pos: revealing && row ? row.pos : (live?.pos ?? null),
        locked: Boolean(live?.locked),
        isMe: false,
        gain: revealing && row ? row.total : undefined,
        bonus: revealing && row ? row.bonus > 0 : false,
      };
    })
    .filter(Boolean);

  const isLast = round.index + 1 >= room.totalRounds;
  const hasNext = Boolean(questions[round.index + 1]);
  const closest = rows.filter((x) => x.bonus > 0).map((x) => room.players.find((p) => p.id === x.playerId)?.name);

  return (
    <>
      <div className="clue glass">
        <div className="clue__tag">الشيء المطلوب</div>
        <div className="clue__item">{q.item}</div>
        <div className="clue__hint">
          المقياس: {q.left} ↔ {q.right}
          {!revealing && typeof secret === 'number' && (
            <span className="clue__secret">
              {' '}
              · الهدف المخفي (لك فقط): <bdi>{secret}</bdi>
            </span>
          )}
        </div>
      </div>

      <Dial question={q} markers={dialMarkers} reveal={revealing} ghostTarget={revealing ? undefined : secret} />

      {room.phase === 'playing' && (
        <div className="actions">
          {dialMarkers.map((m) => (
            <span key={m.id} className={`pill ${m.locked ? 'pill--green' : ''}`}>
              {m.name} ({TEAM_NAME[m.team]}): {m.locked ? 'ثبّت ✓' : typeof m.pos === 'number' ? 'يحرّك...' : 'لم يتحرك'}
            </span>
          ))}
          {dialMarkers.length === 0 && <span className="pill">لا يوجد لاعبون متصلون في هذه الجولة</span>}
          <div className="actions actions--tight">
            {['red', 'blue'].map((team) => (
              <button key={team} type="button" className="btn btn--small" onClick={() => run('host:skipTurn', { team })} disabled={busy || !round.players[team]}>
                تخطي دور {TEAM_NAME[team]}
              </button>
            ))}
          </div>
        </div>
      )}

      {revealing && (
        <div className="actions actions--col">
          <span className={`pill ${closest.length ? 'pill--green' : ''}`}>{closest.length ? `الأقرب: ${closest.join(' و ')}` : 'لم يثبّت أحد مؤشره'}</span>
          <button type="button" className="btn btn--primary" onClick={() => run('host:nextRound')} disabled={busy || (!isLast && !hasNext)}>
            {isLast ? 'إنهاء اللعبة وإعلان النتيجة' : 'الجولة التالية'}
          </button>
          {!isLast && !hasNext && <span className="actions__hint">أضف سؤالًا للجولة التالية من قائمة الأسئلة بالأسفل.</span>}
        </div>
      )}
    </>
  );
}

/* ───────── النهاية ───────── */
function HostFinished({ room, questions, busy, run }) {
  const { red, blue } = room.teams;
  const tie = room.winner === 'tie';
  const ranked = [...room.players].sort((a, b) => b.score - a.score);
  const canTiebreak = Boolean(questions[room.roundIndex + 1]);

  return (
    <div className="finish glass">
      <div className={`finish__banner finish__banner--${room.winner}`}>{tie ? 'تعادل!' : `الفريق ${TEAM_NAME[room.winner]} يفوز!`}</div>
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
      {tie && (
        <>
          <button type="button" className="btn btn--primary" onClick={() => run('host:tiebreaker')} disabled={busy || !canTiebreak}>
            ابدأ جولة فاصلة
          </button>
          {!canTiebreak && <span className="actions__hint">أضف سؤالًا جديدًا من قائمة الأسئلة بالأسفل لتُلعب به الجولة الفاصلة.</span>}
        </>
      )}
    </div>
  );
}
