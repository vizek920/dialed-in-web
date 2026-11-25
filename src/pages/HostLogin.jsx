import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Backdrop from '../components/Backdrop.jsx';
import LoginForm from '../components/LoginForm.jsx';
import { ArrowLeftIcon } from '../components/Icons.jsx';
import { clearHostAuth, loadHostAuth, loadLastHostRoom } from '../lib/hostAuth.js';

// دخول المضيف: اسم مستخدم وكلمة مرور. إن كان مسجّلًا من قبل تظهر له خياراته مباشرة.
export default function HostLogin() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(loadHostAuth);
  const lastRoom = loadLastHostRoom();
  const isStaff = auth && (auth.role === 'admin' || auth.role === 'moderator');

  const logout = () => {
    clearHostAuth();
    setAuth(null);
  };

  return (
    <div className="page">
      <Backdrop />
      <main className="page__content">
        <div className="join glass hostlogin">
          <header className="join__head">
            <Link to="/" className="join__logo" aria-label="العودة إلى الرئيسية">
              <span className="join__halo" />
              <img src="/logo.png" alt="شعار بين بين" width="104" height="104" />
            </Link>
            <div>
              <h1 className="join__title title-gradient">منطقة المضيف</h1>
              <p className="join__sub">أنشئ غرفتك وأدِر اللعبة بنفسك</p>
            </div>
          </header>

          {auth ? (
            <div className="hostlogin__in">
              <p className="hostlogin__hello">
                أهلًا <b>{auth.username}</b>
              </p>
              <Link to="/host/new" className="btn btn--primary btn--block">
                إنشاء غرفة جديدة
                <ArrowLeftIcon />
              </Link>
              {lastRoom && (
                <Link to={`/host/room/${lastRoom}`} className="btn btn--block">
                  العودة إلى غرفتي ({lastRoom})
                </Link>
              )}
              {isStaff && (
                <Link to="/admin" className="btn btn--block">
                  لوحة الإدارة
                </Link>
              )}
              <button type="button" className="linkbtn" onClick={logout}>
                تسجيل الخروج
              </button>
            </div>
          ) : (
            <>
              <LoginForm
                onSuccess={(res) => {
                  setAuth(res);
                  navigate('/host/new');
                }}
              />
              <p className="hostlogin__hint">الحسابات يمنحها لك مدير الموقع.</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
