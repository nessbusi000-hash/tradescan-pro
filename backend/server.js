/**
 * TradeScan Pro - Backend Server
 * ================================
 * Serveur Express pour la plateforme de trading professionnelle
 * avec analyse Smart Money Concept (SMC/ICT)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./config/logger');
const { errorHandler } = require('./middlewares/error.middleware');
const { securityHeaders } = require('./middlewares/security.middleware');

// Import des routes
const authRoutes = require('./api/routes/auth.routes');
const marketRoutes = require('./api/routes/market.routes');
const smcRoutes = require('./api/routes/smc.routes');
const lessonsRoutes = require('./api/routes/lessons.routes');
const tradesRoutes = require('./api/routes/trades.routes');

// Initialisation de l'application
const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==================== MIDDLEWARES DE SÉCURITÉ ====================

// Trust proxy pour les déploiements cloud
app.set('trust proxy', 1);

// Helmet pour les headers de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://s3.tradingview.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.alpha-vantage.com", "wss:"],
      frameSrc: ["'self'", "https://www.tradingview.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuré
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression des réponses
app.use(compression());

// Protection contre les attaques de pollution des paramètres HTTP
app.use(hpp());

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requêtes par IP
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Rate limiting strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
  },
});

// Parsing du corps des requêtes
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Headers de sécurité personnalisés
app.use(securityHeaders);

// ==================== LOGGING ====================

// Logger des requêtes
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ==================== ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TradeScan Pro API est opérationnelle',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '1.0.0',
  });
});

// Routes API
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/smc', smcRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/trades', tradesRoutes);

// ==================== GESTION DES ERREURS ====================

// Route 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} non trouvée`,
  });
});

// Handler d'erreurs global
app.use(errorHandler);

// ==================== DÉMARRAGE DU SERVEUR ====================

const server = app.listen(PORT, () => {
  logger.info(`🚀 Serveur TradeScan Pro démarré sur le port ${PORT}`);
  logger.info(`📊 Environnement: ${NODE_ENV}`);
  logger.info(`🔗 URL API: http://localhost:${PORT}/api`);
});

// Gestion gracieuse des arrêts
process.on('SIGTERM', () => {
  logger.info('SIGTERM reçu, arrêt gracieux du serveur...');
  server.close(() => {
    logger.info('Serveur arrêté.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT reçu, arrêt gracieux du serveur...');
  server.close(() => {
    logger.info('Serveur arrêté.');
    process.exit(0);
  });
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

module.exports = app;