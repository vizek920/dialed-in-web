import { useState } from 'react';
import { ArrowLeftIcon } from './Icons.jsx';
import { hostLogin } from '../lib/hostAuth.js';
import { errorText } from '../lib/errors.js';

// نموذج دخول (اسم مستخدم + كلمة مرور) تستعمله صفحة المضيف ولوحة الإدارة
export default function LoginForm({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!username.trim() || !password) return setError('اكتب اسم المستخدم وكلمة المرور.');
    setError('');
    setBusy(true);
    const timer = setTimeout(() => setSlow(true), 4000); // الخادم المجاني قد يكون نائمًا
    const res = await hostLogin(username.trim(), password);
    clearTimeout(timer);
    setSlow(false);
    setBusy(false);
    if (!res.ok) return setError(errorText(res.error));
    setPassword('');
    onSuccess(res);
  };

  return (
    <form className="hostlogin__form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="host-user">اسم المستخدم</label>
        <input
          id="host-user"
          className="input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          dir="ltr"
          autoCapitalize="none"
          spellCheck={false}
        />
      </div>
      <div className="field">
        <label htmlFor="host-pass">كلمة المرور</label>
        <input
          id="host-pass"
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          dir="ltr"
        />
      </div>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
        {busy ? (slow ? 'جارٍ إيقاظ الخادم، قد يستغرق دقيقة...' : 'جارٍ الدخول...') : 'تسجيل الدخول'}
        {!busy && <ArrowLeftIcon />}
      </button>
    </form>
  );
}
