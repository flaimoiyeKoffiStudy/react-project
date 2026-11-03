// Modèle Utilisateur : compte + préférences + sources RSS + lus + favoris
const crypto = require('crypto');
const db = require('./db');

const newId = () => crypto.randomUUID();

// Sources proposées à l'inscription (modifiables ensuite par l'utilisateur)
const DEFAULT_FEEDS = [
  { title: 'Le Monde – À la une', url: 'https://www.lemonde.fr/rss/une.xml', category: 'general' },
  { title: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'general' },
  { title: 'Hacker News', url: 'https://hnrss.org/frontpage', category: 'tech' },
  { title: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'tech' },
  { title: 'NASA', url: 'https://www.nasa.gov/feed/', category: 'science' },
];

const findByEmail = (email) => db.read().users.find((u) => u.email === email);
const findById = (id) => db.read().users.find((u) => u.id === id);

const create = ({ email, passwordHash }) =>
  db.update((s) => {
    const user = {
      id: newId(),
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
      preferences: { categories: ['general', 'tech'], keywords: [] },
      feeds: DEFAULT_FEEDS.map((f) => ({ id: newId(), enabled: true, ...f })),
      readIds: [],
      favorites: [],
    };
    s.users.push(user);
    return user;
  });

// Modifie un utilisateur de façon sûre : mutator(user) renvoie éventuellement un résultat
const mutate = (id, mutator) =>
  db.update((s) => {
    const user = s.users.find((u) => u.id === id);
    if (!user) return null;
    return mutator(user);
  });

const toPublic = (u) => ({ id: u.id, email: u.email, createdAt: u.createdAt });

module.exports = { newId, findByEmail, findById, create, mutate, toPublic };
