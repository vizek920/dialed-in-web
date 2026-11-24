import { AVATAR_SYMBOLS } from '../lib/avatarSymbols.js';

// يُركَّب مرة واحدة في App ويعرّف رموز الشخصيات لتستعملها <use> في كل مكان
export function AvatarSprites() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        {Object.entries(AVATAR_SYMBOLS).map(([id, body]) => (
          <g key={id} id={`a-${id}`} dangerouslySetInnerHTML={{ __html: body }} />
        ))}
      </defs>
    </svg>
  );
}

export default function Avatar({ id, size = 44, className = '' }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      {id && AVATAR_SYMBOLS[id] ? <use href={`#a-${id}`} /> : null}
    </svg>
  );
}
