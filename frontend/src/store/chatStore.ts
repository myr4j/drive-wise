import { create } from 'zustand';
import { ChatMessage } from '@/types/api';
import { chatApi } from '@/services/chat';
import useAuthStore from './authStore';

const MAX_HISTORY = 10;

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  sendUserMessage: (content: string) => Promise<void>;
  clearConversation: () => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,

  sendUserMessage: async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || get().isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const driverId = useAuthStore.getState().driver?.id ?? null;
      const recent = get().messages.slice(-MAX_HISTORY);
      const response = await chatApi.sendMessage(driverId, recent);
      set((state) => ({
        messages: [...state.messages, { role: 'assistant', content: response.content }],
        isLoading: false,
      }));
    } catch (err: any) {
      console.error('Chat error:', err);
      set({
        isLoading: false,
        error: err?.message ?? "L'assistant n'a pas pu répondre. Réessaie dans un instant.",
      });
    }
  },

  clearConversation: () => set({ messages: [], error: null, isLoading: false }),
  clearError: () => set({ error: null }),
}));

export default useChatStore;
