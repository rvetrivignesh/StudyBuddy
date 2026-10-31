import apiClient from './client';

export const recallApi = {
  generateMCQ: async ({ subject_id, topic, count = 10 }) => {
    const res = await apiClient.post('/recall/mcq/generate', { subject_id, topic, count });
    return res.data;
  },

  submitMCQ: async (quizId, answers) => {
    const res = await apiClient.post(`/recall/mcq/${quizId}/submit`, { answers });
    return res.data;
  },

  getLongQuestion: async ({ subject_id, topic }) => {
    const res = await apiClient.post('/recall/long/question', { subject_id, topic });
    return res.data;
  },

  evaluateLongAnswer: async ({ subject_id, topic, question, answer }) => {
    const res = await apiClient.post('/recall/long/evaluate', {
      subject_id,
      topic,
      question,
      answer,
    });
    return res.data;
  },

  transcribeAudio: async (audioFile) => {
    const formData = new FormData();
    formData.append('file', audioFile);
    const res = await apiClient.post('/recall/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
};

