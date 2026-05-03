import { useChatStore } from '../stores/chat.store';
import { useConversations } from '../hooks/useConversations';
import { ConversationList } from '../components/chat/ConversationList';
import { MessageThread } from '../components/chat/MessageThread';
import { EmptyState } from '../components/chat/EmptyState';

export function ChatPage() {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const { data: conversations } = useConversations();

  const activeConversation = conversations?.find((c) => c.id === activeConversationId) ?? null;

  return (
    <div className="flex h-full">
      <div className="w-80 flex-shrink-0">
        <ConversationList />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        {activeConversation ? (
          <MessageThread conversation={activeConversation} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
