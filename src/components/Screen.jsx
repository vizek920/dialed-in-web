import { Link } from 'react-router-dom';
import Backdrop from './Backdrop.jsx';

// شاشة رسالة بسيطة وسط الخلفية الشتوية (تحميل، خطأ، طرد...)
export default function Screen({ title, children, action }) {
  return (
    <div className="page">
      <Backdrop />
      <main className="page__content">
        <div className="soon glass">
          <img className="soon__logo" src="/logo.png" alt="" />
          {title && <h1 className="soon__title title-gradient">{title}</h1>}
          <div className="soon__text">{children}</div>
          {action === undefined ? (
            <Link to="/" className="btn btn--primary">
              العودة للرئيسية
            </Link>
          ) : (
            action
          )}
        </div>
      </main>
    </div>
  );
}
