const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { aggregate } = require('../services/aggregatorService');
const { cleanText, stripTags, cleanHttpUrl } = require('../utils/sanitize');

const ID_RE = /^[a-f0-9]{16}$/;
const assertId = (id) => {
  if (!ID_RE.test(id)) throw new AppError(400, 'Identifiant d’article invalide');
  return id;
};

// GET /api/articles?view=foryou|all&category=&q=&unread=true&page=1&limit=20&refresh=true
exports.list = asyncHandler(async (req, res) => {
  const { view, category, q, unread, page, limit, refresh } = req.query;
  const result = await aggregate(req.user, {
    view: view === 'all' ? 'all' : 'foryou',
    category: category ? String(category).slice(0, 30) : undefined,
    q: q ? cleanText(q, 100) : undefined,
    unread: unread === 'true',
    page: Math.max(1, parseInt(page, 10) || 1),
    limit: Math.min(50, Math.max(1, parseInt(limit, 10) || 20)),
    refresh: refresh === 'true',
  });
  res.json(result);
});

// GET /api/articles/library → état "lu" + favoris (chargé une fois par le frontend)
exports.library = (req, res) => res.json({ readIds: req.user.readIds, favorites: req.user.favorites });

exports.markRead = asyncHandler(async (req, res) => {
  const id = assertId(req.params.id);
  await User.mutate(req.user.id, (u) => {
    if (!u.readIds.includes(id)) u.readIds.push(id);
    u.readIds = u.readIds.slice(-5000); // borne la taille du stockage
  });
  res.status(204).end();
});

exports.markUnread = asyncHandler(async (req, res) => {
  const id = assertId(req.params.id);
  await User.mutate(req.user.id, (u) => {
    u.readIds = u.readIds.filter((x) => x !== id);
  });
  res.status(204).end();
});

// Les favoris sont stockés sous forme de copie : ils restent consultables même si le flux n'expose plus l'article
exports.addFavorite = asyncHandler(async (req, res) => {
  const b = req.body ?? {};
  const link = cleanHttpUrl(b.link);
  if (!link) throw new AppError(400, 'Article invalide');
  const fav = {
    id: assertId(String(b.id)),
    title: cleanText(b.title, 200),
    link,
    summary: stripTags(b.summary).slice(0, 320),
    image: cleanHttpUrl(b.image),
    pubDate: new Date(b.pubDate).toString() === 'Invalid Date' ? new Date().toISOString() : new Date(b.pubDate).toISOString(),
    source: cleanText(b.source, 80),
    category: cleanText(b.category, 30),
    savedAt: new Date().toISOString(),
  };
  const favorite = await User.mutate(req.user.id, (u) => {
    if (!u.favorites.some((f) => f.id === fav.id)) u.favorites.unshift(fav);
    u.favorites = u.favorites.slice(0, 500);
    return fav;
  });
  res.status(201).json({ favorite });
});

exports.removeFavorite = asyncHandler(async (req, res) => {
  const id = assertId(req.params.id);
  await User.mutate(req.user.id, (u) => {
    u.favorites = u.favorites.filter((f) => f.id !== id);
  });
  res.status(204).end();
});
