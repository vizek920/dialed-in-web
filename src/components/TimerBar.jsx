import { useEffect, useState } from 'react';

// شريط الوقت: يحسب المتبقي من وقت الانتهاء بتوقيت الخادم (لا يتأثر بساعة الجهاز)
export default function TimerBar({ startedAt, endsAt, serverNow, active }) {
  const [now, setNow] = useState(() => serverNow());

  useEffect(() => {
    if (!active) return undefined;
    setNow(serverNow());
    const id = setInterval(() => setNow(serverNow()), 200);
    return () => clearInterval(id);
  }, [active, serverNow, endsAt]);

  const total = Math.max(1, endsAt - startedAt);
  const leftMs = active ? Math.max(0, endsAt - now) : 0;
  const pct = Math.min(100, (leftMs / total) * 100);
  const secs = Math.ceil(leftMs / 1000);
  const urgent = active && secs <= 10;

  return (
    <div className="timer" role="timer" aria-live="off">
      <div className="timer__track">
        <div className={`timer__fill${urgent ? ' timer__fill--urgent' : ''}`} style={{ width: `${pct}%` }} />
      </div>
      <div className={`timer__num${urgent ? ' timer__num--urgent' : ''}`}>{secs}</div>
    </div>
  );
}
