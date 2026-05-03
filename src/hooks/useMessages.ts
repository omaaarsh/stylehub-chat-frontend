import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chat.api';
import type { Message } from '../types/chat.types';
import type { CursorPaginationResponse } from '../types/pagination.types';

export function useMessages(conversationId: string | null) {
  return useInfiniteQuery<CursorPaginationResponse<Message>>({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) =>
      chatApi.getMessages(conversationId!, {
        limit: 30,
        cursor: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
    enabled: !!conversationId,
    staleTime: 0,
  });
}

export function useMessagesQueryClient() {
  return useQueryClient();
}
