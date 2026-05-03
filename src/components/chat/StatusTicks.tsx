import { Check, CheckCheck } from 'lucide-react';
import type { MessageStatus } from '../../types/chat.types';

interface Props {
  status: MessageStatus;
}

export function StatusTicks({ status }: Props) {
  if (status === 'SENT') {
    return <Check size={14} className="text-gray-400" />;
  }
  if (status === 'DELIVERED') {
    return <CheckCheck size={14} className="text-gray-400" />;
  }
  return <CheckCheck size={14} className="text-blue-500" />;
}
