import { useRef } from 'react';
import { getSocket } from '../lib/socket';
import { useChatStore } from '../stores/chat.store';
import { useAuthStore } from '../stores/auth.store';

export function useTypingIndicator(conversationId: string | null) {
  const typingUsers = useChatStore((s) => s.typingUsers);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isTypingRef = useRef(false);

  // True if any participant other than the current user is typing in this conversation
  const isOtherUserTyping =
    !!conversationId &&
    !!typingUsers[conversationId] &&
    Object.keys(typingUsers[conversationId]).some((uid) => uid !== currentUserId);

  function handleInputChange() {
    if (!conversationId) return;
    const socket = getSocket();
    if (!socket?.connected) return;

    // Per spec: emit true on every keystroke — the server handles debouncing
    isTypingRef.current = true;
    socket.emit('chat:typing', { conversationId, isTyping: true });
  }

  function stopTyping() {
    if (!conversationId || !isTypingRef.current) return;
    const socket = getSocket();
    isTypingRef.current = false;
    socket?.emit('chat:typing', { conversationId, isTyping: false });
  }

  return { handleInputChange, stopTyping, isOtherUserTyping };
}
