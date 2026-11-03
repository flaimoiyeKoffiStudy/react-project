const config = require('../config');

const notFound = (_req, res) => res.status(404).json({ error: { message: 'Route introuvable' } });

// Dernier maillon : l'API ne plante jamais et ne divulgue pas de détails internes
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'JSON invalide' } });
  }
  const status = err.status || 500;
  if (status >= 500) console.error('[error]', err);
  res.status(status).json({
    error: { message: err.expose ? err.message : 'Erreur interne du serveur', ...(config.isProd ? {} : { debug: err.message }) },
  });
};

module.exports = { notFound, errorHandler };
