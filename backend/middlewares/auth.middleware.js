/**
 * Middleware d'authentification
 * ==============================
 */

const { verifyAccessToken } = require('../config/auth');
const User = require('../models/user.model');
const logger = require('../config/logger');

/**
 * Vérifie le token JWT et ajoute l'utilisateur à la requête
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant',
      });
    }

    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification invalide',
      });
    }

    // Vérification du token
    const decoded = verifyAccessToken(token);

    // Vérification que l'utilisateur existe toujours
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé',
      });
    }

    // Ajout de l'utilisateur à la requête
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    logger.warn('Échec authentification', { error: error.message });

    if (error.message === 'Token expiré') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token invalide',
    });
  }
};

/**
 * Vérifie que l'utilisateur a le rôle requis
 * @param {...string} roles - Rôles autorisés
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Accès non autorisé', {
        userId: req.user.id,
        role: req.user.role,
        requiredRoles: roles,
      });

      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    next();
  };
};

/**
 * Vérifie que l'utilisateur est administrateur
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs',
    });
  }

  next();
};

/**
 * Middleware optionnel d'authentification
 * Ajoute l'utilisateur à la requête s'il est authentifié, mais ne bloque pas
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId);

    if (user && user.is_active) {
      req.user = user;
      req.token = token;
    }

    next();
  } catch (error) {
    // On ignore les erreurs en mode optionnel
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  requireAdmin,
  optionalAuth,
};