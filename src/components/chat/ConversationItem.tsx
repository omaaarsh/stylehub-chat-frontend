import { formatDistanceToNow } from 'date-fns';
import type { Conversation } from '../../types/chat.types';
import { useParticipantProfile } from '../../hooks/useParticipantProfile';

interface Props {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, isActive, onClick }: Props) {
  const { data: participant } = useParticipantProfile(conversation.otherParticipantId);

  const displayName = participant?.displayName ?? conversation.otherParticipantId.slice(0, 8) + '…';
  const initials = participant?.initials ?? conversation.otherParticipantId.slice(0, 2).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
        isActive ? 'bg-blue-50 border-r-2 border-blue-600' : ''
      }`}
    >
      <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-gray-200">
        {participant?.avatarUrl ? (
          <img
            src={participant.avatarUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-medium">
            {initials}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
          {conversation.lastMessageAt && (
            <span className="text-[10px] text-gray-400 flex-shrink-0">
              {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: false })}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className="text-xs text-gray-500 truncate">
            {conversation.lastMessageAt ? 'Tap to open' : 'No messages yet'}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="flex-shrink-0 bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
