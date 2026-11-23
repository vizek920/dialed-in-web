import { Link } from 'react-router-dom';
import Backdrop from '../components/Backdrop.jsx';

export default function NotFound() {
  return (
    <div className="page">
      <Backdrop />
      <main className="page__content">
        <div className="soon glass">
          <h1 className="soon__title title-gradient">٤٠٤</h1>
          <p className="soon__text">ضاع الطريق وسط الثلج.. هذه الصفحة غير موجودة.</p>
          <Link to="/" className="btn btn--primary">
            العودة للرئيسية
          </Link>
        </div>
      </main>
    </div>
  );
}
