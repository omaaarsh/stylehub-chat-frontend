import { io, Socket } from 'socket.io-client';

const BASE_URL = "https://style-hub-social-media-be-d369dfc7ce40.herokuapp.com";

let socket: Socket | null = null;

export function connectSocket(accessToken: string): Socket {
  if (socket?.connected) return socket;

  // Clean up stale disconnected socket before creating a new one
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(BASE_URL, {
    transports: ['websocket'],
    auth: { token: accessToken },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return socket;
}

/** Force a full reconnect with a new token (call after token refresh on disconnect). */
export function reconnectSocket(newAccessToken: string): Socket {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  return connectSocket(newAccessToken);
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
