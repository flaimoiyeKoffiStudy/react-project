// CRUD des sources RSS de l'utilisateur
const config = require('../config');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { cleanText, cleanHttpUrl } = require('../utils/sanitize');
const { assertSafeUrl } = require('../utils/urlGuard');
const { fetchFeed } = require('../services/rssService');

const validCategoryIds = config.categories.map((c) => c.id);

async function readFeedBody(body, { partial = false } = {}) {
  const out = {};
  if (!partial || body.url !== undefined) {
    const url = cleanHttpUrl(body.url);
    if (!url) throw new AppError(400, 'URL du flux invalide (http/https requis)');
    await assertSafeUrl(url);
    out.url = url;
  }
  if (!partial || body.title !== undefined) {
    out.title = cleanText(body.title, 80);
    if (!out.title) throw new AppError(400, 'Le nom de la source est obligatoire');
  }
  if (!partial || body.category !== undefined) {
    if (!validCategoryIds.includes(body.category)) throw new AppError(400, 'Catégorie invalide');
    out.category = body.category;
  }
  if (body.enabled !== undefined) out.enabled = Boolean(body.enabled);
  return out;
}

exports.list = (req, res) => res.json({ feeds: req.user.feeds });

exports.create = asyncHandler(async (req, res) => {
  if (req.user.feeds.length >= config.maxFeedsPerUser) {
    throw new AppError(400, `Maximum ${config.maxFeedsPerUser} sources`);
  }
  const data = await readFeedBody(req.body ?? {});
  if (req.user.feeds.some((f) => f.url === data.url)) throw new AppError(409, 'Cette source existe déjà');

  // Vérifie que le flux est lisible avant de l'enregistrer
  const probe = await fetchFeed({ id: 'probe', ...data }, { force: true });
  if (probe.error) throw new AppError(422, 'Ce lien ne renvoie pas un flux RSS/Atom valide');

  const feed = await User.mutate(req.user.id, (u) => {
    const f = { id: User.newId(), enabled: true, ...data };
    u.feeds.push(f);
    return f;
  });
  res.status(201).json({ feed });
});

exports.update = asyncHandler(async (req, res) => {
  const data = await readFeedBody(req.body ?? {}, { partial: true });
  const feed = await User.mutate(req.user.id, (u) => {
    const f = u.feeds.find((x) => x.id === req.params.id);
    if (f) Object.assign(f, data);
    return f;
  });
  if (!feed) throw new AppError(404, 'Source introuvable');
  res.json({ feed });
});

exports.remove = asyncHandler(async (req, res) => {
  const removed = await User.mutate(req.user.id, (u) => {
    const before = u.feeds.length;
    u.feeds = u.feeds.filter((f) => f.id !== req.params.id);
    return u.feeds.length < before;
  });
  if (!removed) throw new AppError(404, 'Source introuvable');
  res.status(204).end();
});
