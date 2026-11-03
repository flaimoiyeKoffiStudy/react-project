const app = require('./app');
const config = require('./config');
const db = require('./models/db');
const scheduler = require('./services/scheduler');

// Filet de sécurité : une erreur isolée ne doit jamais tuer le serveur
process.on('unhandledRejection', (reason) => console.error('[unhandledRejection]', reason));
process.on('uncaughtException', (err) => console.error('[uncaughtException]', err));

(async () => {
  await db.init();
  app.listen(config.port, () => console.log(`API prête sur http://localhost:${config.port}/api`));
  scheduler.start();
})();
