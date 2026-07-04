import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para refresh automático
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (data) => api.post('/auth/refresh', data),
};

// User endpoints
export const userApi = {
  getMe: () => api.get('/users/me'),
  getProfile: (nickname) => api.get(`/users/${nickname}`),
  getTrackings: (nickname) => api.get(`/users/${nickname}/trackings`),
  getPosts: (nickname) => api.get(`/users/${nickname}/posts`),
  getStats: (nickname) => api.get(`/users/${nickname}/stats`),
  updateMe: (data) => api.patch('/users/me', data),
};

// Anime endpoints
export const animeApi = {
  getTrending: (page = 1) => api.get(`/anime/trending?page=${page}`),
  search: (query, page = 1) => api.get(`/anime/search?q=${encodeURIComponent(query)}&page=${page}`),
  getSeason: (year, season, page = 1) => api.get(`/anime/season?page=${page}&year=${year || ''}&season=${season || ''}`),
  getById: (id) => api.get(`/anime/${id}`),
};

// Onboarding endpoints
export const onboardingApi = {
  setFavoriteAnime: (malId) => api.post('/onboarding/favorite-anime', { malId }),
  setAvatar: (characterMalId) => api.post('/onboarding/avatar', { characterMalId }),
  getAvatarOptions: () => api.get('/onboarding/avatar-options'),
};

// Community endpoints
export const communityApi = {
  getAnimeDetails: (malId) => api.get(`/anime/${malId}`),
  getCharacters: (malId) => api.get(`/anime/${malId}/characters`),
  getCharacterRanking: (malId) => api.get(`/anime/${malId}/characters/ranking`),
  voteCharacter: (animeMalId, charMalId) =>
    api.post(`/anime/${animeMalId}/characters/${charMalId}/vote`),
  getUserVote: (malId) => api.get(`/anime/${malId}/my-vote`),
  rateAnime: (malId, nota) => api.post(`/anime/${malId}/rating`, { nota }),
  getAnimeRating: (malId) => api.get(`/anime/${malId}/rating`),
  addReview: (malId, texto) => api.post(`/anime/${malId}/reviews`, { texto }),
  getReviews: (malId) => api.get(`/anime/${malId}/reviews`),
};

// Tracking endpoints
export const trackingApi = {
  getStats: () => api.get('/tracking/stats'),
  getMyTrackings: () => api.get('/tracking'),
  getTrackingByAnime: (animeMalId) => api.get(`/tracking/${animeMalId}`),
  upsertTracking: (animeMalId, data) => api.post(`/tracking/${animeMalId}`, data),
  watchEpisode: (animeMalId) => api.post(`/tracking/${animeMalId}/watch-episode`),
  setEpisode: (animeMalId, episodio) => api.post(`/tracking/${animeMalId}`, { ultimo_episodio_assistido: episodio }),
  getTrackingDetails: (animeMalId) => api.get(`/tracking/${animeMalId}/details`),
  removeTracking: (animeMalId) => api.delete(`/tracking/${animeMalId}`),
};

// Feed endpoints
export const feedApi = {
  getFeed: (page = 1) => api.get(`/feed?page=${page}`),
  getPost: (postId) => api.get(`/feed/${postId}`),
  createPost: (data) => api.post('/feed', data),
  deletePost: (postId) => api.delete(`/feed/${postId}`),
  likePost: (postId) => api.post(`/feed/${postId}/like`),
  addComment: (postId, texto) => api.post(`/feed/${postId}/comments`, { texto }),
  getUserPosts: (page = 1) => api.get(`/feed/me/posts?page=${page}`),
};

// Connection endpoints
export const connectionApi = {
  getConnections: () => api.get('/connections'),
  getPendingRequests: () => api.get('/connections/pending'),
  sendRequest: (userId) => api.post(`/connections/${userId}`),
  acceptRequest: (connectionId) => api.patch(`/connections/${connectionId}/accept`),
  removeConnection: (connectionId) => api.delete(`/connections/${connectionId}`),
};

// Notification endpoints
export const notificationApi = {
  getNotifications: (page = 1) => api.get(`/notifications?page=${page}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (notificationId) => api.patch(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

// Translation endpoint
export const translateApi = {
  translate: (text, target = 'pt', source = 'en') =>
    api.post('/translate', { text, target, source }),
};

export default api;
