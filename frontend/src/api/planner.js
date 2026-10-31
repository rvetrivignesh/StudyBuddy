import apiClient, { API_BASE } from './client';

export const plannerApi = {
  generatePlan: async (subjectId, data = {}) => {
    const res = await apiClient.post(`/subjects/${subjectId}/plan`, data);
    return res.data;
  },

  getPlan: async (subjectId) => {
    const res = await apiClient.get(`/subjects/${subjectId}/plan`);
    return res.data;
  },

  getExportIcsUrl: (subjectId) => {
    return `${API_BASE}/subjects/${subjectId}/plan/export.ics`;
  },
};

