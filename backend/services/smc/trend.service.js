/**
 * Service d'analyse des tendances HTF/LTF
 * =======================================
 * 
 * Analyse multi-timeframes pour identifier les tendances
 * sur différentes échelles de temps.
 * 
 * HTF (Higher Time Frame): Tendance principale
 * LTF (Lower Time Frame): Tendance locale pour les entrées
 */

const logger = require('../../config/logger');

/**
 * Calcule les moyennes mobiles
 * @param {Array} candles - Tableau de bougies
 * @param {number} period - Période
 * @returns {Array} Valeurs de la MA
 */
const calculateMA = (candles, period) => {
  const ma = [];
  
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      ma.push(null);
      continue;
    }
    
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close;
    }
    ma.push(sum / period);
  }
  
  return ma;
};

/**
 * Calcule l'EMA (Exponential Moving Average)
 * @param {Array} candles - Tableau de bougies
 * @param {number} period - Période
 * @returns {Array} Valeurs de l'EMA
 */
const calculateEMA = (candles, period) => {
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      ema.push(null);
      continue;
    }
    
    if (i === period - 1) {
      // Première valeur = SMA
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += candles[i - j].close;
      }
      ema.push(sum / period);
    } else {
      // EMA = (Close - EMA précédent) * multiplicateur + EMA précédent
      const value = (candles[i].close - ema[i - 1]) * multiplier + ema[i - 1];
      ema.push(value);
    }
  }
  
  return ema;
};

/**
 * Détecte la tendance basée sur les moyennes mobiles
 * @param {Array} candles - Tableau de bougies
 * @param {Object} options - Options
 * @returns {Object} Analyse de la tendance
 */
const analyzeTrendWithMA = (candles, options = {}) => {
  const { fastPeriod = 20, slowPeriod = 50 } = options;
  
  if (candles.length < slowPeriod) {
    return { direction: 'neutral', strength: 0 };
  }
  
  const fastMA = calculateEMA(candles, fastPeriod);
  const slowMA = calculateEMA(candles, slowPeriod);
  
  const lastIdx = candles.length - 1;
  const currentFast = fastMA[lastIdx];
  const currentSlow = slowMA[lastIdx];
  const prevFast = fastMA[lastIdx - 1];
  const prevSlow = slowMA[lastIdx - 1];
  
  if (!currentFast || !currentSlow) {
    return { direction: 'neutral', strength: 0 };
  }
  
  let direction = 'neutral';
  let strength = 0;
  
  // Golden Cross / Death Cross
  if (currentFast > currentSlow && prevFast <= prevSlow) {
    direction = 'bullish';
    strength = 80;
  } else if (currentFast < currentSlow && prevFast >= prevSlow) {
    direction = 'bearish';
    strength = 80;
  } else if (currentFast > currentSlow) {
    direction = 'bullish';
    const diff = (currentFast - currentSlow) / currentSlow * 100;
    strength = Math.min(70, 40 + diff * 10);
  } else if (currentFast < currentSlow) {
    direction = 'bearish';
    const diff = (currentSlow - currentFast) / currentSlow * 100;
    strength = Math.min(70, 40 + diff * 10);
  }
  
  return {
    direction,
    strength: Math.round(strength),
    fastMA: currentFast,
    slowMA: currentSlow,
    fastPeriod,
    slowPeriod,
  };
};

/**
 * Détecte la tendance basée sur les highs/lows
 * @param {Array} candles - Tableau de bougies
 * @param {number} lookback - Nombre de bougies à analyser
 * @returns {Object} Analyse de la tendance
 */
const analyzeTrendWithPriceAction = (candles, lookback = 20) => {
  if (candles.length < lookback) {
    return { direction: 'neutral', strength: 0 };
  }
  
  const start = candles.length - lookback;
  const end = candles.length;
  
  let higherHighs = 0;
  let higherLows = 0;
  let lowerHighs = 0;
  let lowerLows = 0;
  
  for (let i = start + 1; i < end; i++) {
    if (candles[i].high > candles[i - 1].high) higherHighs++;
    if (candles[i].low > candles[i - 1].low) higherLows++;
    if (candles[i].high < candles[i - 1].high) lowerHighs++;
    if (candles[i].low < candles[i - 1].low) lowerLows++;
  }
  
  const total = lookback - 1;
  const hhRatio = higherHighs / total;
  const hlRatio = higherLows / total;
  const lhRatio = lowerHighs / total;
  const llRatio = lowerLows / total;
  
  let direction = 'neutral';
  let strength = 0;
  
  if (hhRatio > 0.5 && hlRatio > 0.5) {
    direction = 'bullish';
    strength = Math.round((hhRatio + hlRatio) * 50);
  } else if (lhRatio > 0.5 && llRatio > 0.5) {
    direction = 'bearish';
    strength = Math.round((lhRatio + llRatio) * 50);
  }
  
  return {
    direction,
    strength: Math.min(100, strength),
    higherHighs,
    higherLows,
    lowerHighs,
    lowerLows,
    lookback,
  };
};

/**
 * Analyse multi-timeframes (HTF + LTF)
 * @param {Object} timeframeData - Données des différents timeframes
 * @returns {Object} Analyse complète
 */
const analyzeMultiTimeframe = (timeframeData) => {
  // timeframeData = { htf: candles[], ltf: candles[] }
  
  const htfTrend = analyzeTrendWithPriceAction(timeframeData.htf, 20);
  const ltfTrend = analyzeTrendWithPriceAction(timeframeData.ltf, 20);
  
  // Alignement des tendances
  const alignment = htfTrend.direction === ltfTrend.direction;
  
  // Score de confiance
  let confidence = 0;
  if (alignment) {
    confidence = (htfTrend.strength + ltfTrend.strength) / 2;
  } else {
    // Divergence HTF/LTF - privilégier HTF
    confidence = htfTrend.strength * 0.7;
  }
  
  // Recommandation de trading
  let recommendation = 'WAIT';
  if (htfTrend.direction === 'bullish' && ltfTrend.direction === 'bullish') {
    recommendation = 'BUY';
  } else if (htfTrend.direction === 'bearish' && ltfTrend.direction === 'bearish') {
    recommendation = 'SELL';
  } else if (htfTrend.direction === 'bullish' && ltfTrend.direction === 'bearish') {
    recommendation = 'WAIT_LTF_PULLBACK';
  } else if (htfTrend.direction === 'bearish' && ltfTrend.direction === 'bullish') {
    recommendation = 'WAIT_LTF_BOUNCE';
  }
  
  return {
    htf: htfTrend,
    ltf: ltfTrend,
    alignment,
    confidence: Math.round(confidence),
    recommendation,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Détecte les niveaux de support et résistance
 * @param {Array} candles - Tableau de bougies
 * @param {Object} options - Options
 * @returns {Object} Supports et résistances
 */
const detectSupportResistance = (candles, options = {}) => {
  const { lookback = 50, touchesRequired = 2, tolerancePercent = 0.1 } = options;
  
  const start = Math.max(0, candles.length - lookback);
  const supports = [];
  const resistances = [];
  
  // Détection des niveaux de support
  for (let i = start; i < candles.length - 1; i++) {
    const level = candles[i].low;
    const tolerance = level * (tolerancePercent / 100);
    
    let touches = 1;
    const touchIndices = [i];
    
    for (let j = start; j < candles.length; j++) {
      if (i !== j && Math.abs(candles[j].low - level) <= tolerance) {
        touches++;
        touchIndices.push(j);
      }
    }
    
    if (touches >= touchesRequired) {
      const alreadyExists = supports.some(
        (s) => Math.abs(s.price - level) <= tolerance
      );
      
      if (!alreadyExists) {
        supports.push({
          price: level,
          touches,
          touchIndices: touchIndices.sort((a, b) => a - b),
          strength: touches * 10,
        });
      }
    }
  }
  
  // Détection des niveaux de résistance
  for (let i = start; i < candles.length - 1; i++) {
    const level = candles[i].high;
    const tolerance = level * (tolerancePercent / 100);
    
    let touches = 1;
    const touchIndices = [i];
    
    for (let j = start; j < candles.length; j++) {
      if (i !== j && Math.abs(candles[j].high - level) <= tolerance) {
        touches++;
        touchIndices.push(j);
      }
    }
    
    if (touches >= touchesRequired) {
      const alreadyExists = resistances.some(
        (r) => Math.abs(r.price - level) <= tolerance
      );
      
      if (!alreadyExists) {
        resistances.push({
          price: level,
          touches,
          touchIndices: touchIndices.sort((a, b) => a - b),
          strength: touches * 10,
        });
      }
    }
  }
  
  // Trier par force
  supports.sort((a, b) => b.strength - a.strength);
  resistances.sort((a, b) => b.strength - a.strength);
  
  return {
    supports: supports.slice(0, 5),
    resistances: resistances.slice(0, 5),
  };
};

/**
 * Analyse complète de la tendance
 * @param {Array} candles - Tableau de bougies
 * @returns {Object} Analyse complète
 */
const getFullTrendAnalysis = (candles) => {
  const maAnalysis = analyzeTrendWithMA(candles);
  const priceActionAnalysis = analyzeTrendWithPriceAction(candles);
  const srLevels = detectSupportResistance(candles);
  
  const lastPrice = candles[candles.length - 1].close;
  
  // Déterminer la tendance dominante
  let dominantTrend = 'neutral';
  let trendStrength = 0;
  
  if (maAnalysis.direction === priceActionAnalysis.direction) {
    dominantTrend = maAnalysis.direction;
    trendStrength = (maAnalysis.strength + priceActionAnalysis.strength) / 2;
  } else if (maAnalysis.strength > priceActionAnalysis.strength) {
    dominantTrend = maAnalysis.direction;
    trendStrength = maAnalysis.strength * 0.8;
  } else {
    dominantTrend = priceActionAnalysis.direction;
    trendStrength = priceActionAnalysis.strength * 0.8;
  }
  
  // Trouver les niveaux proches
  const nearbySupport = srLevels.supports
    .filter((s) => s.price < lastPrice)
    .sort((a, b) => b.price - a.price)[0];
  
  const nearbyResistance = srLevels.resistances
    .filter((r) => r.price > lastPrice)
    .sort((a, b) => a.price - b.price)[0];
  
  return {
    trend: {
      direction: dominantTrend,
      strength: Math.round(trendStrength),
    },
    movingAverages: maAnalysis,
    priceAction: priceActionAnalysis,
    supportResistance: srLevels,
    nearbyLevels: {
      support: nearbySupport,
      resistance: nearbyResistance,
    },
    lastPrice,
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  calculateMA,
  calculateEMA,
  analyzeTrendWithMA,
  analyzeTrendWithPriceAction,
  analyzeMultiTimeframe,
  detectSupportResistance,
  getFullTrendAnalysis,
};