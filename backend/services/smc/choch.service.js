/**
 * Service de détection des Change of Character (CHoCH)
 * ====================================================
 * 
 * Le CHoCH (Change of Character) est un signal d'inversion de tendance.
 * Il indique un changement de comportement du prix qui peut signaler
 * un retournement de tendance.
 * 
 * CHoCH Haussier (Bullish CHoCH):
 * - En tendance baissière, le prix casse un swing high précédent
 * - Indique un potentiel retournement haussier
 * 
 * CHoCH Baissier (Bearish CHoCH):
 * - En tendance haussière, le prix casse un swing low précédent
 * - Indique un potentiel retournement baissier
 */

const logger = require('../../config/logger');
const { detectSwingPoints } = require('./bos.service');

/**
 * Détecte la tendance actuelle
 * @param {Array} candles - Tableau de bougies
 * @param {number} lookback - Nombre de bougies à analyser
 * @returns {string} Direction de la tendance ('bullish', 'bearish', 'neutral')
 */
const detectTrend = (candles, lookback = 20) => {
  if (candles.length < lookback) return 'neutral';

  const start = candles.length - lookback;
  const end = candles.length - 1;

  const startPrice = candles[start].close;
  const endPrice = candles[end].close;
  const priceChange = ((endPrice - startPrice) / startPrice) * 100;

  // Analyse des highs et lows
  let higherHighs = 0;
  let higherLows = 0;
  let lowerHighs = 0;
  let lowerLows = 0;

  for (let i = start + 1; i <= end; i++) {
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

  // Détermination de la tendance
  if ((hhRatio > 0.5 && hlRatio > 0.5) || priceChange > 2) {
    return 'bullish';
  } else if ((lhRatio > 0.5 && llRatio > 0.5) || priceChange < -2) {
    return 'bearish';
  }

  return 'neutral';
};

/**
 * Détecte les Change of Character (CHoCH)
 * @param {Array} candles - Tableau de bougies
 * @param {Object} options - Options de détection
 * @returns {Array} Liste des CHoCH détectés
 */
const detectCHoCH = (candles, options = {}) => {
  const { leftBars = 5, rightBars = 5, lookbackTrend = 20 } = options;
  const chochSignals = [];

  if (candles.length < lookbackTrend + leftBars + rightBars) {
    return chochSignals;
  }

  const { swingHighs, swingLows } = detectSwingPoints(candles, leftBars, rightBars);
  const currentTrend = detectTrend(candles, lookbackTrend);

  // CHoCH Baissier: En tendance haussière, break d'un swing low
  if (currentTrend === 'bullish') {
    for (let i = swingLows.length - 2; i >= 0; i--) {
      const swingLow = swingLows[i];
      
      // Recherche d'un break après ce swing low
      for (let j = swingLow.index + 1; j < candles.length; j++) {
        const candle = candles[j];
        
        if (candle.close < swingLow.price) {
          // Vérification que c'est bien un changement de caractère
          const momentum = calculateMomentum(candles, j - 5, j);
          
          chochSignals.push({
            type: 'bearish',
            chochType: 'CHoCH',
            trendBefore: 'bullish',
            swingLowIndex: swingLow.index,
            breakIndex: j,
            swingLowPrice: swingLow.price,
            breakPrice: candle.close,
            breakCandle: candle,
            timestamp: candle.date || j,
            strength: calculateCHoCHStrength(candles, swingLow, j, 'bearish'),
            momentum: momentum,
            confirmed: confirmCHoCH(candles, j, 'bearish'),
          });
          break;
        }
      }
    }
  }

  // CHoCH Haussier: En tendance baissière, break d'un swing high
  if (currentTrend === 'bearish') {
    for (let i = swingHighs.length - 2; i >= 0; i--) {
      const swingHigh = swingHighs[i];
      
      // Recherche d'un break après ce swing high
      for (let j = swingHigh.index + 1; j < candles.length; j++) {
        const candle = candles[j];
        
        if (candle.close > swingHigh.price) {
          // Vérification que c'est bien un changement de caractère
          const momentum = calculateMomentum(candles, j - 5, j);
          
          chochSignals.push({
            type: 'bullish',
            chochType: 'CHoCH',
            trendBefore: 'bearish',
            swingHighIndex: swingHigh.index,
            breakIndex: j,
            swingHighPrice: swingHigh.price,
            breakPrice: candle.close,
            breakCandle: candle,
            timestamp: candle.date || j,
            strength: calculateCHoCHStrength(candles, swingHigh, j, 'bullish'),
            momentum: momentum,
            confirmed: confirmCHoCH(candles, j, 'bullish'),
          });
          break;
        }
      }
    }
  }

  logger.debug(`CHoCH détectés: ${chochSignals.length}`);
  return chochSignals;
};

/**
 * Calcule le momentum sur une période
 * @param {Array} candles - Tableau de bougies
 * @param {number} start - Index de départ
 * @param {number} end - Index de fin
 * @returns {number} Momentum (-1 à 1)
 */
const calculateMomentum = (candles, start, end) => {
  start = Math.max(0, start);
  end = Math.min(candles.length - 1, end);

  let upMoves = 0;
  let downMoves = 0;

  for (let i = start + 1; i <= end; i++) {
    if (candles[i].close > candles[i - 1].close) upMoves++;
    else if (candles[i].close < candles[i - 1].close) downMoves++;
  }

  const total = end - start;
  if (total === 0) return 0;

  return (upMoves - downMoves) / total;
};

/**
 * Confirme un CHoCH avec des critères additionnels
 * @param {Array} candles - Tableau de bougies
 * @param {number} breakIndex - Index du break
 * @param {string} type - Type de CHoCH
 * @returns {boolean} Confirmation
 */
const confirmCHoCH = (candles, breakIndex, type) => {
  // Vérification des bougies suivantes pour confirmation
  const confirmationLookahead = Math.min(3, candles.length - breakIndex - 1);
  
  if (confirmationLookahead === 0) return false;

  let confirmations = 0;

  for (let i = 1; i <= confirmationLookahead; i++) {
    const candle = candles[breakIndex + i];
    
    if (type === 'bullish') {
      if (candle.close > candles[breakIndex].close) confirmations++;
      if (candle.close > candle.open) confirmations++;
    } else {
      if (candle.close < candles[breakIndex].close) confirmations++;
      if (candle.close < candle.open) confirmations++;
    }
  }

  return confirmations >= confirmationLookahead;
};

/**
 * Calcule la force d'un CHoCH
 * @param {Array} candles - Tableau de bougies
 * @param {Object} swingPoint - Point de swing
 * @param {number} breakIndex - Index du break
 * @param {string} type - Type de CHoCH
 * @returns {number} Force du CHoCH (0-100)
 */
const calculateCHoCHStrength = (candles, swingPoint, breakIndex, type) => {
  let strength = 50;

  const breakCandle = candles[breakIndex];
  const priceDiff = Math.abs(breakCandle.close - swingPoint.price);
  const avgRange = calculateAverageRange(candles, breakIndex - 10, breakIndex);

  // Force basée sur l'ampleur du break
  if (priceDiff > avgRange * 2) strength += 20;
  else if (priceDiff > avgRange) strength += 10;

  // Force basée sur le momentum
  const momentum = calculateMomentum(candles, breakIndex - 5, breakIndex);
  if (type === 'bullish' && momentum > 0.3) strength += 15;
  else if (type === 'bearish' && momentum < -0.3) strength += 15;

  // Force basée sur la clôture
  if (type === 'bullish') {
    if (breakCandle.close > breakCandle.open) strength += 10;
    if (breakCandle.close === breakCandle.high) strength += 5;
  } else {
    if (breakCandle.close < breakCandle.open) strength += 10;
    if (breakCandle.close === breakCandle.low) strength += 5;
  }

  // Bonus si confirmé
  if (confirmCHoCH(candles, breakIndex, type)) {
    strength += 10;
  }

  return Math.min(100, strength);
};

/**
 * Calcule la moyenne des ranges
 * @param {Array} candles - Tableau de bougies
 * @param {number} start - Index de départ
 * @param {number} end - Index de fin
 * @returns {number} Range moyen
 */
const calculateAverageRange = (candles, start, end) => {
  start = Math.max(0, start);
  end = Math.min(candles.length - 1, end);

  let total = 0;
  for (let i = start; i <= end; i++) {
    total += candles[i].high - candles[i].low;
  }

  return total / (end - start + 1);
};

/**
 * Génère un signal de trading basé sur les CHoCH
 * @param {Array} candles - Tableau de bougies
 * @param {Object} options - Options
 * @returns {Object|null} Signal de trading ou null
 */
const generateCHoCHSignal = (candles, options = {}) => {
  const chochSignals = detectCHoCH(candles, options);

  if (chochSignals.length === 0) return null;

  // Prend le CHoCH le plus récent et confirmé
  const validCHoCH = chochSignals
    .filter((choch) => choch.confirmed)
    .sort((a, b) => b.strength - a.strength)[0];

  if (!validCHoCH || validCHoCH.strength < 65) return null;

  const lastCandle = candles[candles.length - 1];

  return {
    type: validCHoCH.type === 'bullish' ? 'BUY' : 'SELL',
    strategy: 'CHoCH_REVERSAL',
    entry: lastCandle.close,
    stopLoss: validCHoCH.type === 'bullish'
      ? validCHoCH.swingHighPrice * 0.995
      : validCHoCH.swingLowPrice * 1.005,
    takeProfit: validCHoCH.type === 'bullish'
      ? lastCandle.close + (lastCandle.close - validCHoCH.swingHighPrice) * 2
      : lastCandle.close - (validCHoCH.swingLowPrice - lastCandle.close) * 2,
    confidence: validCHoCH.strength,
    choch: validCHoCH,
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  detectTrend,
  detectCHoCH,
  calculateMomentum,
  confirmCHoCH,
  calculateCHoCHStrength,
  generateCHoCHSignal,
};