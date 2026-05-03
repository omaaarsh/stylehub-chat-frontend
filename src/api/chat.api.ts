import { api } from '../lib/axios';
import type { Conversation, Message } from '../types/chat.types';
import type { PaginationResponse, CursorPaginationResponse } from '../types/pagination.types';

export const chatApi = {
  getConversations: (params: { limit: number; offset: number }): Promise<PaginationResponse<Conversation>> =>
    api.get<PaginationResponse<Conversation>>('/chat/conversations', { params }).then((r) => r.data),

  getOrCreateConversation: (participantId: string): Promise<Conversation> =>
    api.post<Conversation>('/chat/conversations', { participantId }).then((r) => r.data),

  getMessages: (
    conversationId: string,
    params: { limit: number; cursor?: string },
  ): Promise<CursorPaginationResponse<Message>> =>
    api
      .get<CursorPaginationResponse<Message>>(`/chat/conversations/${conversationId}/messages`, { params })
      .then((r) => r.data),

  sendMessage: (conversationId: string, content: string): Promise<Message> =>
    api.post<Message>(`/chat/conversations/${conversationId}/messages`, { content }).then((r) => r.data),

  sendDirectMessage: (recipientId: string, content: string): Promise<Message> =>
    api.post<Message>('/chat/messages', { recipientId, content }).then((r) => r.data),

  markSeen: (conversationId: string): Promise<void> =>
    api.patch(`/chat/conversations/${conversationId}/seen`).then(() => undefined),
};
