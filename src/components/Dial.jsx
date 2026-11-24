import { useCallback, useRef } from 'react';
import {
  VB_W,
  VB_H,
  CX,
  CY,
  R_RIM,
  R_ORBIT,
  TICKS,
  BAND_STYLE,
  bandPath,
  pointAt,
  pointerToPos,
  posToAngle,
  clampPos,
} from '../lib/dial.js';

const TEAM_COLOR = { red: '#E5484D', blue: '#3B6BFF' };
const LOCKED_COLOR = '#7CF2B0';

/**
 * قرص المقياس.
 * markers: [{ id, name, avatar, team, pos, locked, isMe, gain, bonus }]
 * interactive: يسمح للاعب (الدور الحالي) بالسحب والضغط ولوحة المفاتيح
 * reveal: يعرض النطاقات والهدف والنقاط (يتطلب question.target)
 */
export default function Dial({ question, markers, interactive = false, reveal = false, onMove, myPos }) {
  const svgRef = useRef(null);
  const dragging = useRef(false);

  const posFromEvent = useCallback((e) => {
    const rect = svgRef.current.getBoundingClientRect();
    return pointerToPos(e.clientX, e.clientY, rect);
  }, []);

  const handleDown = (e) => {
    if (!interactive) return;
    dragging.current = true;
    svgRef.current.setPointerCapture?.(e.pointerId);
    onMove(posFromEvent(e));
  };
  const handleMove = (e) => {
    if (interactive && dragging.current) onMove(posFromEvent(e));
  };
  const handleUp = (e) => {
    dragging.current = false;
    svgRef.current?.releasePointerCapture?.(e.pointerId);
  };
  const handleKey = (e) => {
    if (!interactive) return;
    const step = e.shiftKey ? 5 : 1;
    const base = typeof myPos === 'number' ? myPos : 50;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onMove(clampPos(base + step));
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onMove(clampPos(base - step));
    else return;
    e.preventDefault();
  };

  const q = question;
  const showReveal = reveal && typeof q.target === 'number';
  const w = q.zoneWidth;

  return (
    <svg
      ref={svgRef}
      className={`dial${interactive ? ' dial--active' : ''}`}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onKeyDown={handleKey}
      tabIndex={interactive ? 0 : -1}
      role="img"
      aria-label={`قرص المقياس بين ${q.left} و${q.right}${interactive ? '، اسحب المؤشر أو استخدم الأسهم لتحديد مكانك' : ''}`}
    >
      <defs>
        <linearGradient id="dial-ice" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={showReveal ? '#5BA9B5' : '#93E6DB'} />
          <stop offset="1" stopColor={showReveal ? '#25728A' : '#3E9FB3'} />
        </linearGradient>
        <radialGradient id="dial-frost" cx="0.3" cy="0.2" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".34" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <path d={`M${CX - R_RIM} ${CY}A${R_RIM} ${R_RIM} 0 0 1 ${CX + R_RIM} ${CY}Z`} fill="url(#dial-ice)" />
      <path d={`M${CX - R_RIM} ${CY}A${R_RIM} ${R_RIM} 0 0 1 ${CX + R_RIM} ${CY}Z`} fill="url(#dial-frost)" />
      <path d="M150 430A250 250 0 0 1 650 430" fill="none" stroke="#FFF" strokeOpacity=".16" strokeWidth="3" />
      <path d="M230 430A170 170 0 0 1 570 430" fill="none" stroke="#FFF" strokeOpacity=".14" strokeWidth="3" />

      {showReveal &&
        q.points.map((pts, k) => {
          const start = q.target - 2.5 * w + k * w;
          const mid = start + w / 2;
          const label = pointAt(mid, 225);
          return (
            <g key={k}>
              <path
                d={bandPath(start, start + w)}
                fill={BAND_STYLE[k].fill}
                className="dial__band"
                style={{ animationDelay: `${0.2 + k * 0.18}s` }}
              />
              <text
                transform={`translate(${label.x.toFixed(1)} ${label.y.toFixed(1)}) rotate(${(90 - posToAngle(mid)).toFixed(1)})`}
                className="dial__band-num dial__fade"
                fill={BAND_STYLE[k].text}
                style={{ animationDelay: `${0.5 + k * 0.18}s` }}
              >
                {pts}
              </text>
            </g>
          );
        })}

      <path
        d={`M${CX - R_RIM} ${CY}A${R_RIM} ${R_RIM} 0 0 1 ${CX + R_RIM} ${CY}`}
        fill="none"
        stroke="#EAF7FF"
        strokeWidth="7"
        strokeOpacity=".9"
      />
      {!showReveal && (
        <path d={TICKS} stroke="#EAF7FF" strokeWidth="3" strokeLinecap="round" strokeOpacity=".75" fill="none" />
      )}
      <path d={`M${CX - R_RIM} ${CY}H${CX + R_RIM}`} stroke="#EAF7FF" strokeWidth="7" strokeLinecap="round" />

      {/* خطوط من المركز إلى كل مؤشر */}
      {!showReveal &&
        markers.map((m) => {
          if (typeof m.pos !== 'number') return null;
          const p = pointAt(m.pos, R_ORBIT);
          return (
            <line
              key={`l-${m.id}`}
              x1={CX}
              y1={CY}
              x2={p.x}
              y2={p.y}
              stroke={TEAM_COLOR[m.team]}
              strokeWidth="12"
              strokeLinecap="round"
              strokeOpacity={m.locked ? 0.95 : 0.7}
            />
          );
        })}

      {/* إبرة الهدف عند الكشف */}
      {showReveal && <Needle target={q.target} />}

      {/* المحور المركزي */}
      <path d={`M${CX - 92} ${CY}A92 92 0 0 1 ${CX + 92} ${CY}Z`} fill="#0E2046" stroke="#CDEBFF" strokeWidth="5" />
      <g transform={`translate(${CX} ${CY - 34})`} stroke="#BFE3FF" strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M0 -28V28" />
        <path d="M-24 -14L24 14" />
        <path d="M-24 14L24 -14" />
      </g>

      {markers.map((m, i) => {
        if (typeof m.pos !== 'number') return null;
        const p = pointAt(m.pos, R_ORBIT);
        const ring = m.locked && !showReveal ? LOCKED_COLOR : TEAM_COLOR[m.team];
        return (
          <g
            key={m.id}
            className={`dial__marker${m.isMe && interactive ? ' dial__marker--mine' : ''}`}
            style={{ transform: `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)` }}
          >
            <g
              className={showReveal ? 'dial__drop' : undefined}
              style={showReveal ? { animationDelay: `${1.2 + i * 0.3}s` } : undefined}
            >
            <circle r="33" fill="#0E2046" stroke={ring} strokeWidth="6" />
            {m.avatar && <use href={`#a-${m.avatar}`} transform="translate(-27 -27) scale(0.84375)" />}
            <text y="58" textAnchor="middle" className="dial__name">
              {m.name}
            </text>
            </g>
            {showReveal && typeof m.gain === 'number' && (
              <g className="dial__gain" style={{ animationDelay: `${1.8 + i * 0.3}s` }}>
                <rect x="-34" y="-86" width="68" height="38" rx="19" fill={m.bonus ? '#7CF2B0' : '#FFD166'} />
                <text y="-66" textAnchor="middle" dominantBaseline="middle" className="dial__gain-text" fill="#2A2000">
                  +{m.gain}
                </text>
              </g>
            )}
          </g>
        );
      })}

      <g className="dial__edge-label" fill="#EAF4FF">
        <path d="M120 452H40M40 452l12-8M40 452l12 8" stroke="#EAF4FF" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x="132" y="460" textAnchor="start">
          {q.left}
        </text>
        <path d="M680 452H760M760 452l-12-8M760 452l-12 8" stroke="#EAF4FF" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x="668" y="460" textAnchor="end">
          {q.right}
        </text>
      </g>
    </svg>
  );
}

function Needle({ target }) {
  const a = pointAt(target, 100);
  const b = pointAt(target, 342);
  const tip = pointAt(target, 360);
  return (
    <g className="dial__needle">
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" />
      <circle cx={tip.x} cy={tip.y} r="13" fill="#FFFFFF" stroke="#FFD166" strokeWidth="5" />
    </g>
  );
}
