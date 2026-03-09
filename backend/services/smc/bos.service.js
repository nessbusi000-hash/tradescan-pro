/**
 * Service de détection des Break of Structure (BOS)
 * ==================================================
 * 
 * Le BOS (Break of Structure) est un signal qui indique la continuation d'une tendance.
 * Il se produit lorsque le prix casse un swing high (tendance haussière) ou un swing low (tendance baissière).
 * 
 * BOS Haussier (Bullish BOS):
 * - Le prix casse au-dessus d'un swing high précédent
 * - Confirme la continuation de la tendance haussière
 * 
 * BOS Baissier (Bearish BOS):
 * - Le prix casse en-dessous d'un swing low précédent
 * - Confirme la continuation de la tendance baissière
 */

const logger = require('../../config/logger');

/**
 * Détecte les points pivots (swing highs et swing lows)
 * @param {Array} candles - Tableau de bougies
 * @param {number} leftBars - Nombre de barres à gauche
 * @param {param} rightBars - Nombre de barres à droite
 * @returns {Object} Swing highs et swing lows
 */
const detectSwingPoints = (candles, leftBars = 5, rightBars = 5) => {
  const swingHighs = [];
  const swingLows = [];

  for (let i = leftBars; i < candles.length - rightBars; i++) {
    const current = candles[i];
    
    // Détection Swing High
    let isSwingHigh = true;
    for (let j = 1; j <= leftBars; j++) {
      if (candles[i - j].high >= current.high) {
        isSwingHigh = false;
        break;
      }
    }
    for (let j = 1; j <= rightBars; j++) {
      if (candles[i + j].high > current.high) {
        isSwingHigh = false;
        break;
      }
    }
    
    if (isSwingHigh) {
      swingHighs.push({
        index: i,
        price: current.high,
        timestamp: current.date || i,
      });
    }

    // Détection Swing Low
    let isSwingLow = true;
    for (let j = 1; j <= leftBars; j++) {
      if (candles[i - j].low <= current.low) {
        isSwingLow = false;
        break;
      }
    }
    for (let j = 1; j <= rightBars; j++) {
      if (candles[i + j].low < current.low) {
        isSwingLow = false;
        break;
      }
    }
    
    if (isSwingLow) {
      swingLows.push({
        index: i,
        price: current.low,
        timestamp: current.date || i,
      });
    }
  }

  return { swingHighs, swingLows };
};

/**
 * Détecte les Break of Structure (BOS)
 * @param {Array} candles - Tableau de bougies
 * @param {Object} options - Options de détection
 * @returns {Array} Liste des BOS détectés
 */
const detectBOS = (candles, options = {}) => {
  const { leftBars = 5, rightBars = 5, minBreakPercent = 0.1 } = options;
  const bosSignals = [];

  if (candles.length < leftBars + rightBars + 2) {
    return bosSignals;
  }

  const { swingHighs, swingLows } = detectSwingPoints(candles, leftBars, rightBars);

  // Détection BOS Haussier (break au-dessus d'un swing high)
  for (let i = 1; i < swingHighs.length; i++) {
    const prevHigh = swingHighs[i - 1];
    const currentHigh = swingHighs[i];

    // Recherche du break entre les deux swing highs
    for (let j = prevHigh.index + 1; j < currentHigh.index; j++) {
      const candle = candles[j];
      const breakThreshold = prevHigh.price * (1 + minBreakPercent / 100);

      if (candle.close > breakThreshold && candle.close > prevHigh.price) {
        // Vérification que c'est bien une tendance haussière
        const trendConfirmation = confirmTrend(candles, prevHigh.index, j, 'bullish');

        bosSignals.push({
          type: 'bullish',
          breakType: 'BOS',
          swingHighIndex: prevHigh.index,
          breakIndex: j,
          confirmationIndex: currentHigh.index,
          swingHighPrice: prevHigh.price,
          breakPrice: candle.close,
          breakCandle: candle,
          timestamp: candle.date || j,
          strength: calculateBOSStrrength(candles, prevHigh, j, 'bullish'),
          trendConfirmed: trendConfirmation,
        });
        break;
      }
    }
  }

  // Détection BOS Baissier (break en-dessous d'un swing low)
  for (let i = 1; i < swingLows.length; i++) {
    const prevLow = swingLows[i - 1];
    const currentLow = swingLows[i];

    // Recherche du break entre les deux swing lows
    for (let j = prevLow.index + 1; j < currentLow.index; j++) {
      const candle = candles[j];
      const breakThreshold = prevLow.price * (1 - minBreakPercent / 100);

      if (candle.close < breakThreshold && candle.close < prevLow.price) {
        // Vérification que c'est bien une tendance baissière
        const trendConfirmation = confirmTrend(candles, prevLow.index, j, 'bearish');

        bosSignals.push({
          type: 'bearish',
          breakType: 'BOS',
          swingLowIndex: prevLow.index,
          breakIndex: j,
          confirmationIndex: currentLow.index,
          swingLowPrice: prevLow.price,
          breakPrice: candle.close,
          breakCandle: candle,
          timestamp: candle.date || j,
          strength: calculateBOSStrrength(candles, prevLow, j, 'bearish'),
          trendConfirmed: trendConfirmation,
        });
        break;
      }
    }
  }

  logger.debug(`BOS détectés: ${bosSignals.length}`);
  return bosSignals;
};

/**
 * Confirme la direction de la tendance
 * @param {Array} candles - Tableau de bougies
 * @param {number} startIndex - Index de départ
 * @param {number} endIndex - Index de fin
 * @param {string} direction - Direction ('bullish' ou 'bearish')
 * @returns {boolean} Confirmation de la tendance
 */
const confirmTrend = (candles, startIndex, endIndex, direction) => {
  let higherHighs = 0;
  let higherLows = 0;
  let lowerHighs = 0;
  let lowerLows = 0;

  for (let i = startIndex + 1; i < endIndex; i++) {
    if (candles[i].high > candles[i - 1].high) higherHighs++;
    if (candles[i].low > candles[i - 1].low) higherLows++;
    if (candles[i].high < candles[i - 1].high) lowerHighs++;
    if (candles[i].low < candles[i - 1].low) lowerLows++;
  }

  const total = endIndex - startIndex - 1;
  
  if (direction === 'bullish') {
    return (higherHighs + higherLows) / (total * 2) > 0.5;
  } else {
    return (lowerHighs + lowerLows) / (total * 2) > 0.5;
  }
};

/**
 * Calcule la force d'un BOS
 * @param {Array} candles - Tableau de bougies
 * @param {Object} swingPoint - Point de swing
 * @param {number} breakIndex - Index du break
 * @param {string} type - Type de BOS
 * @returns {number} Force du BOS (0-100)
 */
const calculateBOSStrrength = (candles, swingPoint, breakIndex, type) => {
  let strength = 50;

  // Force basée sur la distance parcourue
  const breakCandle = candles[breakIndex];
  const priceDiff = Math.abs(breakCandle.close - swingPoint.price);
  const avgRange = calculateAverageRange(candles, breakIndex - 10, breakIndex);
  
  if (priceDiff > avgRange * 2) strength += 20;
  else if (priceDiff > avgRange) strength += 10;

  // Force basée sur le volume (si disponible)
  if (breakCandle.volume) {
    const avgVolume = calculateAverageVolume(candles, breakIndex - 10, breakIndex);
    if (breakCandle.volume > avgVolume * 1.5) strength += 15;
    else if (breakCandle.volume > avgVolume) strength += 5;
  }

  // Force basée sur la clôture
  if (type === 'bullish') {
    if (breakCandle.close > breakCandle.open) strength += 10;
    if (breakCandle.close === breakCandle.high) strength += 5;
  } else {
    if (breakCandle.close < breakCandle.open) strength += 10;
    if (breakCandle.close === breakCandle.low) strength += 5;
  }

  return Math.min(100, strength);
};

/**
 * Calcule la moyenne des ranges sur une période
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
 * Calcule la moyenne des volumes sur une période
 * @param {Array} candles - Tableau de bougies
 * @param {number} start - Index de départ
 * @param {number} end - Index de fin
 * @returns {number} Volume moyen
 */
const calculateAverageVolume = (candles, start, end) => {
  start = Math.max(0, start);
  end = Math.min(candles.length - 1, end);
  
  let total = 0;
  let count = 0;
  
  for (let i = start; i <= end; i++) {
    if (candles[i].volume) {
      total += candles[i].volume;
      count++;
    }
  }
  
  return count > 0 ? total / count : 0;
};

/**
 * Génère un signal de trading basé sur les BOS
 * @param {Array} candles - Tableau de bougies
 * @param {Object} options - Options
 * @returns {Object|null} Signal de trading ou null
 */
const generateBOSSignal = (candles, options = {}) => {
  const bosSignals = detectBOS(candles, options);
  
  if (bosSignals.length === 0) return null;

  // Prend le BOS le plus récent et le plus fort
  const recentBOS = bosSignals
    .filter((bos) => bos.trendConfirmed)
    .sort((a, b) => b.strength - a.strength)[0];

  if (!recentBOS || recentBOS.strength < 60) return null;

  const lastCandle = candles[candles.length - 1];
  
  return {
    type: recentBOS.type === 'bullish' ? 'BUY' : 'SELL',
    strategy: 'BOS_CONTINUATION',
    entry: lastCandle.close,
    stopLoss: recentBOS.type === 'bullish'
      ? recentBOS.swingHighPrice * 0.998
      : recentBOS.swingLowPrice * 1.002,
    takeProfit: recentBOS.type === 'bullish'
      ? lastCandle.close + (lastCandle.close - recentBOS.swingHighPrice) * 2
      : lastCandle.close - (recentBOS.swingLowPrice - lastCandle.close) * 2,
    confidence: recentBOS.strength,
    bos: recentBOS,
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  detectSwingPoints,
  detectBOS,
  confirmTrend,
  calculateBOSStrrength,
  generateBOSSignal,
};