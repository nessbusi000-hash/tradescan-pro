/**
 * Contrôleur de données marché
 * ============================
 */

const { validationResult } = require('express-validator');
const marketService = require('../services/market.service');
const { asyncHandler, ValidationError, BadRequestError } = require('../middlewares/error.middleware');
const { SUPPORTED_PAIRS, TIMEFRAMES } = require('../config/api');

/**
 * Récupère les données de marché pour un symbole
 * GET /api/market/data/:symbol
 */
const getMarketData = asyncHandler(async (req, res) => {
  const { symbol } = req.params;

  if (!symbol) {
    throw new BadRequestError('Symbole requis');
  }

  const data = await marketService.getMarketData(symbol);

  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * Récupère les données historiques
 * GET /api/market/historical/:symbol
 */
const getHistoricalData = asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  const { interval = 'daily' } = req.query;

  if (!symbol) {
    throw new BadRequestError('Symbole requis');
  }

  const validIntervals = ['1min', '5min', '15min', '30min', '60min', 'daily', 'weekly', 'monthly'];
  if (!validIntervals.includes(interval)) {
    throw new BadRequestError('Intervalle invalide');
  }

  const data = await marketService.getHistoricalData(symbol, interval);

  res.status(200).json({
    success: true,
    data: {
      symbol: symbol.toUpperCase(),
      interval,
      candles: data,
    },
  });
});

/**
 * Récupère les données de plusieurs symboles
 * POST /api/market/multiple
 */
const getMultipleMarketData = asyncHandler(async (req, res) => {
  const { symbols } = req.body;

  if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
    throw new BadRequestError('Liste de symboles requise');
  }

  if (symbols.length > 10) {
    throw new BadRequestError('Maximum 10 symboles par requête');
  }

  const data = await marketService.getMultipleMarketData(symbols);

  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * Récupère la liste des paires supportées
 * GET /api/market/pairs
 */
const getSupportedPairs = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: SUPPORTED_PAIRS,
  });
});

/**
 * Récupère la liste des timeframes
 * GET /api/market/timeframes
 */
const getTimeframes = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: TIMEFRAMES,
  });
});

/**
 * Récupère un aperçu du marché (watchlist)
 * GET /api/market/watchlist
 */
const getWatchlist = asyncHandler(async (req, res) => {
  const defaultSymbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'BTCUSD'];
  
  const data = await marketService.getMultipleMarketData(defaultSymbols);

  res.status(200).json({
    success: true,
    data,
  });
});

module.exports = {
  getMarketData,
  getHistoricalData,
  getMultipleMarketData,
  getSupportedPairs,
  getTimeframes,
  getWatchlist,
};