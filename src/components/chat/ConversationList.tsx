import { useConversations } from '../../hooks/useConversations';
import { useChatStore } from '../../stores/chat.store';
import { ConversationItem } from './ConversationItem';

export function ConversationList() {
  const { data: conversations, isLoading } = useConversations();
  const { activeConversationId, setActiveConversation } = useChatStore();

  return (
    <div className="flex flex-col h-full border-r border-gray-200 bg-white">
      <div className="px-4 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-900">Messages</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-20 text-sm text-gray-400">
            Loading…
          </div>
        )}
        {!isLoading && (!conversations || conversations.length === 0) && (
          <div className="flex items-center justify-center h-20 text-sm text-gray-400">
            No conversations yet
          </div>
        )}
        {conversations?.map((conv) => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            isActive={conv.id === activeConversationId}
            onClick={() => setActiveConversation(conv.id)}
          />
        ))}
      </div>
    </div>
  );
}
