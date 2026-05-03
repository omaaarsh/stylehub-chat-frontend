import { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../../api/chat.api';
import { getSocket } from '../../lib/socket';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { useAuthStore } from '../../stores/auth.store';
import type { Message } from '../../types/chat.types';
import type { CursorPaginationResponse } from '../../types/pagination.types';

interface Props {
  conversationId: string;
}

export function MessageInput({ conversationId }: Props) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { handleInputChange, stopTyping } = useTypingIndicator(conversationId);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const send = async () => {
    const text = content.trim();
    if (!text || sending) return;

    setSending(true);
    stopTyping();
    setContent('');

    const socket = getSocket();

    if (socket?.connected) {
      // Primary path: WebSocket — fastest delivery to recipient.
      // Server does not echo chat:message back to sender, so we insert an optimistic
      // entry. Status ticks (DELIVERED/SEEN) won't update this entry because the server's
      // real messageId differs from the temp id; the correct entry loads on next refresh.
      const tempId = `temp-${Date.now()}`;
      const optimistic: Message = {
        id: tempId,
        conversationId,
        senderId: currentUserId ?? '',
        content: text,
        status: 'SENT',
        seenAt: null,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<{ pages: CursorPaginationResponse<Message>[]; pageParams: unknown[] }>(
        ['messages', conversationId],
        (old) => {
          if (!old || old.pages.length === 0) return old;
          const [first, ...rest] = old.pages;
          return { ...old, pages: [{ ...first, items: [optimistic, ...first.items] }, ...rest] };
        },
      );

      socket.emit('chat:send', { conversationId, content: text });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setSending(false);
      textareaRef.current?.focus();
    } else {
      // Fallback path: REST — used when socket is disconnected.
      // REST response returns the real message id so status ticks work correctly.
      try {
        const message = await chatApi.sendMessage(conversationId, text);

        queryClient.setQueryData<{ pages: CursorPaginationResponse<Message>[]; pageParams: unknown[] }>(
          ['messages', conversationId],
          (old) => {
            if (!old || old.pages.length === 0) return old;
            const [first, ...rest] = old.pages;
            return { ...old, pages: [{ ...first, items: [message, ...first.items] }, ...rest] };
          },
        );
        void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } catch {
        setContent(text);
      } finally {
        setSending(false);
        textareaRef.current?.focus();
      }
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <div className="flex items-end gap-2 p-3 border-t border-gray-200 bg-white">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          handleInputChange();
        }}
        onKeyDown={onKeyDown}
        placeholder="Message…"
        rows={1}
        className="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32 overflow-y-auto"
      />
      <button
        onClick={() => void send()}
        disabled={!content.trim() || sending}
        className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors flex-shrink-0"
      >
        <Send size={18} />
      </button>
    </div>
  );
}
