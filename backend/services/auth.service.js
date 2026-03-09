/**
 * Service d'authentification
 * ==========================
 */

const User = require('../models/user.model');
const { generateTokenPair, verifyRefreshToken } = require('../config/auth');
const logger = require('../config/logger');

// Stockage des tokens de rafraîchissement invalidés (blacklist)
// En production, utiliser Redis
const tokenBlacklist = new Set();

/**
 * Inscrit un nouvel utilisateur
 * @param {Object} userData - Données d'inscription
 * @returns {Promise<Object>} Utilisateur créé et tokens
 */
const register = async (userData) => {
  const { email, password, first_name, last_name } = userData;

  // Vérification que l'email n'est pas déjà utilisé
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new Error('Cet email est déjà utilisé');
  }

  // Création de l'utilisateur
  const user = await User.create({
    email,
    password,
    first_name,
    last_name,
  });

  // Génération des tokens
  const tokens = generateTokenPair(user);

  logger.info(`Inscription réussie: ${email}`);

  return {
    user: user.toJSON(),
    tokens,
  };
};

/**
 * Connecte un utilisateur
 * @param {string} email - Email
 * @param {string} password - Mot de passe
 * @returns {Promise<Object>} Utilisateur et tokens
 */
const login = async (email, password) => {
  // Authentification
  const user = await User.authenticate(email, password);

  if (!user) {
    throw new Error('Email ou mot de passe incorrect');
  }

  // Génération des tokens
  const tokens = generateTokenPair(user);

  logger.info(`Connexion réussie: ${email}`);

  return {
    user: user.toJSON(),
    tokens,
  };
};

/**
 * Rafraîchit les tokens
 * @param {string} refreshToken - Token de rafraîchissement
 * @returns {Promise<Object>} Nouveaux tokens
 */
const refreshTokens = async (refreshToken) => {
  // Vérification que le token n'est pas blacklisté
  if (tokenBlacklist.has(refreshToken)) {
    throw new Error('Token invalide');
  }

  // Vérification du token
  const decoded = verifyRefreshToken(refreshToken);

  // Vérification que l'utilisateur existe
  const user = await User.findById(decoded.userId);

  if (!user || !user.is_active) {
    throw new Error('Utilisateur non trouvé');
  }

  // Génération de nouveaux tokens
  const tokens = generateTokenPair(user);

  // Blacklist de l'ancien token
  tokenBlacklist.add(refreshToken);

  logger.info(`Tokens rafraîchis pour l'utilisateur: ${user.id}`);

  return {
    tokens,
  };
};

/**
 * Déconnecte un utilisateur
 * @param {string} token - Token d'accès
 * @param {string} refreshToken - Token de rafraîchissement (optionnel)
 * @returns {Promise<boolean>} Succès de l'opération
 */
const logout = async (token, refreshToken = null) => {
  // Ajout des tokens à la blacklist
  tokenBlacklist.add(token);
  
  if (refreshToken) {
    tokenBlacklist.add(refreshToken);
  }

  logger.info('Déconnexion réussie');
  return true;
};

/**
 * Récupère le profil d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Profil utilisateur
 */
const getProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  return user.toJSON();
};

/**
 * Met à jour le profil d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} updates - Données à mettre à jour
 * @returns {Promise<Object>} Profil mis à jour
 */
const updateProfile = async (userId, updates) => {
  const user = await User.update(userId, updates);
  return user.toJSON();
};

/**
 * Change le mot de passe
 * @param {string} userId - ID de l'utilisateur
 * @param {string} currentPassword - Mot de passe actuel
 * @param {string} newPassword - Nouveau mot de passe
 * @returns {Promise<boolean>} Succès de l'opération
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  // Récupération de l'utilisateur avec le hash
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  // Vérification du mot de passe actuel
  const { verifyPassword } = require('../config/auth');
  const isValid = await verifyPassword(currentPassword, user.password_hash);

  if (!isValid) {
    throw new Error('Mot de passe actuel incorrect');
  }

  // Changement du mot de passe
  await User.changePassword(userId, newPassword);

  return true;
};

/**
 * Vérifie si un token est blacklisté
 * @param {string} token - Token à vérifier
 * @returns {boolean} True si blacklisté
 */
const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

/**
 * Nettoie les anciens tokens de la blacklist (à appeler périodiquement)
 */
const cleanupBlacklist = () => {
  // En production avec Redis, les tokens expirent automatiquement
  // Ici on vide simplement la blacklist
  tokenBlacklist.clear();
  logger.info('Blacklist des tokens nettoyée');
};

module.exports = {
  register,
  login,
  refreshTokens,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  isTokenBlacklisted,
  cleanupBlacklist,
};