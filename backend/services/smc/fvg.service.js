/**
 * Service de détection des Fair Value Gaps (FVG)
 * ==============================================
 * 
 * Un FVG (Fair Value Gap) est un déséquilibre de prix qui se forme
 * lorsque le prix saute d'une bougie à une autre sans retester la zone intermédiaire.
 * 
 * Structure d'un FVG haussier:
 * - Bougie 1: High à un certain niveau
 * - Bougie 2: Low supérieur au High de la bougie 1
 * - Gap entre le High de la bougie 1 et le Low de la bougie 2
 * 
 * Structure d'un FVG baissier:
 * - Bougie 1: Low à un certain niveau
 * - Bougie 2: High inférieur au Low de la bougie 1
 * - Gap entre le Low de la bougie 1 et le High de la bougie 2
 */

const logger = require('../../config/logger');

/**
 * Détecte les FVG dans une série de bougies
 * @param {Array} candles - Tableau de bougies {open, high, low, close}
 * @param {Object} options - Options de détection
 * @returns {Array} Liste des FVG détectés
 */
const detectFVG = (candles, options = {}) => {
  const { minGapPercent = 0.01, maxAge = 20 } = options;
  const fvgs = [];

  if (candles.length < 3) {
    return fvgs;
  }

  for (let i = 2; i < candles.length; i++) {
    const candle1 = candles[i - 2]; // Première bougie
    const candle2 = candles[i - 1]; // Bougie du milieu
    const candle3 = candles[i];     // Dernière bougie

    // Calcul du range moyen pour normalisation
    const avgRange = (candle1.high - candle1.low + candle2.high - candle2.low + candle3.high - candle3.low) / 3;
    
    // Détection FVG haussier (Bullish FVG)
    // Le Low de la bougie 3 doit être supérieur au High de la bougie 1
    const bullishGap = candle3.low - candle1.high;
    const bullishGapPercent = (bullishGap / avgRange) * 100;

    if (bullishGap > 0 && bullishGapPercent >= minGapPercent) {
      // Vérification que la bougie du milieu confirme la direction
      const isValidBullish = candle2.close > candle2.open; // Bougie haussière

      fvgs.push({
        type: 'bullish',
        startIndex: i - 2,
        endIndex: i,
        top: candle3.low,
        bottom: candle1.high,
        middle: (candle3.low + candle1.high) / 2,
        height: bullishGap,
        heightPercent: bullishGapPercent,
        timestamp: candle3.date || i,
        isValid: isValidBullish,
        status: 'active',
        retested: false,
        rejected: false,
      });
    }

    // Détection FVG baissier (Bearish FVG)
    // Le High de la bougie 3 doit être inférieur au Low de la bougie 1
    const bearishGap = candle1.low - candle3.high;
    const bearishGapPercent = (bearishGap / avgRange) * 100;

    if (bearishGap > 0 && bearishGapPercent >= minGapPercent) {
      // Vérification que la bougie du milieu confirme la direction
      const isValidBearish = candle2.close < candle2.open; // Bougie baissière

      fvgs.push({
        type: 'bearish',
        startIndex: i - 2,
        endIndex: i,
        top: candle1.low,
        bottom: candle3.high,
        middle: (candle1.low + candle3.high) / 2,
        height: bearishGap,
        heightPercent: bearishGapPercent,
        timestamp: candle3.date || i,
        isValid: isValidBearish,
        status: 'active',
        retested: false,
        rejected: false,
      });
    }
  }

  // Vérification des retests et rejets
  const verifiedFvgs = verifyFVGStatus(fvgs, candles, maxAge);

  logger.debug(`FVG détectés: ${verifiedFvgs.length}`);
  return verifiedFvgs;
};

/**
 * Vérifie le statut des FVG (retest, rejet, mitigé)
 * @param {Array} fvgs - Liste des FVG
 * @param {Array} candles - Tableau de bougies
 * @param {number} maxAge - Âge maximum pour considérer un FVG
 * @returns {Array} FVG avec statut mis à jour
 */
const verifyFVGStatus = (fvgs, candles, maxAge) => {
  return fvgs.map((fvg) => {
    const startIdx = fvg.endIndex;
    const endIdx = Math.min(startIdx + maxAge, candles.length - 1);

    for (let i = startIdx; i <= endIdx; i++) {
      const candle = candles[i];

      // Vérification du retest
      if (!fvg.retested) {
        if (fvg.type === 'bullish') {
          // Retest haussier: le prix revient dans le FVG
          if (candle.low <= fvg.top && candle.low >= fvg.bottom) {
            fvg.retested = true;
            fvg.retestIndex = i;
            fvg.retestPrice = candle.low;
          }
        } else {
          // Retest baissier: le prix revient dans le FVG
          if (candle.high >= fvg.bottom && candle.high <= fvg.top) {
            fvg.retested = true;
            fvg.retestIndex = i;
            fvg.retestPrice = candle.high;
          }
        }
      }

      // Vérification du rejet (rejection)
      if (fvg.retested && !fvg.rejected) {
        if (fvg.type === 'bullish') {
          // Rejet haussier: mèche basse dans le FVG puis cloture au-dessus
          if (candle.low <= fvg.top && candle.close > fvg.top) {
            fvg.rejected = true;
            fvg.rejectIndex = i;
            fvg.rejectPrice = candle.close;
            fvg.status = 'rejected';
            break;
          }
        } else {
          // Rejet baissier: mèche haute dans le FVG puis cloture en-dessous
          if (candle.high >= fvg.bottom && candle.close < fvg.bottom) {
            fvg.rejected = true;
            fvg.rejectIndex = i;
            fvg.rejectPrice = candle.close;
            fvg.status = 'rejected';
            break;
          }
        }
      }

      // Vérification si le FVG est mitigé (prix traverse complètement)
      if (fvg.type === 'bullish' && candle.close < fvg.bottom) {
        fvg.status = 'mitigated';
        fvg.mitigatedIndex = i;
        break;
      } else if (fvg.type === 'bearish' && candle.close > fvg.top) {
        fvg.status = 'mitigated';
        fvg.mitigatedIndex = i;
        break;
      }

      // Vérification si le FVG est devenu invalide (trop vieux)
      if (i === endIdx && fvg.status === 'active') {
        fvg.status = 'expired';
      }
    }

    return fvg;
  });
};

/**
 * Détecte les FVG qui ont été retestés et sont des opportunités de trading
 * @param {Array} candles - Tableau de bougies
 * @param {Object} options - Options de détection
 * @returns {Array} FVG retestés valides
 */
const detectRetestedFVG = (candles, options = {}) => {
  const allFvgs = detectFVG(candles, options);
  
  return allFvgs.filter((fvg) => {
    // On cherche les FVG qui viennent d'être retestés mais pas encore rejetés
    return fvg.retested && !fvg.rejected && fvg.status === 'active';
  });
};

/**
 * Détecte les FVG qui ont été rejetés (signaux de trading)
 * @param {Array} candles - Tableau de bougies
 * @param {Object} options - Options de détection
 * @returns {Array} FVG rejetés
 */
const detectRejectedFVG = (candles, options = {}) => {
  const allFvgs = detectFVG(candles, options);
  
  return allFvgs.filter((fvg) => fvg.rejected);
};

/**
 * Calcule la qualité d'un FVG (score de 0 à 100)
 * @param {Object} fvg - FVG à évaluer
 * @param {Array} candles - Contexte des bougies
 * @returns {number} Score de qualité
 */
const calculateFVGQuality = (fvg, candles) => {
  let score = 50; // Score de base

  // Bonus pour la taille du gap
  if (fvg.heightPercent > 50) score += 15;
  else if (fvg.heightPercent > 30) score += 10;
  else if (fvg.heightPercent > 15) score += 5;

  // Bonus pour la validité directionnelle
  if (fvg.isValid) score += 15;

  // Bonus pour le retest rapide
  if (fvg.retested) {
    const retestSpeed = fvg.retestIndex - fvg.endIndex;
    if (retestSpeed <= 3) score += 20;
    else if (retestSpeed <= 5) score += 15;
    else if (retestSpeed <= 10) score += 10;
    else score += 5;
  }

  // Bonus pour le rejet
  if (fvg.rejected) score += 10;

  // Malus si expiré ou mitigé
  if (fvg.status === 'expired') score -= 20;
  if (fvg.status === 'mitigated') score -= 30;

  return Math.min(100, Math.max(0, score));
};

/**
 * Génère un signal de trading basé sur les FVG
 * @param {Array} candles - Tableau de bougies
 * @param {Object} options - Options
 * @returns {Object|null} Signal de trading ou null
 */
const generateFVGSignal = (candles, options = {}) => {
  const rejectedFvgs = detectRejectedFVG(candles, options);
  const retestedFvgs = detectRetestedFVG(candles, options);

  // Priorité aux FVG rejetés
  if (rejectedFvgs.length > 0) {
    const bestFvg = rejectedFvgs
      .map((fvg) => ({ ...fvg, quality: calculateFVGQuality(fvg, candles) }))
      .sort((a, b) => b.quality - a.quality)[0];

    if (bestFvg.quality >= 60) {
      return {
        type: bestFvg.type === 'bullish' ? 'BUY' : 'SELL',
        strategy: 'FVG_REJECTION',
        entry: bestFvg.rejectPrice,
        stopLoss: bestFvg.type === 'bullish' 
          ? bestFvg.bottom - (bestFvg.top - bestFvg.bottom) * 0.5
          : bestFvg.top + (bestFvg.top - bestFvg.bottom) * 0.5,
        takeProfit: bestFvg.type === 'bullish'
          ? bestFvg.rejectPrice + (bestFvg.rejectPrice - bestFvg.bottom) * 2
          : bestFvg.rejectPrice - (bestFvg.top - bestFvg.rejectPrice) * 2,
        confidence: bestFvg.quality,
        fvg: bestFvg,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Ensuite les FVG retestés
  if (retestedFvgs.length > 0) {
    const bestFvg = retestedFvgs
      .map((fvg) => ({ ...fvg, quality: calculateFVGQuality(fvg, candles) }))
      .sort((a, b) => b.quality - a.quality)[0];

    if (bestFvg.quality >= 70) {
      return {
        type: bestFvg.type === 'bullish' ? 'BUY' : 'SELL',
        strategy: 'FVG_RETEST',
        entry: bestFvg.retestPrice,
        stopLoss: bestFvg.type === 'bullish'
          ? bestFvg.bottom
          : bestFvg.top,
        takeProfit: bestFvg.type === 'bullish'
          ? bestFvg.retestPrice + (bestFvg.retestPrice - bestFvg.bottom) * 1.5
          : bestFvg.retestPrice - (bestFvg.top - bestFvg.retestPrice) * 1.5,
        confidence: bestFvg.quality,
        fvg: bestFvg,
        timestamp: new Date().toISOString(),
      };
    }
  }

  return null;
};

module.exports = {
  detectFVG,
  detectRetestedFVG,
  detectRejectedFVG,
  calculateFVGQuality,
  generateFVGSignal,
  verifyFVGStatus,
};