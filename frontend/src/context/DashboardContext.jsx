// État global du tableau de bord : préférences, sources, articles lus et favoris.
// Les actions lu/favori sont "optimistes" : l'interface réagit tout de suite, puis annule si le serveur refuse.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const DashboardContext = createContext(null);
export const useDashboard = () => useContext(DashboardContext);

export function DashboardProvider({ children }) {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [feeds, setFeeds] = useState([]);
  const [preferences, setPreferences] = useState({ categories: [], keywords: [] });
  const [categories, setCategories] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [favorites, setFavorites] = useState([]);
  const [revision, setRevision] = useState(0); // incrémenté quand sources/préférences changent → recharge les articles
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!user) { setReady(false); return; }
    Promise.all([api.getFeeds(), api.getPreferences(), api.getLibrary()])
      .then(([f, p, lib]) => {
        setFeeds(f.feeds);
        setPreferences(p.preferences);
        setCategories(p.availableCategories);
        setReadIds(new Set(lib.readIds));
        setFavorites(lib.favorites);
        setReady(true);
      })
      .catch((e) => setNotice(e.message));
  }, [user]);

  const bump = () => setRevision((r) => r + 1);
  const fail = (e) => setNotice(e.message);

  // ---- Lu / non lu
  const setRead = useCallback(async (id, read) => {
    setReadIds((prev) => { const n = new Set(prev); read ? n.add(id) : n.delete(id); return n; });
    try { await (read ? api.markRead(id) : api.markUnread(id)); }
    catch (e) {
      setReadIds((prev) => { const n = new Set(prev); read ? n.delete(id) : n.add(id); return n; });
      fail(e);
    }
  }, []);

  // ---- Favoris
  const toggleFavorite = useCallback(async (article) => {
    const isFav = favorites.some((f) => f.id === article.id);
    const previous = favorites;
    setFavorites(isFav ? favorites.filter((f) => f.id !== article.id) : [article, ...favorites]);
    try { await (isFav ? api.removeFavorite(article.id) : api.addFavorite(article)); }
    catch (e) { setFavorites(previous); fail(e); }
  }, [favorites]);

  // ---- Préférences
  const savePreferences = useCallback(async (prefs) => {
    const { preferences: saved } = await api.savePreferences(prefs);
    setPreferences(saved);
    bump();
  }, []);

  // ---- Sources (les erreurs sont relancées pour être affichées dans le formulaire)
  const addFeed = useCallback(async (data) => {
    const { feed } = await api.addFeed(data);
    setFeeds((f) => [...f, feed]);
    bump();
  }, []);
  const updateFeed = useCallback(async (id, patch) => {
    const { feed } = await api.updateFeed(id, patch);
    setFeeds((f) => f.map((x) => (x.id === id ? feed : x)));
    bump();
  }, []);
  const removeFeed = useCallback(async (id) => {
    await api.deleteFeed(id);
    setFeeds((f) => f.filter((x) => x.id !== id));
    bump();
  }, []);

  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);
  const categoryLabel = useCallback((id) => categories.find((c) => c.id === id)?.label || id, [categories]);

  const value = {
    ready, feeds, preferences, categories, readIds, favorites, favoriteIds, revision, notice,
    setNotice, setRead, toggleFavorite, savePreferences, addFeed, updateFeed, removeFeed, categoryLabel,
  };
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}
