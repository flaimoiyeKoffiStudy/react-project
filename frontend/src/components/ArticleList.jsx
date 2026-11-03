import ArticleItem from './ArticleItem.jsx';

export default function ArticleList({ articles, loading, error, hasMore, onMore, emptyMessage }) {
  return (
    <div className="space-y-3" aria-busy={loading}>
      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      {articles.map((a) => <ArticleItem key={a.id} article={a} />)}

      {loading && <p className="py-6 text-center text-sm text-muted">Chargement des actualités…</p>}
      {!loading && !error && articles.length === 0 && (
        <p className="rounded-lg border border-dashed border-line p-8 text-center text-muted">{emptyMessage}</p>
      )}
      {hasMore && !loading && (
        <div className="pt-2 text-center"><button className="btn-ghost" onClick={onMore}>Afficher plus d’articles</button></div>
      )}
    </div>
  );
}
