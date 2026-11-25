import { useCallback, useEffect, useRef, useState } from 'react';
import { connectSocket, getSocket, request } from '../lib/socket.js';
import { clearHostRoom, loadHostRoom } from '../lib/hostAuth.js';

const CHAT_KEEP = 200;

// حالة غرفة المضيف الحية: العودة التلقائية، الأسئلة (مع الأهداف)، المؤشرات، الدردشة، وأوامر التحكم
export function useHostRoom(code) {
  // connecting | ready | no_session | closed | error
  const [status, setStatus] = useState('connecting');
  const [online, setOnline] = useState(true);
  const [room, setRoom] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [markers, setMarkers] = useState({});
  const [chat, setChat] = useState([]);
  const offsetRef = useRef(0);

  useEffect(() => {
    const saved = loadHostRoom(code);
    if (!saved?.hostToken) {
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
      const res = await request('host:rejoin', { code, hostToken: saved.hostToken });
      if (!alive) return;
      if (res.ok) {
        applyState(res.state);
        setQuestions(res.questions ?? []);
        setChat(res.chat ?? []);
        setStatus('ready');
      } else if (res.error === 'no_room' || res.error === 'bad_token') {
        clearHostRoom(code);
        setStatus(res.error === 'no_room' ? 'closed' : 'no_session');
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
    const onQuestions = (list) => alive && setQuestions(list ?? []);
    const onClosed = () => {
      clearHostRoom(code);
      setStatus('closed');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:state', applyState);
    socket.on('round:marker', onMarker);
    socket.on('chat:message', onChat);
    socket.on('host:questions', onQuestions);
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
      socket.off('host:questions', onQuestions);
      socket.off('room:closed', onClosed);
    };
  }, [code]);

  const serverNow = useCallback(() => Date.now() + offsetRef.current, []);
  const act = useCallback((event, payload) => request(event, payload), []);
  const sendChat = useCallback((channel, text) => request('chat:send', { channel, text }), []);

  return { status, online, room, questions, markers, chat, serverNow, act, sendChat };
}
