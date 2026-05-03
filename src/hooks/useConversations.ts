import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../api/chat.api';
import type { Conversation } from '../types/chat.types';

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await chatApi.getConversations({ limit: 50, offset: 0 });
      return res.items;
    },
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}
