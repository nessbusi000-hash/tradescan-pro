/**
 * Middleware de sécurité
 * ======================
 * Implémente les protections OWASP recommandées
 */

const logger = require('../config/logger');

/**
 * Headers de sécurité personnalisés
 */
const securityHeaders = (req, res, next) => {
  // Empêche le MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Protection contre le clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Protection XSS
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Politique de référent
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );
  
  // Strict Transport Security (en production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
};

/**
 * Validation des entrées pour prévenir les injections
 */
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return;
    
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Supprime les caractères potentiellement dangereux
        obj[key] = obj[key]
          .replace(/[<>]/g, '') // Supprime < et >
          .trim();
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  
  next();
};

/**
 * Détection des requêtes suspectes
 */
const detectSuspiciousActivity = (req, res, next) => {
  const suspiciousPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // SQL Injection basique
    /((\%3C)|<)[^\n]+((\%3E)|>)/i, // XSS
    /(union|select|insert|update|delete|drop|create|alter|exec|execute)/i, // SQL keywords
  ];

  const checkString = (str) => {
    if (typeof str !== 'string') return false;
    return suspiciousPatterns.some((pattern) => pattern.test(str));
  };

  const checkObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return false;
    return Object.values(obj).some((value) => {
      if (typeof value === 'string') return checkString(value);
      if (typeof value === 'object') return checkObject(value);
      return false;
    });
  };

  if (checkObject(req.query) || checkObject(req.body)) {
    logger.warn('Activité suspecte détectée', {
      ip: req.ip,
      path: req.path,
      query: req.query,
      userAgent: req.get('user-agent'),
    });

    return res.status(403).json({
      success: false,
      message: 'Requête invalide',
    });
  }

  next();
};

/**
 * Protection contre les bots
 */
const botProtection = (req, res, next) => {
  const userAgent = req.get('user-agent') || '';
  
  // Liste des user-agents suspects
  const suspiciousBots = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /zgrab/i,
    /gobuster/i,
    /dirbuster/i,
  ];

  if (suspiciousBots.some((pattern) => pattern.test(userAgent))) {
    logger.warn('Bot suspect détecté', {
      ip: req.ip,
      userAgent,
    });

    return res.status(403).json({
      success: false,
      message: 'Accès refusé',
    });
  }

  next();
};

/**
 * Limite la taille des payloads
 */
const payloadLimit = (maxSize = '10kb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || 0);
    const maxBytes = parseInt(maxSize) * 1024;

    if (contentLength > maxBytes) {
      return res.status(413).json({
        success: false,
        message: 'Payload trop volumineux',
      });
    }

    next();
  };
};

/**
 * Journalisation des accès sensibles
 */
const auditLog = (sensitivePaths = []) => {
  return (req, res, next) => {
    const isSensitive = sensitivePaths.some((path) => 
      req.path.toLowerCase().includes(path.toLowerCase())
    );

    if (isSensitive) {
      logger.info('Accès route sensible', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userId: req.user?.id,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
};

module.exports = {
  securityHeaders,
  sanitizeInput,
  detectSuspiciousActivity,
  botProtection,
  payloadLimit,
  auditLog,
};