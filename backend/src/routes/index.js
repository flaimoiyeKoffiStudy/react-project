const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const authCtrl = require('../controllers/authController');
const feedCtrl = require('../controllers/feedController');
const prefCtrl = require('../controllers/preferenceController');
const articleCtrl = require('../controllers/articleController');

// Anti brute-force sur login/inscription
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Trop de tentatives, réessayez dans quelques minutes' } },
});

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Authentification
router.post('/auth/register', authLimiter, authCtrl.register);
router.post('/auth/login', authLimiter, authCtrl.login);
router.get('/auth/me', auth, authCtrl.me);

// Tout ce qui suit nécessite d'être connecté
router.use(auth);

// Préférences (catégories + mots-clés)
router.get('/preferences', prefCtrl.get);
router.put('/preferences', prefCtrl.update);

// Sources RSS (CRUD)
router.get('/feeds', feedCtrl.list);
router.post('/feeds', feedCtrl.create);
router.put('/feeds/:id', feedCtrl.update);
router.delete('/feeds/:id', feedCtrl.remove);

// Articles : agrégation, lus / non lus, favoris
router.get('/articles', articleCtrl.list);
router.get('/articles/library', articleCtrl.library);
router.post('/articles/favorites', articleCtrl.addFavorite);
router.delete('/articles/favorites/:id', articleCtrl.removeFavorite);
router.post('/articles/:id/read', articleCtrl.markRead);
router.delete('/articles/:id/read', articleCtrl.markUnread);

module.exports = router;
