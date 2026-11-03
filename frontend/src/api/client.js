// Client HTTP unique : ajoute le JWT, normalise les erreurs, gère l'expiration de session
const BASE = import.meta.env.VITE_API_URL || '/api';

export const tokenStore = {
  get: () => localStorage.getItem('token'),
  set: (t) => localStorage.setItem('token', t),
  clear: () => localStorage.removeItem('token'),
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(path, { method = 'GET', body, params } = {}) {
  const query = params
    ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== false && v !== null)).toString()
    : '';
  let res;
  try {
    res = await fetch(`${BASE}${path}${query}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(tokenStore.get() ? { Authorization: `Bearer ${tokenStore.get()}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Serveur injoignable. Vérifiez votre connexion.');
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && tokenStore.get()) onUnauthorized();
    throw new Error(data?.error?.message || `Erreur ${res.status}`);
  }
  return data;
}

export const api = {
  register: (email, password) => request('/auth/register', { method: 'POST', body: { email, password } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me'),

  getPreferences: () => request('/preferences'),
  savePreferences: (prefs) => request('/preferences', { method: 'PUT', body: prefs }),

  getFeeds: () => request('/feeds'),
  addFeed: (feed) => request('/feeds', { method: 'POST', body: feed }),
  updateFeed: (id, patch) => request(`/feeds/${id}`, { method: 'PUT', body: patch }),
  deleteFeed: (id) => request(`/feeds/${id}`, { method: 'DELETE' }),

  getArticles: (params) => request('/articles', { params }),
  getLibrary: () => request('/articles/library'),
  markRead: (id) => request(`/articles/${id}/read`, { method: 'POST' }),
  markUnread: (id) => request(`/articles/${id}/read`, { method: 'DELETE' }),
  addFavorite: (article) => request('/articles/favorites', { method: 'POST', body: article }),
  removeFavorite: (id) => request(`/articles/favorites/${id}`, { method: 'DELETE' }),
};
