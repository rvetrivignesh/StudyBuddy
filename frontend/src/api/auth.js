import apiClient from './client';

export const authApi = {
  register: async ({ email, password, full_name }) => {
    const res = await apiClient.post('/auth/register', { email, password, name: full_name || undefined });
    return res.data;
  },

  login: async ({ email, password }) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    const res = await apiClient.post('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};

