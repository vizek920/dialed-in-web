import Avatar from './Avatar.jsx';

const TEAM_LABEL = { red: 'الفريق الأحمر', blue: 'الفريق الأزرق' };

// لوحة فريق: المجموع، واللاعبون مع نقاطهم، ومن يلعب الآن
// gains: { [playerId]: { total, bonus } } عند كشف الجولة
export default function TeamPanel({ team, score, players, activeId, meId, gains, gain, renderActions }) {
  return (
    <section className={`team team--${team}`} aria-label={TEAM_LABEL[team]}>
      <div className="team__tag">{TEAM_LABEL[team]}</div>
      <div className="team__score">
        {score}
        {gain ? <span dir="ltr" className={`team__gain${gain.bonus ? ' team__gain--bonus' : ''}`}>+{gain.total}</span> : null}
      </div>

      <ul className="team__list">
        {players.length === 0 && <li className="team__empty">لا يوجد لاعبون بعد</li>}
        {players.map((p) => {
          const active = p.id === activeId;
          const g = gains?.[p.id];
          return (
            <li
              key={p.id}
              className={`prow${active ? ' prow--active' : ''}${p.connected ? '' : ' prow--off'}${g ? ' prow--gain' : ''}`}
            >
              <Avatar id={p.avatar} size={44} />
              <div className="prow__text">
                <div className="prow__name">
                  {p.name}
                  {p.id === meId && <span className="prow__me">أنت</span>}
                </div>
                <div className="prow__sub">
                  {!p.connected ? 'غير متصل · ' : active ? 'يلعب الآن · ' : ''}
                  {p.score} نقاط
                </div>
              </div>
              {g ? <span dir="ltr" className={`prow__gain${g.bonus ? ' prow__gain--bonus' : ''}`}>+{g.total}</span> : null}
              {renderActions ? <div className="prow__actions">{renderActions(p)}</div> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
