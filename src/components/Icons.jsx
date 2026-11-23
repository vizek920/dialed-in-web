// أيقونات الواجهة (SVG مضمّنة، تأخذ لون النص الحالي أو الجليدي)
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const PlusIcon = (p) => (
  <svg {...base} strokeWidth="2.6" width="22" height="22" {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const LockIcon = (p) => (
  <svg {...base} strokeWidth="1.9" width="18" height="18" {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const PlayersIcon = (p) => (
  <svg {...base} strokeWidth="1.8" width="26" height="26" {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <circle cx="17" cy="9" r="2.4" />
    <path d="M16.5 14.2c2.6.2 4.5 2.4 4.5 5.1" />
  </svg>
);

export const RoomsIcon = (p) => (
  <svg {...base} strokeWidth="1.8" width="26" height="26" {...p}>
    <path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17" />
    <path d="M3 21h18" />
    <circle cx="14.5" cy="12.5" r=".9" fill="currentColor" />
  </svg>
);

export const ChatIcon = (p) => (
  <svg {...base} strokeWidth="1.8" width="26" height="26" {...p}>
    <path d="M4 5h16v11H9l-5 4z" />
    <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" />
  </svg>
);
