const jwt = require('jsonwebtoken');
const config = require('../config');
const AppError = require('../utils/AppError');
const User = require('../models/userModel');

// Vérifie le JWT "Authorization: Bearer <token>" et attache req.user
module.exports = (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new AppError(401, 'Authentification requise'));
  try {
    const { sub } = jwt.verify(token, config.jwtSecret);
    const user = User.findById(sub);
    if (!user) throw new Error('unknown');
    req.user = user;
    next();
  } catch {
    next(new AppError(401, 'Session expirée, reconnectez-vous'));
  }
};
