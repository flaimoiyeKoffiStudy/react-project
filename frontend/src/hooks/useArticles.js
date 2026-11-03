// Hook de chargement des articles : pagination, rafraîchissement forcé, protection contre les réponses obsolètes.
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';

export default function useArticles({ enabled, view, category, q, unread, revision }) {
  const [state, setState] = useState({ articles: [], page: 1, hasMore: false, loading: false, error: null, feedErrors: [], total: 0 });
  const requestId = useRef(0);

  const load = useCallback(async ({ page, refresh = false }) => {
    const id = ++requestId.current;
    setState((s) => ({ ...s, loading: true, error: null, ...(page === 1 && !refresh ? { articles: [] } : {}) }));
    try {
      const data = await api.getArticles({ view, category, q, unread, page, refresh });
      if (id !== requestId.current) return; // une requête plus récente a pris le relais
      setState((s) => ({
        articles: page === 1 ? data.articles : [...s.articles, ...data.articles.filter((a) => !s.articles.some((x) => x.id === a.id))],
        page, hasMore: data.hasMore, total: data.total, feedErrors: data.errors, loading: false, error: null,
      }));
    } catch (e) {
      if (id === requestId.current) setState((s) => ({ ...s, loading: false, error: e.message }));
    }
  }, [view, category, q, unread]);

  useEffect(() => { if (enabled) load({ page: 1 }); }, [enabled, load, revision]);

  return {
    ...state,
    loadMore: () => load({ page: state.page + 1 }),
    refresh: () => load({ page: 1, refresh: true }),
  };
}

// Évite de lancer une requête à chaque frappe dans la recherche
export function useDebounced(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}
