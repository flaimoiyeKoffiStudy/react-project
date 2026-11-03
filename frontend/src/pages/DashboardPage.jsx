import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import ArticleList from '../components/ArticleList.jsx';
import FeedManager from '../components/FeedManager.jsx';
import PreferencesPanel from '../components/PreferencesPanel.jsx';
import useArticles, { useDebounced } from '../hooks/useArticles.js';
import { useDashboard } from '../context/DashboardContext.jsx';

export default function DashboardPage() {
  const { ready, revision, favorites, preferences, notice, setNotice } = useDashboard();
  const [view, setView] = useState('foryou');      // foryou | all | favorites
  const [category, setCategory] = useState('');
  const [unread, setUnread] = useState(false);
  const [search, setSearch] = useState('');
  const [panel, setPanel] = useState(null);         // null | 'feeds' | 'prefs'
  const q = useDebounced(search.trim());

  const isFavorites = view === 'favorites';
  const feed = useArticles({ enabled: ready && !isFavorites, view, category, q, unread, revision });

  // Les notifications disparaissent seules
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice, setNotice]);

  // Vue "Favoris" : données locales (déjà sauvegardées), filtrées par la recherche
  const favoriteList = useMemo(
    () => favorites.filter((a) => !q || (a.title + a.summary).toLowerCase().includes(q.toLowerCase())),
    [favorites, q]
  );

  const noInterests = !preferences.categories.length && !preferences.keywords.length;
  const emptyMessage = isFavorites
    ? 'Aucun favori pour l’instant. Cliquez sur « Ajouter aux favoris » sous un article.'
    : view === 'foryou' && noInterests
    ? 'Choisissez vos catégories et mots-clés dans « Mes centres d’intérêt » pour personnaliser ce flux.'
    : 'Aucun article ne correspond à ces filtres.';

  const title = isFavorites ? 'Favoris' : view === 'foryou' ? 'Pour vous' : 'Toutes les sources';

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 lg:grid-cols-[250px_1fr] lg:px-6 lg:py-0">
      <Sidebar view={view} setView={setView} category={category} setCategory={setCategory}
               unread={unread} setUnread={setUnread}
               onFeeds={() => setPanel('feeds')} onPrefs={() => setPanel('prefs')} />

      <main className="min-w-0 lg:py-8">
        <header className="mb-5 flex flex-wrap items-center gap-3">
          <h2 className="mr-auto font-serif text-3xl font-semibold">{title}</h2>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                 placeholder="Rechercher un article" aria-label="Rechercher un article" className="input !w-64" />
          {!isFavorites && (
            <button className="btn-ghost" onClick={feed.refresh} disabled={feed.loading}>Actualiser</button>
          )}
        </header>

        {/* Les flux en échec sont signalés, sans bloquer l'affichage des autres */}
        {!isFavorites && feed.feedErrors.length > 0 && (
          <p role="status" className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
            {feed.feedErrors.length} source(s) injoignable(s) : {feed.feedErrors.map((e) => e.title).join(', ')}. Les autres articles s’affichent normalement.
          </p>
        )}

        {isFavorites ? (
          <ArticleList articles={favoriteList} emptyMessage={emptyMessage} />
        ) : (
          <ArticleList articles={feed.articles} loading={feed.loading || !ready} error={feed.error}
                       hasMore={feed.hasMore} onMore={feed.loadMore} emptyMessage={emptyMessage} />
        )}
      </main>

      {panel === 'feeds' && <FeedManager onClose={() => setPanel(null)} />}
      {panel === 'prefs' && <PreferencesPanel onClose={() => setPanel(null)} />}
      {notice && (
        <div role="alert" className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-ink px-4 py-2 text-sm text-white shadow-lg">{notice}</div>
      )}
    </div>
  );
}
