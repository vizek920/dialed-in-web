import { useState } from 'react';
import { api } from '../../lib/api.js';
import { errorText } from '../../lib/errors.js';
import { useLoad } from '../../state/useLoad.js';

const ROLE = { host: 'مضيف', moderator: 'مشرف', admin: 'مدير' };

// الحسابات (للمدير): إنشاء، تغيير الدور، إيقاف، وإعادة تعيين كلمة المرور
export default function AdminHosts({ notify, me }) {
  const { data, error, loading, reload } = useLoad(() => api('GET', '/admin/hosts'), []);
  const hosts = data?.hosts ?? [];
  const [form, setForm] = useState({ username: '', displayName: '', password: '', role: 'host' });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setFormError('');
  };

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await api('POST', '/admin/hosts', { ...form, displayName: form.displayName.trim() || undefined });
    setBusy(false);
    if (!res.ok) return setFormError(errorText(res.error));
    setForm({ username: '', displayName: '', password: '', role: 'host' });
    reload();
  };

  const patch = async (h, body, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    const res = await api('PATCH', `/admin/hosts/${h.id}`, body);
    notify(res.ok ? '' : errorText(res.error));
    reload();
  };
  const resetPassword = async (h) => {
    const pw = window.prompt(`كلمة مرور جديدة لـ ${h.username} (8 أحرف على الأقل):`);
    if (pw) await patch(h, { password: pw });
  };

  return (
    <div className="hosts">
      <form className="hosts__new glass" onSubmit={create} noValidate>
        <h3 className="adm__h">حساب جديد</h3>
        <div className="hosts__fields">
          <div className="field">
            <label htmlFor="n-user">اسم المستخدم</label>
            <input id="n-user" className="input" dir="ltr" value={form.username} maxLength={20} autoCapitalize="none" onChange={(e) => set({ username: e.target.value })} placeholder="مثال: ahmed_1" />
          </div>
          <div className="field">
            <label htmlFor="n-name">الاسم الظاهر</label>
            <input id="n-name" className="input" value={form.displayName} maxLength={30} onChange={(e) => set({ displayName: e.target.value })} placeholder="اختياري" />
          </div>
          <div className="field">
            <label htmlFor="n-pass">كلمة المرور</label>
            <input id="n-pass" className="input" dir="ltr" value={form.password} onChange={(e) => set({ password: e.target.value })} placeholder="8 أحرف على الأقل" autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="n-role">الدور</label>
            <select id="n-role" className="input" value={form.role} onChange={(e) => set({ role: e.target.value })}>
              <option value="host">مضيف</option>
              <option value="moderator">مشرف</option>
              <option value="admin">مدير</option>
            </select>
          </div>
        </div>
        {formError && (
          <div className="form-error" role="alert">
            {formError}
          </div>
        )}
        <button type="submit" className="btn btn--small btn--accent" disabled={busy}>
          {busy ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}
        </button>
        <p className="hostform__hint">المضيف ينشئ الغرف. المشرف يدير الغرف ويراجع المقترحات. المدير يدير كل شيء.</p>
      </form>

      {loading && !data && <p className="adm__empty">جارٍ التحميل...</p>}
      {error && !data && <p className="form-error">{errorText(error)}</p>}

      <ul className="adm__stack">
        {hosts.map((h) => {
          const self = h.id === me.id;
          return (
            <li key={h.id} className={`hrow glass${h.isBanned ? ' hrow--off' : ''}`}>
              <div className="hrow__main">
                <b>{h.displayName}</b>
                <span className="sugg__meta" dir="ltr">
                  @{h.username}
                </span>
                <span className="sugg__meta">
                  {h.lastLoginAt ? `آخر دخول: ${new Date(h.lastLoginAt).toLocaleString('ar-SA')}` : 'لم يدخل بعد'}
                </span>
              </div>
              <div className="hrow__tools">
                {h.isBanned && <span className="pill pill--warn">موقوف</span>}
                <select
                  className="input input--small"
                  aria-label={`دور ${h.username}`}
                  value={h.role}
                  disabled={self}
                  onChange={(e) => patch(h, { role: e.target.value })}
                >
                  {Object.entries(ROLE).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <button type="button" className="mini" onClick={() => resetPassword(h)}>
                  كلمة المرور
                </button>
                <button
                  type="button"
                  className={`mini${h.isBanned ? '' : ' mini--danger'}`}
                  disabled={self}
                  onClick={() => patch(h, { isBanned: !h.isBanned }, h.isBanned ? undefined : `إيقاف حساب ${h.displayName}؟ ستُغلق غرفه الحية فورًا.`)}
                >
                  {h.isBanned ? 'رفع الإيقاف' : 'إيقاف'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
