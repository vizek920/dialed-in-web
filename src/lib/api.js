import { API_URL } from './config.js';
import { clearHostAuth, loadHostAuth } from './hostAuth.js';

// طلب REST مصادَق عليه برمز المضيف/المدير. لا يرمي أبدًا: يُرجع { ok, error, ...data }.
export async function api(method, path, body) {
  const auth = loadHostAuth();
  if (!auth) return { ok: false, error: 'unauthorized', status: 401 };
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${auth.token}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) clearHostAuth();
    if (!res.ok) return { ok: false, status: res.status, error: data.error || 'server_error' };
    return { ok: true, status: res.status, ...data };
  } catch {
    return { ok: false, error: 'offline', status: 0 };
  }
}
