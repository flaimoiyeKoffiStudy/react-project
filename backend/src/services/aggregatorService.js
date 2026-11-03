// LOGIGRAMME COMPLET DE L'AGRÉGATION
//  1. Collecte       : récupération parallèle des flux actifs de l'utilisateur (tolérante aux pannes)
//  2. Normalisation  : fait dans rssService
//  3. Dédoublonnage  : un même article présent dans 2 flux n'apparaît qu'une fois
//  4. Filtrage       : catégorie, recherche texte, non-lus, centres d'intérêt (vue "Pour vous")
//  5. Scoring        : pertinence selon les mots-clés favoris
//  6. Tri + pagination
const { fetchFeed } = require('./rssService');

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Score de pertinence : un mot-clé dans le titre pèse 3, dans le résumé 1
function scoreArticle(article, keywords) {
  if (!keywords.length) return 0;
  const title = norm(article.title);
  const summary = norm(article.summary);
  return keywords.reduce((total, kw) => {
    const k = norm(kw);
    return total + (title.includes(k) ? 3 : 0) + (summary.includes(k) ? 1 : 0);
  }, 0);
}

async function aggregate(user, { view = 'foryou', category, q, unread, page = 1, limit = 20, refresh = false }) {
  // 1. COLLECTE (Promise.allSettled-like : fetchFeed ne rejette jamais)
  const activeFeeds = user.feeds.filter((f) => f.enabled);
  const results = await Promise.all(activeFeeds.map((f) => fetchFeed(f, { force: refresh })));
  const errors = results.filter((r) => r.error).map((r) => r.error);

  // 3. DÉDOUBLONNAGE
  const byId = new Map();
  results.flatMap((r) => r.articles).forEach((a) => byId.set(a.id, a));
  let articles = [...byId.values()];

  // 4. FILTRAGE
  const { categories: prefCats, keywords } = user.preferences;
  const readIds = new Set(user.readIds);
  const query = q ? norm(q) : null;

  articles = articles.map((a) => ({ ...a, score: scoreArticle(a, keywords) }));

  if (view === 'foryou' && (prefCats.length || keywords.length)) {
    articles = articles.filter((a) => prefCats.includes(a.category) || a.score > 0);
  }
  if (category) articles = articles.filter((a) => a.category === category);
  if (query) articles = articles.filter((a) => norm(a.title + ' ' + a.summary).includes(query));
  if (unread) articles = articles.filter((a) => !readIds.has(a.id));

  // 5-6. TRI : pertinence d'abord en vue "Pour vous", puis date décroissante
  articles.sort((a, b) => {
    if (view === 'foryou' && b.score !== a.score) return b.score - a.score;
    return new Date(b.pubDate) - new Date(a.pubDate);
  });

  const total = articles.length;
  const start = (page - 1) * limit;
  return {
    articles: articles.slice(start, start + limit),
    total,
    page,
    hasMore: start + limit < total,
    errors, // les flux en échec sont signalés sans faire échouer la requête
  };
}

module.exports = { aggregate };
