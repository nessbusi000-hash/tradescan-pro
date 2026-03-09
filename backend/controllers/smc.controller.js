/**
 * Contrôleur SMC (Smart Money Concepts)
 * =====================================
 */

const { validationResult } = require('express-validator');
const fvgService = require('../services/smc/fvg.service');
const bosService = require('../services/smc/bos.service');
const chochService = require('../services/smc/choch.service');
const liquidityService = require('../services/smc/liquidity.service');
const trendService = require('../services/smc/trend.service');
const marketService = require('../services/market.service');
const { asyncHandler, ValidationError, BadRequestError } = require('../middlewares/error.middleware');

/**
 * Détecte tous les patterns SMC
 * POST /api/smc/analyze
 */
const analyzeSMC = asyncHandler(async (req, res) => {
  const { symbol, interval = 'daily' } = req.body;

  if (!symbol) {
    throw new BadRequestError('Symbole requis');
  }

  // Récupération des données historiques
  const candles = await marketService.getHistoricalData(symbol, interval);

  if (candles.length < 20) {
    throw new BadRequestError('Données insuffisantes pour l\'analyse');
  }

  // Analyse complète
  const fvgs = fvgService.detectFVG(candles);
  const bosSignals = bosService.detectBOS(candles);
  const chochSignals = chochService.detectCHoCH(candles);
  const liquiditySweeps = liquidityService.detectLiquiditySweeps(candles);
  const trendAnalysis = trendService.getFullTrendAnalysis(candles);

  // Génération des signaux
  const fvgSignal = fvgService.generateFVGSignal(candles);
  const bosSignal = bosService.generateBOSSignal(candles);
  const chochSignal = chochService.generateCHoCHSignal(candles);
  const liquiditySignal = liquidityService.generateLiquiditySignal(candles);

  // Sélection du meilleur signal
  const allSignals = [fvgSignal, bosSignal, chochSignal, liquiditySignal]
    .filter((s) => s !== null)
    .sort((a, b) => b.confidence - a.confidence);

  const bestSignal = allSignals[0] || null;

  res.status(200).json({
    success: true,
    data: {
      symbol: symbol.toUpperCase(),
      interval,
      timestamp: new Date().toISOString(),
      trend: trendAnalysis,
      patterns: {
        fvg: {
          count: fvgs.length,
          active: fvgs.filter((f) => f.status === 'active').length,
          retested: fvgs.filter((f) => f.retested).length,
          rejected: fvgs.filter((f) => f.rejected).length,
          details: fvgs.slice(0, 10),
        },
        bos: {
          count: bosSignals.length,
          bullish: bosSignals.filter((b) => b.type === 'bullish').length,
          bearish: bosSignals.filter((b) => b.type === 'bearish').length,
          recent: bosSignals.slice(-5),
        },
        choch: {
          count: chochSignals.length,
          bullish: chochSignals.filter((c) => c.type === 'bullish').length,
          bearish: chochSignals.filter((c) => c.type === 'bearish').length,
          recent: chochSignals.slice(-5),
        },
        liquidity: {
          sweeps: liquiditySweeps.length,
          recentSweeps: liquiditySweeps.slice(0, 5),
        },
      },
      signals: {
        best: bestSignal,
        all: allSignals.slice(0, 3),
      },
    },
  });
});

/**
 * Détecte les FVG
 * POST /api/smc/fvg
 */
const detectFVG = asyncHandler(async (req, res) => {
  const { symbol, interval = 'daily', options = {} } = req.body;

  if (!symbol) {
    throw new BadRequestError('Symbole requis');
  }

  const candles = await marketService.getHistoricalData(symbol, interval);
  const fvgs = fvgService.detectFVG(candles, options);
  const signal = fvgService.generateFVGSignal(candles, options);

  res.status(200).json({
    success: true,
    data: {
      symbol: symbol.toUpperCase(),
      interval,
      fvgs,
      signal,
    },
  });
});

/**
 * Détecte les BOS
 * POST /api/smc/bos
 */
const detectBOS = asyncHandler(async (req, res) => {
  const { symbol, interval = 'daily', options = {} } = req.body;

  if (!symbol) {
    throw new BadRequestError('Symbole requis');
  }

  const candles = await marketService.getHistoricalData(symbol, interval);
  const bosSignals = bosService.detectBOS(candles, options);
  const signal = bosService.generateBOSSignal(candles, options);

  res.status(200).json({
    success: true,
    data: {
      symbol: symbol.toUpperCase(),
      interval,
      bos: bosSignals,
      signal,
    },
  });
});

/**
 * Détecte les CHoCH
 * POST /api/smc/choch
 */
const detectCHoCH = asyncHandler(async (req, res) => {
  const { symbol, interval = 'daily', options = {} } = req.body;

  if (!symbol) {
    throw new BadRequestError('Symbole requis');
  }

  const candles = await marketService.getHistoricalData(symbol, interval);
  const chochSignals = chochService.detectCHoCH(candles, options);
  const signal = chochService.generateCHoCHSignal(candles, options);

  res.status(200).json({
    success: true,
    data: {
      symbol: symbol.toUpperCase(),
      interval,
      choch: chochSignals,
      signal,
    },
  });
});

/**
 * Détecte les Liquidity Sweeps
 * POST /api/smc/liquidity
 */
const detectLiquidity = asyncHandler(async (req, res) => {
  const { symbol, interval = 'daily', options = {} } = req.body;

  if (!symbol) {
    throw new BadRequestError('Symbole requis');
  }

  const candles = await marketService.getHistoricalData(symbol, interval);
  const liquidityZones = liquidityService.detectLiquidityZones(candles, options);
  const sweeps = liquidityService.detectLiquiditySweeps(candles, options);
  const signal = liquidityService.generateLiquiditySignal(candles, options);

  res.status(200).json({
    success: true,
    data: {
      symbol: symbol.toUpperCase(),
      interval,
      zones: liquidityZones,
      sweeps,
      signal,
    },
  });
});

/**
 * Analyse de tendance
 * POST /api/smc/trend
 */
const analyzeTrend = asyncHandler(async (req, res) => {
  const { symbol, interval = 'daily' } = req.body;

  if (!symbol) {
    throw new BadRequestError('Symbole requis');
  }

  const candles = await marketService.getHistoricalData(symbol, interval);
  const analysis = trendService.getFullTrendAnalysis(candles);

  res.status(200).json({
    success: true,
    data: {
      symbol: symbol.toUpperCase(),
      interval,
      analysis,
    },
  });
});

/**
 * Récupère le signal actuel
 * POST /api/smc/signal
 */
const getCurrentSignal = asyncHandler(async (req, res) => {
  const { symbol, interval = 'daily' } = req.body;

  if (!symbol) {
    throw new BadRequestError('Symbole requis');
  }

  const candles = await marketService.getHistoricalData(symbol, interval);

  // Génération de tous les signaux
  const fvgSignal = fvgService.generateFVGSignal(candles);
  const bosSignal = bosService.generateBOSSignal(candles);
  const chochSignal = chochService.generateCHoCHSignal(candles);
  const liquiditySignal = liquidityService.generateLiquiditySignal(candles);

  const allSignals = [fvgSignal, bosSignal, chochSignal, liquiditySignal]
    .filter((s) => s !== null)
    .sort((a, b) => b.confidence - a.confidence);

  const bestSignal = allSignals[0] || null;

  res.status(200).json({
    success: true,
    data: {
      symbol: symbol.toUpperCase(),
      interval,
      timestamp: new Date().toISOString(),
      signal: bestSignal,
      alternatives: allSignals.slice(1, 3),
    },
  });
});

module.exports = {
  analyzeSMC,
  detectFVG,
  detectBOS,
  detectCHoCH,
  detectLiquidity,
  analyzeTrend,
  getCurrentSignal,
};