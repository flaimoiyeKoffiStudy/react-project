// Mini "base de données" JSON : zéro dépendance, écritures sérialisées et atomiques.
// Pour passer à MongoDB/PostgreSQL, il suffit de réécrire ce fichier et userModel.js.
const fs = require('fs/promises');
const path = require('path');
const config = require('../config');

let state = { users: [] };
let queue = Promise.resolve(); // file d'attente : une seule écriture à la fois

async function init() {
  await fs.mkdir(path.dirname(config.dataFile), { recursive: true });
  try {
    state = JSON.parse(await fs.readFile(config.dataFile, 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('[db] Fichier illisible, nouvelle base créée :', err.message);
    await persist();
  }
}

async function persist() {
  const tmp = `${config.dataFile}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state, null, 2));
  await fs.rename(tmp, config.dataFile); // écriture atomique : pas de fichier à moitié écrit
}

const read = () => state;

// update(mutator) : applique une modification puis sauvegarde, sans collision entre requêtes
function update(mutator) {
  const run = queue.then(async () => {
    const result = await mutator(state);
    await persist();
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

module.exports = { init, read, update };
