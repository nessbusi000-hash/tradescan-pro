/**
 * Configuration de l'authentification JWT
 * ========================================
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('./logger');

// Configuration JWT
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'tradescan-secret-key-change-in-production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'tradescan-refresh-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  issuer: 'tradescan-pro',
  audience: 'tradescan-users',
};

// Configuration bcrypt
const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hash un mot de passe
 * @param {string} password - Mot de passe en clair
 * @returns {Promise<string>} Mot de passe hashé
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    logger.error('Erreur hashage mot de passe', error);
    throw new Error('Erreur lors du hashage du mot de passe');
  }
};

/**
 * Vérifie un mot de passe
 * @param {string} password - Mot de passe en clair
 * @param {string} hash - Mot de passe hashé
 * @returns {Promise<boolean>} Résultat de la vérification
 */
const verifyPassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error('Erreur vérification mot de passe', error);
    throw new Error('Erreur lors de la vérification du mot de passe');
  }
};

/**
 * Génère un token JWT d'accès
 * @param {Object} payload - Données à encoder
 * @returns {string} Token JWT
 */
const generateAccessToken = (payload) => {
  return jwt.sign(
    {
      ...payload,
      type: 'access',
    },
    JWT_CONFIG.secret,
    {
      expiresIn: JWT_CONFIG.expiresIn,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    }
  );
};

/**
 * Génère un token JWT de rafraîchissement
 * @param {Object} payload - Données à encoder
 * @returns {string} Token JWT
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    {
      ...payload,
      type: 'refresh',
    },
    JWT_CONFIG.refreshSecret,
    {
      expiresIn: JWT_CONFIG.refreshExpiresIn,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    }
  );
};

/**
 * Génère une paire de tokens (access + refresh)
 * @param {Object} user - Utilisateur
 * @returns {Object} Tokens access et refresh
 */
const generateTokenPair = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role || 'user',
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    expiresIn: JWT_CONFIG.expiresIn,
  };
};

/**
 * Vérifie un token JWT d'accès
 * @param {string} token - Token JWT
 * @returns {Object} Payload décodé
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_CONFIG.secret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expiré');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Token invalide');
    }
    throw error;
  }
};

/**
 * Vérifie un token JWT de rafraîchissement
 * @param {string} token - Token JWT
 * @returns {Object} Payload décodé
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_CONFIG.refreshSecret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token de rafraîchissement expiré');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Token de rafraîchissement invalide');
    }
    throw error;
  }
};

/**
 * Décode un token sans vérification (pour debugging)
 * @param {string} token - Token JWT
 * @returns {Object} Payload décodé
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  JWT_CONFIG,
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
};