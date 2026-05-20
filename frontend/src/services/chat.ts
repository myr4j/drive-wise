import apiClient from './api';
import { ChatMessage, ChatResponse } from '@/types/api';

export const chatApi = {
  /**
   * Send the recent conversation history and receive the assistant's reply.
   * Backend handles trimming and context injection.
   */
  sendMessage: async (
    driverId: number | null,
    messages: ChatMessage[]
  ): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>(
      '/chat/message',
      { messages },
      driverId != null ? { params: { driver_id: driverId } } : undefined
    );
    return response.data;
  },
};

export default chatApi;
