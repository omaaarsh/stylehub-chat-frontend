import { format } from 'date-fns';
import type { Message } from '../../types/chat.types';
import { StatusTicks } from './StatusTicks';

interface Props {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: Props) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
          isOwn
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        }`}
      >
        <p className="break-words whitespace-pre-wrap">{message.content}</p>
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[10px] ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
            {format(new Date(message.createdAt), 'HH:mm')}
          </span>
          {isOwn && <StatusTicks status={message.status} />}
        </div>
      </div>
    </div>
  );
}
