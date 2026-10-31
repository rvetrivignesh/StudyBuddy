import apiClient from './client';

export const chatApi = {
  sendMessage: async ({ subject_id, message, conversation_id }) => {
    const res = await apiClient.post('/chat', {
      subject_id: subject_id || null,
      message,
      conversation_id: conversation_id || null,
    });
    return res.data;
  },

  listConversations: async (subject_id) => {
    const res = await apiClient.get('/chat/conversations', {
      params: subject_id ? { subject_id } : {},
    });
    return res.data;
  },

  getConversation: async (conversationId) => {
    const res = await apiClient.get(`/chat/conversations/${conversationId}`);
    return res.data;
  },
};

