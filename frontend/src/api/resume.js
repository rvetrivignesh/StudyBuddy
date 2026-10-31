import apiClient from './client';

export const resumeApi = {
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/resume/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  get: async () => {
    const res = await apiClient.get('/resume');
    return res.data;
  },

  save: async (resumeData) => {
    const res = await apiClient.put('/resume', resumeData);
    return res.data;
  },

  patch: async (updateData) => {
    const res = await apiClient.patch('/resume', updateData);
    return res.data;
  },

  analyze: async (jobDescription = '') => {
    const res = await apiClient.post('/resume/analyze', {
      job_description: jobDescription,
    });
    return res.data;
  },

  latestAnalysis: async () => {
    const res = await apiClient.get('/resume/analysis');
    return res.data;
  },
};

