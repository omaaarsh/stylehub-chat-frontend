import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chat.api';
import { getSocket } from '../lib/socket';

export function useMarkSeen(conversationId: string | null, unreadCount: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId || unreadCount === 0) return;

    // Emit over WebSocket for real-time receipt delivery to sender
    const socket = getSocket();
    socket?.emit('chat:seen', { conversationId });

    // REST call as persistent write
    chatApi.markSeen(conversationId).then(() => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }).catch(() => {
      // Best-effort — seen marking is non-critical
    });
  }, [conversationId, unreadCount, queryClient]);
}
