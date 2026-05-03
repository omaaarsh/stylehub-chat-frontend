import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { useMessages } from '../../hooks/useMessages';
import { useMarkSeen } from '../../hooks/useMarkSeen';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { useParticipantProfile } from '../../hooks/useParticipantProfile';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import type { Conversation } from '../../types/chat.types';

interface Props {
  conversation: Conversation;
}

export function MessageThread({ conversation }: Props) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // True while user is scrolled near the bottom — only auto-scroll when they are
  const isNearBottomRef = useRef(true);
  // Set while a history load is in flight so we skip the scroll triggered by prepending old messages
  const wasLoadingHistoryRef = useRef(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(conversation.id);
  const { isOtherUserTyping } = useTypingIndicator(conversation.id);
  const { data: participant } = useParticipantProfile(conversation.otherParticipantId);
  useMarkSeen(conversation.id, conversation.unreadCount);

  const displayName = participant?.displayName ?? conversation.otherParticipantId.slice(0, 8) + '…';
  const initials = participant?.initials ?? conversation.otherParticipantId.slice(0, 2).toUpperCase();

  // Server returns items newest-first per page; pages[0] = newest page loaded.
  // Correct display order (oldest at top): reverse page array, then reverse items within each page.
  const messages =
    data?.pages
      .slice()
      .reverse()
      .flatMap((p) => [...p.items].reverse()) ?? [];

  // When conversation switches: snap to bottom immediately
  useEffect(() => {
    isNearBottomRef.current = true;
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [conversation.id]);

  // Track scroll position for sticky-scroll decision
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  // Flag history loads so the subsequent messages.length change doesn't trigger a scroll-to-bottom
  useEffect(() => {
    if (isFetchingNextPage) {
      wasLoadingHistoryRef.current = true;
    }
  }, [isFetchingNextPage]);

  // Auto-scroll on new messages — skip after history loads, skip if user scrolled up
  useEffect(() => {
    if (wasLoadingHistoryRef.current) {
      wasLoadingHistoryRef.current = false;
      return;
    }
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const onTopVisible = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const el = topRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(onTopVisible, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [onTopVisible]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-gray-200">
          {participant?.avatarUrl ? (
            <img
              src={participant.avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-medium">
              {initials}
            </div>
          )}
        </div>
        <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 flex flex-col"
      >
        <div ref={topRef} className="h-1" />
        {isFetchingNextPage && (
          <p className="text-center text-xs text-gray-400 mb-2">Loading older messages…</p>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === currentUserId} />
        ))}
        {isOtherUserTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <MessageInput conversationId={conversation.id} />
    </div>
  );
}
