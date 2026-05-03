import { create } from 'zustand';

// Safety timeouts kept outside Zustand to avoid spurious re-renders
// conversationId → userId → timeoutHandle
const typingTimeouts: Record<string, Record<string, ReturnType<typeof setTimeout>>> = {};

interface ChatState {
  activeConversationId: string | null;
  /** conversationId → { userId: true } for each user currently typing */
  typingUsers: Record<string, Record<string, true>>;
  setActiveConversation: (id: string | null) => void;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  activeConversationId: null,
  typingUsers: {},

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setTyping: (conversationId, userId, isTyping) => {
    // Clear any existing safety timeout for this user in this conversation
    typingTimeouts[conversationId]?.[userId] &&
      clearTimeout(typingTimeouts[conversationId][userId]);

    if (!isTyping) {
      const convTyping = get().typingUsers[conversationId];
      if (!convTyping?.[userId]) return;

      const { [userId]: _removed, ...remainingUsers } = convTyping;
      const hasOthers = Object.keys(remainingUsers).length > 0;

      set((s) => ({
        typingUsers: hasOthers
          ? { ...s.typingUsers, [conversationId]: remainingUsers }
          : (({ [conversationId]: _conv, ...rest }) => rest)(s.typingUsers),
      }));
      return;
    }

    // Safety timeout: server auto-stops after 3s, we clear at 5s as a backstop
    if (!typingTimeouts[conversationId]) typingTimeouts[conversationId] = {};
    typingTimeouts[conversationId][userId] = setTimeout(() => {
      get().setTyping(conversationId, userId, false);
    }, 5000);

    set((s) => ({
      typingUsers: {
        ...s.typingUsers,
        [conversationId]: { ...s.typingUsers[conversationId], [userId]: true },
      },
    }));
  },
}));
