/**
 * Contrôleur d'authentification
 * =============================
 */

const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');
const logger = require('../config/logger');
const { asyncHandler, ValidationError, UnauthorizedError } = require('../middlewares/error.middleware');

/**
 * Inscription d'un nouvel utilisateur
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  // Validation des entrées
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données invalides', errors.array());
  }

  const { email, password, first_name, last_name } = req.body;

  const result = await authService.register({
    email,
    password,
    first_name,
    last_name,
  });

  res.status(201).json({
    success: true,
    message: 'Inscription réussie',
    data: result,
  });
});

/**
 * Connexion d'un utilisateur
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données invalides', errors.array());
  }

  const { email, password } = req.body;

  const result = await authService.login(email, password);

  res.status(200).json({
    success: true,
    message: 'Connexion réussie',
    data: result,
  });
});

/**
 * Rafraîchissement des tokens
 * POST /api/auth/refresh
 */
const refreshTokens = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ValidationError('Token de rafraîchissement manquant');
  }

  const result = await authService.refreshTokens(refreshToken);

  res.status(200).json({
    success: true,
    message: 'Tokens rafraîchis',
    data: result,
  });
});

/**
 * Déconnexion
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const token = req.token;
  const { refreshToken } = req.body;

  await authService.logout(token, refreshToken);

  res.status(200).json({
    success: true,
    message: 'Déconnexion réussie',
  });
});

/**
 * Récupération du profil
 * GET /api/auth/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const profile = await authService.getProfile(userId);

  res.status(200).json({
    success: true,
    data: profile,
  });
});

/**
 * Mise à jour du profil
 * PUT /api/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données invalides', errors.array());
  }

  const userId = req.user.id;
  const { first_name, last_name, preferences } = req.body;

  const profile = await authService.updateProfile(userId, {
    first_name,
    last_name,
    preferences,
  });

  res.status(200).json({
    success: true,
    message: 'Profil mis à jour',
    data: profile,
  });
});

/**
 * Changement de mot de passe
 * PUT /api/auth/password
 */
const changePassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données invalides', errors.array());
  }

  const userId = req.user.id;
  const { current_password, new_password } = req.body;

  await authService.changePassword(userId, current_password, new_password);

  res.status(200).json({
    success: true,
    message: 'Mot de passe changé avec succès',
  });
});

module.exports = {
  register,
  login,
  refreshTokens,
  logout,
  getProfile,
  updateProfile,
  changePassword,
};