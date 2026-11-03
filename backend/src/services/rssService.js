// ÉTAPE 1 du logigramme — COLLECTE
// Récupère UN flux RSS/Atom de manière sûre et le normalise.
// Choix du parseur (matrice multi-critères) : `rss-parser`
//  + RSS 2.0 / Atom / RSS 1.0, champs personnalisés (media:*), léger, API Promise, maintenu.
//  La requête HTTP est faite par fetch natif (timeout, taille max, anti-SSRF) puis passée à parseString,
//  ce qui donne un contrôle total sur la gestion des erreurs.
const crypto = require('crypto');
const Parser = require('rss-parser');
const config = require('../config');
const { stripTags, cleanText, cleanHttpUrl } = require('../utils/sanitize');
const { assertSafeUrl } = require('../utils/urlGuard');

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumb'],
    ],
  },
});

// Cache mémoire par URL : { data, expires }
const cache = new Map();

// fetch avec redirections suivies manuellement (chaque saut est re-vérifié contre le SSRF)
async function safeFetch(url, hops = 0) {
  await assertSafeUrl(url);
  const res = await fetch(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(config.feedTimeoutMs),
    headers: {
      'User-Agent': 'RSS-Dashboard/1.0',
      Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5',
    },
  });
  if ([301, 302, 303, 307, 308].includes(res.status)) {
    const location = res.headers.get('location');
    if (!location || hops >= 3) throw new Error('Trop de redirections');
    return safeFetch(new URL(location, url).toString(), hops + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const declared = Number(res.headers.get('content-length') || 0);
  if (declared > config.feedMaxBytes) throw new Error('Flux trop volumineux');
  const text = await res.text();
  if (text.length > config.feedMaxBytes) throw new Error('Flux trop volumineux');
  return text;
}

function extractImage(item) {
  const candidates = [
    item.enclosure?.type?.startsWith('image') ? item.enclosure.url : null,
    item.mediaContent?.$?.url,
    item.mediaThumb?.$?.url,
    (item['content:encoded'] || item.content || '').match(/<img[^>]+src=["']([^"']+)["']/i)?.[1],
  ];
  return candidates.map(cleanHttpUrl).find(Boolean) || null;
}

// ÉTAPE 2 — NORMALISATION : tous les flux sont convertis vers un même format d'article
function normalizeItem(item, feed) {
  const link = cleanHttpUrl(item.link);
  if (!link) return null; // un article sans lien valide est ignoré
  const date = new Date(item.isoDate || item.pubDate || Date.now());
  return {
    // id stable : permet de retrouver "lu" / "favori" d'un rafraîchissement à l'autre
    id: crypto.createHash('sha1').update(item.guid || link).digest('hex').slice(0, 16),
    title: cleanText(item.title, 200) || 'Sans titre',
    link,
    summary: stripTags(item.contentSnippet || item.summary || item.content || '').slice(0, 320),
    image: extractImage(item),
    pubDate: isNaN(date) ? new Date().toISOString() : date.toISOString(),
    source: cleanText(feed.title, 80),
    category: feed.category,
  };
}

/**
 * Récupère un flux. NE LÈVE JAMAIS d'exception : renvoie { articles, error }.
 * En cas d'échec, on retombe sur le cache périmé s'il existe.
 */
async function fetchFeed(feed, { force = false } = {}) {
  const cached = cache.get(feed.url);
  if (cached && !force && cached.expires > Date.now()) {
    return { articles: cached.articles.map((a) => ({ ...a, source: feed.title, category: feed.category })) };
  }
  try {
    const xml = await safeFetch(feed.url);
    const parsed = await parser.parseString(xml);
    const articles = (parsed.items || [])
      .slice(0, config.maxItemsPerFeed)
      .map((item) => normalizeItem(item, feed))
      .filter(Boolean);
    cache.set(feed.url, { articles, expires: Date.now() + config.feedCacheTtlMs });
    return { articles };
  } catch (err) {
    console.warn(`[rss] Échec "${feed.title}" : ${err.message}`);
    return {
      articles: cached ? cached.articles : [],
      error: { feedId: feed.id, title: feed.title, message: 'Flux inaccessible ou invalide' },
    };
  }
}

module.exports = { fetchFeed };
