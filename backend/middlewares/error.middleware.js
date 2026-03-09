/**
 * Middleware de gestion des erreurs
 * ==================================
 */

const logger = require('../config/logger');

/**
 * Classe d'erreur personnalisée pour l'API
 */
class APIError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erreur 400 - Bad Request
 */
class BadRequestError extends APIError {
  constructor(message = 'Requête invalide', code = 'BAD_REQUEST') {
    super(message, 400, code);
  }
}

/**
 * Erreur 401 - Unauthorized
 */
class UnauthorizedError extends APIError {
  constructor(message = 'Authentification requise', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

/**
 * Erreur 403 - Forbidden
 */
class ForbiddenError extends APIError {
  constructor(message = 'Accès interdit', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

/**
 * Erreur 404 - Not Found
 */
class NotFoundError extends APIError {
  constructor(message = 'Ressource non trouvée', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

/**
 * Erreur 409 - Conflict
 */
class ConflictError extends APIError {
  constructor(message = 'Conflit de données', code = 'CONFLICT') {
    super(message, 409, code);
  }
}

/**
 * Erreur 422 - Validation Error
 */
class ValidationError extends APIError {
  constructor(message = 'Données invalides', errors = [], code = 'VALIDATION_ERROR') {
    super(message, 422, code);
    this.errors = errors;
  }
}

/**
 * Erreur 429 - Too Many Requests
 */
class RateLimitError extends APIError {
  constructor(message = 'Trop de requêtes', code = 'RATE_LIMIT') {
    super(message, 429, code);
  }
}

/**
 * Handler d'erreurs global
 */
const errorHandler = (err, req, res, next) => {
  // Détermination du statut et du message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Erreur serveur';
  let code = err.code || 'INTERNAL_ERROR';
  let errors = err.errors || null;

  // Gestion des erreurs spécifiques
  if (err.code === '23505') {
    // Violation de contrainte unique PostgreSQL
    statusCode = 409;
    message = 'Cette donnée existe déjà';
    code = 'DUPLICATE_ENTRY';
  } else if (err.code === '23503') {
    // Violation de clé étrangère PostgreSQL
    statusCode = 400;
    message = 'Référence invalide';
    code = 'FOREIGN_KEY_VIOLATION';
  } else if (err.code === '22P02') {
    // Type de donnée invalide PostgreSQL
    statusCode = 400;
    message = 'Type de donnée invalide';
    code = 'INVALID_DATA_TYPE';
  } else if (err.name === 'ValidationError') {
    // Erreur de validation (ex: express-validator)
    statusCode = 422;
    message = 'Données invalides';
    code = 'VALIDATION_ERROR';
    errors = err.errors || err.array?.() || [];
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token invalide';
    code = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expiré';
    code = 'TOKEN_EXPIRED';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service temporairement indisponible';
    code = 'SERVICE_UNAVAILABLE';
  }

  // Logging
  if (statusCode >= 500) {
    logger.error('Erreur serveur', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.warn('Erreur client', {
      statusCode,
      message,
      code,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  }

  // Réponse
  const response = {
    success: false,
    message,
    code,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.message,
    }),
  };

  res.status(statusCode).json(response);
};

/**
 * Wrapper pour les contrôleurs async
 * Capture automatiquement les erreurs
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware pour gérer les routes non trouvées
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} non trouvée`);
  next(error);
};

module.exports = {
  APIError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
};