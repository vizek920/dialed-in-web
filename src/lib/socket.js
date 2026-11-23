import { io } from 'socket.io-client';
import { API_URL } from './config.js';

let socket = null;

// اتصال واحد مشترك لكل الموقع، لا يبدأ إلا عند الحاجة إليه.
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
