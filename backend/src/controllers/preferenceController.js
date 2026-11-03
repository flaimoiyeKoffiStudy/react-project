const config = require('../config');
const User = require('../models/userModel');
const { cleanKeywords } = require('../utils/sanitize');
const asyncHandler = require('../utils/asyncHandler');

const validCategoryIds = config.categories.map((c) => c.id);

exports.get = (req, res) =>
  res.json({ preferences: req.user.preferences, availableCategories: config.categories });

// Choix des catégories + mots-clés favoris
exports.update = asyncHandler(async (req, res) => {
  const categories = (Array.isArray(req.body?.categories) ? req.body.categories : []).filter((c) =>
    validCategoryIds.includes(c)
  );
  const keywords = cleanKeywords(req.body?.keywords);
  const preferences = await User.mutate(req.user.id, (u) => {
    u.preferences = { categories: [...new Set(categories)], keywords };
    return u.preferences;
  });
  res.json({ preferences });
});
