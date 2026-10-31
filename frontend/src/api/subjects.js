import apiClient from './client';

export const subjectsApi = {
  list: async () => {
    const res = await apiClient.get('/subjects');
    return res.data;
  },

  get: async (subjectId) => {
    const res = await apiClient.get(`/subjects/${subjectId}`);
    return res.data;
  },

  create: async (data) => {
    const res = await apiClient.post('/subjects', data);
    return res.data;
  },

  update: async (subjectId, data) => {
    const res = await apiClient.patch(`/subjects/${subjectId}`, data);
    return res.data;
  },

  reparseSyllabus: async (subjectId) => {
    const res = await apiClient.post(`/subjects/${subjectId}/parse-syllabus`);
    return res.data;
  },

  delete: async (subjectId) => {
    const res = await apiClient.delete(`/subjects/${subjectId}`);
    return res.data;
  },
};

