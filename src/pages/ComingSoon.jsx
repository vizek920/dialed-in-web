import { Link } from 'react-router-dom';
import Backdrop from '../components/Backdrop.jsx';

// صفحة مؤقتة للمسارات التي لم تُبنَ بعد
export default function ComingSoon({ title }) {
  return (
    <div className="page">
      <Backdrop />
      <main className="page__content">
        <div className="soon glass">
          <img className="soon__logo" src="/logo.png" alt="" />
          <h1 className="soon__title title-gradient">{title}</h1>
          <p className="soon__text">هذه الصفحة قيد البناء، ستكون جاهزة قريبًا.</p>
          <Link to="/" className="btn btn--primary">
            العودة للرئيسية
          </Link>
        </div>
      </main>
    </div>
  );
}
