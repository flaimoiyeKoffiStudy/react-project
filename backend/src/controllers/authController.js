const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const config = require('../config');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const signToken = (user) => jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

function readCredentials(body) {
  const email = validator.normalizeEmail(String(body?.email ?? '').trim()) || '';
  const password = String(body?.password ?? '');
  if (!validator.isEmail(email)) throw new AppError(400, 'Adresse e-mail invalide');
  if (password.length < 8 || password.length > 72) throw new AppError(400, 'Le mot de passe doit contenir entre 8 et 72 caractères');
  return { email, password };
}

exports.register = asyncHandler(async (req, res) => {
  const { email, password } = readCredentials(req.body);
  if (User.findByEmail(email)) throw new AppError(409, 'Un compte existe déjà avec cet e-mail');
  const user = await User.create({ email, passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: signToken(user), user: User.toPublic(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = readCredentials(req.body);
  const user = User.findByEmail(email);
  // Même message dans les deux cas : on ne révèle pas si l'e-mail existe
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, 'E-mail ou mot de passe incorrect');
  }
  res.json({ token: signToken(user), user: User.toPublic(user) });
});

exports.me = (req, res) => res.json({ user: User.toPublic(req.user) });
