export type MessageStatus = 'SENT' | 'DELIVERED' | 'SEEN';

export interface Conversation {
  id: string;
  otherParticipantId: string;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  status: MessageStatus;
  seenAt: string | null;
  createdAt: string;
}

export interface TypingEvent {
  userId: string;
  conversationId: string;
  isTyping: boolean;
}

export interface StatusEvent {
  messageId: string;
  status: MessageStatus;
  timestamp: string;
}
