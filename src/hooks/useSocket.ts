import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket, disconnectSocket, reconnectSocket } from '../lib/socket';
import { useAuthStore } from '../stores/auth.store';
import { useChatStore } from '../stores/chat.store';
import { token } from '../lib/token';
import { api } from '../lib/axios';
import type { Message, StatusEvent, TypingEvent } from '../types/chat.types';
import type { CursorPaginationResponse } from '../types/pagination.types';

export function useSocket() {
  const { isAuthenticated, accessToken, setTokens, logout } = useAuthStore();
  const { setTyping } = useChatStore();
  const queryClient = useQueryClient();
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socket = connectSocket(accessToken);

    socket.on('chat:message', (msg: Message) => {
      // Prepend incoming message to the newest page — immutable
      queryClient.setQueryData<{ pages: CursorPaginationResponse<Message>[]; pageParams: unknown[] }>(
        ['messages', msg.conversationId],
        (old) => {
          if (!old || old.pages.length === 0) return old;
          const [first, ...rest] = old.pages;
          return {
            ...old,
            pages: [{ ...first, items: [msg, ...first.items] }, ...rest],
          };
        },
      );
      // Refresh conversation list so unreadCount and lastMessageAt stay current
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    socket.on('chat:status', (event: StatusEvent) => {
      // Update message status across all cached pages — immutable
      queryClient.setQueriesData<{ pages: CursorPaginationResponse<Message>[]; pageParams: unknown[] }>(
        { queryKey: ['messages'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((m) =>
                m.id === event.messageId ? { ...m, status: event.status } : m,
              ),
            })),
          };
        },
      );
    });

    socket.on('chat:typing', (event: TypingEvent) => {
      setTyping(event.conversationId, event.userId, event.isTyping);
    });

    socket.on('chat:error', (_data: { message: string }) => {
      // chat:send failed — refresh conversations in case last-message state is stale
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    // Token expired mid-session: server force-disconnects → refresh token → reconnect
    socket.on('disconnect', (reason) => {
      if (reason !== 'io server disconnect' || isRefreshingRef.current) return;

      isRefreshingRef.current = true;
      const refreshToken = token.getRefresh();

      if (!refreshToken) {
        logout();
        isRefreshingRef.current = false;
        return;
      }

      api
        .post<{ accessToken: string; refreshToken: string }>('/auth/refresh', null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        })
        .then(({ data }) => {
          setTokens(data.accessToken, data.refreshToken);
          reconnectSocket(data.accessToken);
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          isRefreshingRef.current = false;
        });
    });

    return () => {
      socket.off('chat:message');
      socket.off('chat:status');
      socket.off('chat:typing');
      socket.off('chat:error');
      socket.off('disconnect');
    };
  }, [isAuthenticated, accessToken, queryClient, setTyping, setTokens, logout]);

  useEffect(() => {
    if (!isAuthenticated) disconnectSocket();
  }, [isAuthenticated]);
}
