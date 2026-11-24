import { useCallback, useEffect, useRef, useState } from 'react';
import { connectSocket, getSocket, request } from '../lib/socket.js';
import { clearSession, loadSession } from '../lib/session.js';

const CHAT_KEEP = 100;

// حالة الغرفة الحية للاعب: الاتصال، العودة التلقائية، التحديثات، المؤشرات، الدردشة
export function useRoom(code) {
  // connecting | ready | no_session | closed | kicked | error
  const [status, setStatus] = useState('connecting');
  const [online, setOnline] = useState(true);
  const [room, setRoom] = useState(null);
  const [me, setMe] = useState(null);
  const [markers, setMarkers] = useState({});
  const [chat, setChat] = useState([]);
  const [banned, setBanned] = useState(false);
  const offsetRef = useRef(0); // فرق الساعة بين الخادم والجهاز

  useEffect(() => {
    const session = loadSession(code);
    if (!session?.token) {
      setStatus('no_session');
      return undefined;
    }
    let alive = true;
    const socket = getSocket();

    const applyState = (state) => {
      if (!alive || !state) return;
      offsetRef.current = state.serverNow - Date.now();
      setRoom(state);
      setMarkers(state.round?.markers ?? {});
    };

    const rejoin = async () => {
      const res = await request('room:rejoin', { code, token: session.token });
      if (!alive) return;
      if (res.ok) {
        setMe({ playerId: res.playerId });
        applyState(res.state);
        setChat(res.chat ?? []);
        setStatus('ready');
      } else if (res.error === 'no_room') {
        clearSession(code);
        setStatus('closed');
      } else if (res.error === 'bad_token') {
        clearSession(code);
        setStatus('no_session');
      } else {
        setStatus((s) => (s === 'ready' ? s : 'error'));
      }
    };

    const onConnect = () => {
      setOnline(true);
      rejoin();
    };
    const onDisconnect = () => setOnline(false);
    const onMarker = (m) => {
      if (!alive) return;
      setMarkers((prev) => ({
        ...prev,
        [m.playerId]: { pos: m.pos, locked: m.locked ?? prev[m.playerId]?.locked ?? false },
      }));
    };
    const onChat = (msg) => {
      if (!alive) return;
      setChat((prev) => (prev.some((x) => x.id === msg.id) ? prev : [...prev, msg].slice(-CHAT_KEEP)));
    };
    const onKicked = ({ ban }) => {
      clearSession(code);
      setBanned(Boolean(ban));
      setStatus('kicked');
    };
    const onClosed = () => {
      clearSession(code);
      setStatus('closed');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:state', applyState);
    socket.on('round:marker', onMarker);
    socket.on('chat:message', onChat);
    socket.on('room:kicked', onKicked);
    socket.on('room:closed', onClosed);

    if (socket.connected) rejoin();
    else connectSocket().catch(() => alive && setStatus('error'));

    return () => {
      alive = false;
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:state', applyState);
      socket.off('round:marker', onMarker);
      socket.off('chat:message', onChat);
      socket.off('room:kicked', onKicked);
      socket.off('room:closed', onClosed);
    };
  }, [code]);

  // الوقت الحالي بتوقيت الخادم
  const serverNow = useCallback(() => Date.now() + offsetRef.current, []);

  const move = useCallback((pos) => getSocket().emit('player:move', { pos }), []);
  const lock = useCallback((pos) => request('player:lock', { pos }), []);
  const sendChat = useCallback((channel, text) => request('chat:send', { channel, text }), []);
  const leave = useCallback(async () => {
    await request('room:leave');
    clearSession(code);
  }, [code]);

  return { status, online, room, me, markers, chat, banned, serverNow, move, lock, sendChat, leave };
}
