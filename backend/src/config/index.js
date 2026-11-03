// Configuration centralisée (lecture unique des variables d'environnement)
require('dotenv').config();
const path = require('path');

const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET est obligatoire en production');
}

module.exports = {
  isProd,
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret',
  jwtExpiresIn: '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  dataFile: path.join(__dirname, '..', '..', 'data', 'db.json'),

  // Agrégation RSS
  feedCacheTtlMs: (Number(process.env.FEED_CACHE_MINUTES) || 10) * 60 * 1000,
  refreshIntervalMs: (Number(process.env.REFRESH_INTERVAL_MINUTES) || 15) * 60 * 1000,
  feedTimeoutMs: 8000,           // timeout par flux : un flux lent ne bloque pas les autres
  feedMaxBytes: 3 * 1024 * 1024, // taille max d'un flux (protection mémoire)
  maxItemsPerFeed: 40,
  maxFeedsPerUser: 30,

  // Catégories proposées à l'utilisateur (issues du brainstorming)
  categories: [
    { id: 'general', label: 'À la une' },
    { id: 'tech', label: 'Technologie' },
    { id: 'science', label: 'Science' },
    { id: 'business', label: 'Économie' },
    { id: 'sports', label: 'Sport' },
    { id: 'culture', label: 'Culture' },
    { id: 'health', label: 'Santé' },
  ],
};
