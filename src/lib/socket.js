import { io } from 'socket.io-client';
import { API_URL } from './config.js';

let socket = null;

// اتصال واحد مشترك لكل الموقع
export function getSocket() {
  if (!socket) {
    socket = io(API_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 800,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}

// يتصل ويفي بالوعد عند نجاح الاتصال. الخادم المجاني قد يحتاج حتى دقيقة ليستيقظ.
export function connectSocket(timeoutMs = 75_000) {
  const s = getSocket();
  if (s.connected) return Promise.resolve(s);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      s.off('connect', onConnect);
      reject(new Error('timeout'));
    }, timeoutMs);
    function onConnect() {
      clearTimeout(timer);
      resolve(s);
    }
    s.once('connect', onConnect);
    s.connect();
  });
}

// يرسل حدثًا وينتظر الرد. لا يرمي أبدًا: يُرجع { ok:false, error } عند الفشل.
export function request(event, payload = {}, timeoutMs = 10_000) {
  const s = getSocket();
  return new Promise((resolve) => {
    if (!s.connected) {
      resolve({ ok: false, error: 'offline' });
      return;
    }
    const timer = setTimeout(() => resolve({ ok: false, error: 'timeout' }), timeoutMs);
    s.emit(event, payload, (res) => {
      clearTimeout(timer);
      resolve(res && typeof res === 'object' ? res : { ok: false, error: 'server_error' });
    });
  });
}
