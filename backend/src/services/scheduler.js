// Rafraîchissement périodique : remplit le cache en tâche de fond pour que le dashboard réponde vite
const db = require('../models/db');
const { fetchFeed } = require('./rssService');
const config = require('../config');

async function refreshAll() {
  const unique = new Map();
  db.read().users.forEach((u) => u.feeds.filter((f) => f.enabled).forEach((f) => unique.set(f.url, f)));
  await Promise.all([...unique.values()].map((f) => fetchFeed(f, { force: true })));
  console.log(`[scheduler] ${unique.size} flux rafraîchis`);
}

function start() {
  refreshAll().catch((e) => console.error('[scheduler]', e.message));
  const timer = setInterval(() => refreshAll().catch((e) => console.error('[scheduler]', e.message)), config.refreshIntervalMs);
  timer.unref(); // ne bloque pas l'arrêt du processus
}

module.exports = { start };
