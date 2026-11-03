// Sanitisation des entrées utilisateur ET du contenu externe (flux RSS)
const sanitizeHtml = require('sanitize-html');
const validator = require('validator');

// Supprime tout HTML : ne garde que du texte brut
const stripTags = (value) =>
  sanitizeHtml(String(value ?? ''), { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const cleanText = (value, max = 200) => stripTags(value).slice(0, max);

// Mots-clés : minuscules, uniques, max 30 caractères, max 30 mots
const cleanKeywords = (list) => {
  if (!Array.isArray(list)) return [];
  const set = new Set(list.map((k) => cleanText(k, 30).toLowerCase()).filter(Boolean));
  return [...set].slice(0, 30);
};

// N'accepte que http(s) : bloque javascript:, data:, etc.
const cleanHttpUrl = (value) => {
  const url = String(value ?? '').trim();
  return validator.isURL(url, { protocols: ['http', 'https'], require_protocol: true, max_length: 2048 })
    ? url
    : null;
};

module.exports = { stripTags, cleanText, cleanKeywords, cleanHttpUrl };
