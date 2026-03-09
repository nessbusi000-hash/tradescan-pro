/**
 * Service de détection des Liquidités et Liquidity Sweeps
 * ========================================================
 * 
 * La liquidité représente les zones où les gros joueurs (smart money)
 * ont placé leurs stops ou leurs ordres en attente.
 * 
 * Types de liquidité:
 * - Equal Highs (EH): Plusieurs highs au même niveau
 * - Equal Lows (EL): Plusieurs lows au même niveau
 * - Trendline Liquidity: Liquidité sur les lignes de tendance
 * 
 * Liquidity Sweep:
 * - Le prix vient chercher la liquidité (prend les stops)
 * - Puis rebrousse chemin rapidement
 * - Signe d'une manipulation du marché
 */

const logger = require('../../config/logger');

/**
 * Détecte les zones de liquidité (Equal Highs et Equal Lows)
 * @param {Array} candles - Tableau de bougies
 * @param {Object} options - Options de détection
 * @returns {Object} Zones de liquidité détectées
 */
const detectLiquidityZones = (candles, options = {}) => {
  const { tolerancePercent = 0.1, lookback = 50 } = options;
  
  const equalHighs = [];
  const equalLows = [];
  
  const startIdx = Math.max(0, candles.length - lookback);
  
  // Détection des Equal Highs
  for (let i = startIdx; i < candles.length; i++) {
    const currentHigh = candles[i].high;
    const tolerance = currentHigh * (tolerancePercent / 100);
    
    const matches = [];
    for (let j = startIdx; j < candles.length; j++) {
      if (i !== j && Math.abs(candles[j].high - currentHigh) <= tolerance) {
        matches.push({
          index: j,
          price: candles[j].high,
        });
      }
    }
    
    if (matches.length >= 1) {
      const zone = {
        price: currentHigh,
        tolerance,
        touches: [i, ...matches.map((m) => m.index)].sort((a, b) => a - b),
        strength: matches.length + 1,
      };
      
      // Évite les doublons
      const alreadyExists = equalHighs.some(
        (eh) => Math.abs(eh.price - zone.price) <= tolerance
      );
      
      if (!alreadyExists) {
        equalHighs.push(zone);
      }
    }
  }
  
  // Détection des Equal Lows
  for (let i = startIdx; i < candles.length; i++) {
    const currentLow = candles[i].low;
    const tolerance = currentLow * (tolerancePercent / 100);
    
    const matches = [];
    for (let j = startIdx; j < candles.length; j++) {
      if (i !== j && Math.abs(candles[j].low - currentLow) <= tolerance) {
        matches.push({
          index: j,
          price: candles[j].low,
        });
      }
    }
    
    if (matches.length >= 1) {
      const zone = {
        price: currentLow,
        tolerance,
        touches: [i, ...matches.map((m) => m.index)].sort((a, b) => a - b),
        strength: matches.length + 1,
      };
      
      // Évite les doublons
      const alreadyExists = equalLows.some(
        (el) => Math.abs(el.price - zone.price) <= tolerance
      );
      
      if (!alreadyExists) {
        equalLows.push(zone);
      }
    }
  }
  
  // Trier par force décroissante
  equalHighs.sort((a, b) => b.strength - a.strength);
  equalLows.sort((a, b) => b.strength - a.strength);
  
  return { equalHighs, equalLows };
};

/**
 * Détecte les Liquidity Sweeps
 * @param {Array} candles - Tableau de bougies
 * @param {Object} options - Options de détection
 * @returns {Array} Sweeps détectés
 */
const detectLiquiditySweeps = (candles, options = {}) => {
  const { sweepConfirmation = 2, minReversalPercent = 0.05 } = options;
  const sweeps = [];
  
  if (candles.length < 10) return sweeps;
  
  const { equalHighs, equalLows } = detectLiquidityZones(candles, options);
  
  // Vérification des sweeps sur les Equal Highs (sweeps baissiers)
  for (const zone of equalHighs) {
    // Recherche d'un sweep après la dernière touche
    const lastTouch = Math.max(...zone.touches);
    
    for (let i = lastTouch + 1; i < candles.length; i++) {
      const candle = candles[i];
      
      // Le prix dépasse la zone de liquidité
      if (candle.high > zone.price + zone.tolerance) {
        // Vérification du rejet (clôture sous la zone)
        if (candle.close < zone.price) {
          const reversal = ((candle.high - candle.close) / candle.high) * 100;
          
          if (reversal >= minReversalPercent) {
            sweeps.push({
              type: 'bearish',
              sweepType: 'EQUAL_HIGH_SWEEP',
              zone,
              sweepIndex: i,
              sweepPrice: candle.high,
              closePrice: candle.close,
              reversal: parseFloat(reversal.toFixed(2)),
              strength: calculateSweepStrength(candles, i, zone, 'bearish'),
              confirmed: confirmSweep(candles, i, 'bearish', sweepConfirmation),
            });
          }
        }
        break;
      }
    }
  }
  
  // Vérification des sweeps sur les Equal Lows (sweeps haussiers)
  for (const zone of equalLows) {
    // Recherche d'un sweep après la dernière touche
    const lastTouch = Math.max(...zone.touches);
    
    for (let i = lastTouch + 1; i < candles.length; i++) {
      const candle = candles[i];
      
      // Le prix descend sous la zone de liquidité
      if (candle.low < zone.price - zone.tolerance) {
        // Vérification du rejet (clôture au-dessus de la zone)
        if (candle.close > zone.price) {
          const reversal = ((candle.close - candle.low) / candle.low) * 100;
          
          if (reversal >= minReversalPercent) {
            sweeps.push({
              type: 'bullish',
              sweepType: 'EQUAL_LOW_SWEEP',
              zone,
              sweepIndex: i,
              sweepPrice: candle.low,
              closePrice: candle.close,
              reversal: parseFloat(reversal.toFixed(2)),
              strength: calculateSweepStrength(candles, i, zone, 'bullish'),
              confirmed: confirmSweep(candles, i, 'bullish', sweepConfirmation),
            });
          }
        }
        break;
      }
    }
  }
  
  logger.debug(`Liquidity Sweeps détectés: ${sweeps.length}`);
  return sweeps.sort((a, b) => b.strength - a.strength);
};

/**
 * Calcule la force d'un sweep
 * @param {Array} candles - Tableau de bougies
 * @param {number} sweepIndex - Index du sweep
 * @param {Object} zone - Zone de liquidité
 * @param {string} type - Type de sweep
 * @returns {number} Force du sweep (0-100)
 */
const calculateSweepStrength = (candles, sweepIndex, zone, type) => {
  let strength = 50;
  const sweepCandle = candles[sweepIndex];
  
  // Force basée sur le nombre de touches de la zone
  strength += zone.strength * 5;
  
  // Force basée sur la mèche
  let wickRatio;
  if (type === 'bullish') {
    wickRatio = (sweepCandle.close - sweepCandle.low) / (sweepCandle.high - sweepCandle.low);
  } else {
    wickRatio = (sweepCandle.high - sweepCandle.close) / (sweepCandle.high - sweepCandle.low);
  }
  strength += wickRatio * 20;
  
  // Force basée sur le volume (si disponible)
  if (sweepCandle.volume) {
    const avgVolume = calculateAverageVolume(candles, sweepIndex - 10, sweepIndex);
    if (sweepCandle.volume > avgVolume * 2) strength += 15;
    else if (sweepCandle.volume > avgVolume) strength += 5;
  }
  
  return Math.min(100, strength);
};

/**
 * Confirme un sweep avec les bougies suivantes
 * @param {Array} candles - Tableau de bougies
 * @param {number} sweepIndex - Index du sweep
 * @param {string} type - Type de sweep
 * @param {number} confirmationBars - Nombre de bougies de confirmation
 * @returns {boolean} Confirmation
 */
const confirmSweep = (candles, sweepIndex, type, confirmationBars) => {
  const endIdx = Math.min(sweepIndex + confirmationBars, candles.length - 1);
  let confirmations = 0;
  
  for (let i = sweepIndex + 1; i <= endIdx; i++) {
    if (type === 'bullish') {
      if (candles[i].close > candles[sweepIndex].close) confirmations++;
      if (candles[i].close > candles[i].open) confirmations++;
    } else {
      if (candles[i].close < candles[sweepIndex].close) confirmations++;
      if (candles[i].close < candles[i].open) confirmations++;
    }
  }
  
  return confirmations >= confirmationBars;
};

/**
 * Calcule le volume moyen
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
 * Génère un signal de trading basé sur les Liquidity Sweeps
 * @param {Array} candles - Tableau de bougies
 * @param {Object} options - Options
 * @returns {Object|null} Signal de trading ou null
 */
const generateLiquiditySignal = (candles, options = {}) => {
  const sweeps = detectLiquiditySweeps(candles, options);
  
  if (sweeps.length === 0) return null;
  
  // Prend le sweep le plus fort et confirmé
  const validSweep = sweeps
    .filter((s) => s.confirmed)
    .sort((a, b) => b.strength - a.strength)[0];
  
  if (!validSweep || validSweep.strength < 60) return null;
  
  const lastCandle = candles[candles.length - 1];
  
  return {
    type: validSweep.type === 'bullish' ? 'BUY' : 'SELL',
    strategy: 'LIQUIDITY_SWEEP',
    entry: lastCandle.close,
    stopLoss: validSweep.type === 'bullish'
      ? validSweep.sweepPrice * 0.998
      : validSweep.sweepPrice * 1.002,
    takeProfit: validSweep.type === 'bullish'
      ? lastCandle.close + (lastCandle.close - validSweep.sweepPrice) * 2
      : lastCandle.close - (validSweep.sweepPrice - lastCandle.close) * 2,
    confidence: validSweep.strength,
    sweep: validSweep,
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  detectLiquidityZones,
  detectLiquiditySweeps,
  calculateSweepStrength,
  confirmSweep,
  generateLiquiditySignal,
};