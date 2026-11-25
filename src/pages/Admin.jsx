import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Backdrop from '../components/Backdrop.jsx';
import LoginForm from '../components/LoginForm.jsx';
import AdminRooms from '../components/admin/AdminRooms.jsx';
import AdminSuggestions from '../components/admin/AdminSuggestions.jsx';
import AdminBank from '../components/admin/AdminBank.jsx';
import AdminHosts from '../components/admin/AdminHosts.jsx';
import { api } from '../lib/api.js';
import { clearHostAuth, loadHostAuth } from '../lib/hostAuth.js';
import { useLoad } from '../state/useLoad.js';

const ROLE = { host: 'مضيف', moderator: 'مشرف', admin: 'مدير' };

function Shell({ children }) {
  return (
    <div className="page">
      <Backdrop />
      <main className="page__content">{children}</main>
    </div>
  );
}

// لوحة الإدارة: المشرف يرى الغرف والمقترحات، والمدير يرى كل التبويبات
export default function Admin() {
  const [auth, setAuth] = useState(loadHostAuth);

  if (!auth) {
    return (
      <Shell>
        <div className="join glass hostlogin">
          <header className="join__head">
            <Link to="/" className="join__logo" aria-label="العودة إلى الرئيسية">
              <span className="join__halo" />
              <img src="/logo.png" alt="شعار بين بين" width="104" height="104" />
            </Link>
            <div>
              <h1 className="join__title title-gradient">لوحة الإدارة</h1>
              <p className="join__sub">للمدير والمشرفين فقط</p>
            </div>
          </header>
          <LoginForm onSuccess={setAuth} />
        </div>
      </Shell>
    );
  }

  if (auth.role !== 'admin' && auth.role !== 'moderator') {
    return (
      <Shell>
        <div className="join glass hostlogin">
          <h1 className="join__title title-gradient">لا تملك صلاحية</h1>
          <p className="join__sub">حسابك ({auth.username}) حساب مضيف، ولوحة الإدارة للمدير والمشرفين.</p>
          <Link to="/host" className="btn btn--primary btn--block">
            منطقة المضيف
          </Link>
          <button
            type="button"
            className="linkbtn"
            onClick={() => {
              clearHostAuth();
              setAuth(null);
            }}
          >
            الدخول بحساب آخر
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Panel
      auth={auth}
      onLogout={() => {
        clearHostAuth();
        setAuth(null);
      }}
    />
  );
}

function Panel({ auth, onLogout }) {
  const isAdmin = auth.role === 'admin';
  const [tab, setTab] = useState('rooms');
  const [notice, setNotice] = useState('');
  const overview = useLoad(() => api('GET', '/admin/overview'), [], 10000);
  const o = overview.data;

  // 401 (انتهت الجلسة أو أُوقف الحساب) يعيدنا لشاشة الدخول
  const expired = overview.error === 'unauthorized';
  useEffect(() => {
    if (expired) onLogout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired]);
  if (expired) return null;

  const tabs = [
    { id: 'rooms', label: 'الغرف الحية' },
    { id: 'suggestions', label: 'المقترحات', badge: o?.pending },
    ...(isAdmin ? [{ id: 'bank', label: 'بنك الأسئلة' }, { id: 'hosts', label: 'الحسابات' }] : []),
  ];
  const go = (id) => {
    setTab(id);
    setNotice('');
  };

  return (
    <Shell>
      <div className="adm">
        <header className="adm__head">
          <Link to="/" className="room__logo" aria-label="الرئيسية">
            <span className="join__halo" />
            <img src="/logo.png" alt="شعار بين بين" width="72" height="72" />
          </Link>
          <div className="adm__title">
            <h1 className="join__title title-gradient">لوحة الإدارة</h1>
            <p className="join__sub">
              {auth.username} · {ROLE[auth.role]}
            </p>
          </div>
          <div className="adm__user">
            <Link to="/host" className="btn btn--small">
              منطقة المضيف
            </Link>
            <button type="button" className="btn btn--small" onClick={onLogout}>
              خروج
            </button>
          </div>
        </header>

        <div className="adm__stats">
          {[
            ['غرف حية', o?.rooms],
            ['لاعبون الآن', o?.players],
            ['مقترحات بانتظارك', o?.pending],
            ['أسئلة البنك', o?.approved],
            ...(isAdmin ? [['الحسابات', o?.hosts]] : []),
          ].map(([label, value]) => (
            <div key={label} className="stat glass">
              <b>{value ?? '—'}</b>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <nav className="tabs" role="tablist" aria-label="أقسام الإدارة">
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`tabs__btn${tab === t.id ? ' tabs__btn--on' : ''}`} onClick={() => go(t.id)}>
              {t.label}
              {t.badge > 0 && <span className="tabs__badge">{t.badge}</span>}
            </button>
          ))}
        </nav>

        {notice && (
          <div className="form-error" role="alert">
            {notice}
          </div>
        )}

        <section className="adm__body" role="tabpanel">
          {tab === 'rooms' && <AdminRooms notify={setNotice} />}
          {tab === 'suggestions' && <AdminSuggestions notify={setNotice} onChanged={overview.reload} />}
          {tab === 'bank' && isAdmin && <AdminBank notify={setNotice} onChanged={overview.reload} />}
          {tab === 'hosts' && isAdmin && <AdminHosts notify={setNotice} me={auth} />}
        </section>
      </div>
    </Shell>
  );
}
