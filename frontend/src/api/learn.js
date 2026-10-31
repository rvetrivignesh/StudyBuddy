import apiClient from './client';

export const learnApi = {
  getDeepDive: async ({ subject_id, topic, refresh = false }) => {
    const res = await apiClient.post('/learn/deep-dive', { subject_id, topic, refresh });
    return res.data;
  },

  getFlashcards: async ({ subject_id, topic, count = 10, refresh = false }) => {
    const res = await apiClient.post('/learn/flashcards', { subject_id, topic, count, refresh });
    return res.data;
  },
};

