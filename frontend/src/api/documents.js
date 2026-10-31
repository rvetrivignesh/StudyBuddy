import apiClient from './client';

export const documentsApi = {
  list: async (subjectId) => {
    const res = await apiClient.get(`/subjects/${subjectId}/documents`);
    return res.data;
  },

  get: async (subjectId, docId) => {
    const res = await apiClient.get(`/subjects/${subjectId}/documents/${docId}`);
    return res.data;
  },

  upload: async (subjectId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post(`/subjects/${subjectId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  delete: async (subjectId, docId) => {
    const res = await apiClient.delete(`/subjects/${subjectId}/documents/${docId}`);
    return res.data;
  },
};

