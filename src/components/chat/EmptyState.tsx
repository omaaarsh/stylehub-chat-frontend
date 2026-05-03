import { MessageSquare } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
      <MessageSquare size={48} strokeWidth={1} />
      <p className="text-sm">Select a conversation to start chatting</p>
    </div>
  );
}
