import { useAuth } from '../context/AuthContext.jsx';
import { useDashboard } from '../context/DashboardContext.jsx';

const VIEWS = [
  { id: 'foryou', label: 'Pour vous' },
  { id: 'all', label: 'Toutes les sources' },
  { id: 'favorites', label: 'Favoris' },
];

export default function Sidebar({ view, setView, category, setCategory, unread, setUnread, onFeeds, onPrefs }) {
  const { user, logout } = useAuth();
  const { categories, favorites } = useDashboard();

  const navBtn = (active) =>
    `flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${active ? 'bg-cobalt-soft font-semibold text-cobalt-dark' : 'hover:bg-white'}`;

  return (
    <aside className="flex flex-col gap-6 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:py-8">
      <h1 className="font-serif text-3xl font-semibold leading-none">Ma Revue</h1>

      <nav aria-label="Vues" className="space-y-1">
        {VIEWS.map((v) => (
          <button key={v.id} onClick={() => setView(v.id)} className={navBtn(view === v.id)} aria-current={view === v.id}>
            {v.label}
            {v.id === 'favorites' && <span className="text-xs text-muted">{favorites.length}</span>}
          </button>
        ))}
      </nav>

      {view !== 'favorites' && (
        <>
          <section>
            <h2 className="mb-2 px-3 text-sm font-semibold">Catégories</h2>
            <div className="space-y-1">
              <button onClick={() => setCategory('')} className={navBtn(!category)}>Toutes</button>
              {categories.map((c) => (
                <button key={c.id} onClick={() => setCategory(c.id)} className={navBtn(category === c.id)}>{c.label}</button>
              ))}
            </div>
          </section>

          <label className="flex items-center gap-2 px-3 text-sm">
            <input type="checkbox" checked={unread} onChange={(e) => setUnread(e.target.checked)} className="size-4 accent-cobalt" />
            Non lus uniquement
          </label>
        </>
      )}

      <div className="mt-auto space-y-2">
        <button onClick={onPrefs} className="btn-ghost w-full">Mes centres d’intérêt</button>
        <button onClick={onFeeds} className="btn-ghost w-full">Gérer mes sources</button>
        <p className="truncate px-1 pt-2 text-xs text-muted">{user.email}</p>
        <button onClick={logout} className="px-1 text-xs text-muted underline hover:text-ink">Se déconnecter</button>
      </div>
    </aside>
  );
}
