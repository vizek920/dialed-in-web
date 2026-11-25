import { useEffect, useRef, useState } from 'react';
import { SendIcon } from './Icons.jsx';
import { errorText } from '../lib/errors.js';

const NAME_COLOR = { red: '#FF8F94', blue: '#7FA6FF' };

// دردشة الغرفة والفريق.
// teamMode: 'send' للاعب، و'read' للمضيف (يقرأ دردشة الفرق ولا يكتب فيها)
// onMute(playerId, muted) + mutedIds: لإظهار زر كتم بجانب رسائل اللاعبين (للمضيف)
export default function Chat({ messages, onSend, canTeam = true, teamMode = 'send', meId, onMute, mutedIds = [] }) {
  const [tab, setTab] = useState('room');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const shown = messages.filter((m) => m.channel === tab);

  // تمرير داخل صندوق الدردشة فقط (لا يحرّك الصفحة)
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown.length, tab]);

  const readOnly = tab === 'team' && teamMode === 'read';

  const submit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending || readOnly) return;
    setSending(true);
    const res = await onSend(tab, value);
    setSending(false);
    if (res.ok) {
      setText('');
      setError('');
    } else {
      setError(errorText(res.error));
    }
  };

  return (
    <section className="chat glass" aria-label="الدردشة">
      <div className="chat__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'room'}
          className={`chat__tab${tab === 'room' ? ' chat__tab--on' : ''}`}
          onClick={() => setTab('room')}
        >
          الغرفة
        </button>
        {canTeam && (
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'team'}
            className={`chat__tab${tab === 'team' ? ' chat__tab--on' : ''}`}
            onClick={() => setTab('team')}
          >
            الفريق
          </button>
        )}
      </div>

      <div className="chat__list" ref={listRef} aria-live="polite">
        {shown.length === 0 && <div className="chat__empty">لا رسائل بعد. ابدأ الحديث!</div>}
        {shown.map((m) => (
          <div key={m.id} className="chat__msg">
            <b
              className={m.from.isHost ? 'chat__host' : ''}
              style={m.from.isHost ? undefined : { color: NAME_COLOR[m.from.team] }}
            >
              {m.from.name}
              {m.from.id === meId ? ' (أنت)' : ''}
            </b>
            <span className="chat__bubble">{m.text}</span>
            {onMute && !m.from.isHost && (
              <button
                type="button"
                className="chat__mute"
                onClick={() => onMute(m.from.id, !mutedIds.includes(m.from.id))}
              >
                {mutedIds.includes(m.from.id) ? 'إلغاء الكتم' : 'كتم'}
              </button>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="chat__error" role="alert">
          {error}
        </div>
      )}
      <form className="chat__form" onSubmit={submit}>
        <label htmlFor="chat-input" className="sr-only">
          اكتب رسالة
        </label>
        <input
          id="chat-input"
          className="input chat__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
          disabled={readOnly}
          placeholder={readOnly ? 'دردشة الفريق للقراءة فقط' : tab === 'team' ? 'رسالة لفريقك فقط...' : 'اكتب رسالة...'}
          autoComplete="off"
        />
        <button type="submit" className="chat__send" aria-label="إرسال" disabled={sending || readOnly || !text.trim()}>
          <SendIcon />
        </button>
      </form>
    </section>
  );
}
