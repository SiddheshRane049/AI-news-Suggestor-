import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for attaching JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect on optional auth endpoints
      const url = error.config.url;
      if (url && (url.includes('/auth/login') || url.includes('/auth/register'))) {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, name, preferred_categories) =>
    api.post('/auth/register', { email, password, name, preferred_categories }),
  getMe: () => api.get('/auth/me'),
};

export const feedApi = {
  getForYou: (page = 1, page_size = 15) =>
    api.get(`/feed/for-you?page=${page}&page_size=${page_size}`),
  getTrending: (limit = 10) => api.get(`/feed/trending?limit=${limit}`),
  getTrendingTags: (limit = 15) => api.get(`/feed/trending-tags?limit=${limit}`),
};

export const articlesApi = {
  list: (params = {}) => api.get('/articles', { params }),
  getById: (id) => api.get(`/articles/${id}`),
  exportMarkdown: () =>
    api.get('/articles/export/markdown', { responseType: 'blob' }),
};

export const interactionsApi = {
  toggle: (article_id, interaction_type, state = null) =>
    api.post('/interactions/toggle', { article_id, interaction_type, state }),
  getStats: () => api.get('/interactions/stats'),
};

export const chatApi = {
  chatArticle: (article_id, message, history = []) =>
    api.post('/chat/article', { article_id, message, history }),
  chatNews: (message, category = null, history = []) =>
    api.post('/chat/news', { message, category, history }),
};

export const digestApi = {
  getDaily: () => api.get('/digest/daily'),
  explainSimply: (article_id) =>
    api.post('/digest/explain-simply', { article_id }),
};

export const categoriesApi = {
  getAll: () => api.get('/categories'),
};

export const meApi = {
  getPreferences: () => api.get('/me/preferences'),
  updatePreferences: (preferred_categories, onboarding_completed = true) =>
    api.put('/me/preferences', { preferred_categories, onboarding_completed }),
  getSaved: (page = 1, page_size = 20) =>
    api.get(`/me/saved?page=${page}&page_size=${page_size}`),
  getHistory: (page = 1, page_size = 20) =>
    api.get(`/me/history?page=${page}&page_size=${page_size}`),
};

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  fetchNow: () => api.post('/admin/fetch-now'),
  processAiNow: () => api.post('/admin/process-ai-now'),
  getLogs: (limit = 15) => api.get(`/admin/logs?limit=${limit}`),
};
