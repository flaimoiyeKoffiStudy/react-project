import { useDashboard } from '../context/DashboardContext.jsx';

const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
function timeAgo(iso) {
  const diff = (new Date(iso) - Date.now()) / 1000;
  const units = [['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return 'à l’instant';
}

export default function ArticleItem({ article }) {
  const { readIds, favoriteIds, setRead, toggleFavorite, categoryLabel } = useDashboard();
  const isRead = readIds.has(article.id);
  const isFav = favoriteIds.has(article.id);

  // Les champs "score" et autres métadonnées serveur ne sont pas envoyés pour les favoris
  const { id, title, link, summary, image, pubDate, source, category } = article;
  const snapshot = { id, title, link, summary, image, pubDate, source, category };

  return (
    <article className={`relative flex gap-4 rounded-lg border border-line bg-white p-4 pl-5 ${isRead ? 'opacity-80' : ''}`}>
      {/* La barre bleue signale un article non lu */}
      {!isRead && <span aria-hidden className="absolute inset-y-3 left-0 w-1 rounded-r bg-cobalt" />}

      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs text-muted">
          <span className="font-medium text-ink">{source}</span> · {categoryLabel(category)} · {timeAgo(pubDate)}
          {!isRead && <span className="sr-only"> (non lu)</span>}
        </p>
        <h3 className={`font-serif text-xl leading-snug ${isRead ? 'font-medium text-muted' : 'font-semibold'}`}>
          <a href={link} target="_blank" rel="noopener noreferrer" onClick={() => !isRead && setRead(id, true)}
             className="hover:text-cobalt hover:underline">
            {title}
          </a>
        </h3>
        {summary && <p className="mt-1.5 line-clamp-2 max-w-prose text-sm text-muted">{summary}</p>}

        <div className="mt-3 flex gap-2">
          <button onClick={() => setRead(id, !isRead)} className="btn-ghost !px-2.5 !py-1 text-xs">
            {isRead ? 'Marquer non lu' : 'Marquer lu'}
          </button>
          <button onClick={() => toggleFavorite(snapshot)} aria-pressed={isFav}
                  className={`btn-ghost !px-2.5 !py-1 text-xs ${isFav ? '!border-gold !text-gold' : ''}`}>
            {isFav ? '★ Dans les favoris' : '☆ Ajouter aux favoris'}
          </button>
        </div>
      </div>

      {image && (
        <img src={image} alt="" loading="lazy" referrerPolicy="no-referrer"
             onError={(e) => (e.currentTarget.style.display = 'none')}
             className="hidden h-24 w-36 shrink-0 rounded-md object-cover sm:block" />
      )}
    </article>
  );
}
