/**
 * Routes de données marché
 * ========================
 */

const express = require('express');
const { body } = require('express-validator');
const marketController = require('../../controllers/market.controller');
const { authenticate, optionalAuth } = require('../../middlewares/auth.middleware');

const router = express.Router();

// Routes publiques (avec rate limiting plus strict en production)
router.get('/pairs', marketController.getSupportedPairs);
router.get('/timeframes', marketController.getTimeframes);
router.get('/watchlist', marketController.getWatchlist);
router.get('/data/:symbol', marketController.getMarketData);
router.get('/historical/:symbol', marketController.getHistoricalData);

// Route protégée pour les données multiples (économie d'appels API)
router.post('/multiple', [
  authenticate,
  body('symbols')
    .isArray({ min: 1, max: 10 })
    .withMessage('La liste doit contenir entre 1 et 10 symboles'),
  body('symbols.*')
    .isString()
    .isLength({ min: 3, max: 10 })
    .withMessage('Symbole invalide'),
], marketController.getMultipleMarketData);

module.exports = router;