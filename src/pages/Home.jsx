import { Link } from 'react-router-dom';
import Backdrop from '../components/Backdrop.jsx';
import Logo from '../components/Logo.jsx';
import { PlusIcon, LockIcon, PlayersIcon, RoomsIcon, ChatIcon } from '../components/Icons.jsx';

const FEATURES = [
  {
    Icon: PlayersIcon,
    name: 'فريقان ومؤشر لكل لاعب',
    text: 'كل لاعب يضع مؤشره بنفسه، والأقرب إلى الهدف يكسب نقطة إضافية.',
  },
  {
    Icon: RoomsIcon,
    name: 'غرف عامة وخاصة',
    text: 'ادخل أي غرفة مفتوحة، أو أنشئ غرفتك وادعُ أصدقاءك بكود خاص.',
  },
  {
    Icon: ChatIcon,
    name: 'دردشة وأجواء شتوية',
    text: 'تحدّث مع فريقك أثناء اللعب وسط ثلج متساقط وأضواء شمالية.',
  },
];

export default function Home() {
  return (
    <div className="page">
      <Backdrop />
      <main className="page__content">
        <nav className="topbar">
          <div className="topbar__links">
            <Link to="/lobby">الغرف العامة</Link>
            <a href="#how">كيف تلعب؟</a>
          </div>
          <Link to="/host" className="btn btn--small">
            <LockIcon style={{ color: 'var(--ice)' }} />
            دخول المضيف
          </Link>
        </nav>

        <Logo />

        <h1 className="hero__title title-gradient">بين بين</h1>
        <p className="hero__tagline">ضع مؤشرك بين الطرفين.. وكن الأقرب!</p>

        <div className="hero__actions">
          <Link to="/host" className="btn btn--primary">
            <PlusIcon />
            إنشاء غرفة
          </Link>
          <Link to="/join" className="btn">
            الدخول إلى غرفة
          </Link>
          <Link to="/lobby" className="btn">
            الغرف العامة
          </Link>
        </div>

        <section id="how" className="features">
          {FEATURES.map(({ Icon, name, text }) => (
            <article key={name} className="feature glass">
              <div className="feature__head">
                <div className="feature__icon">
                  <Icon style={{ color: 'var(--ice)' }} />
                </div>
                <h2 className="feature__name">{name}</h2>
              </div>
              <p className="feature__text">{text}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
