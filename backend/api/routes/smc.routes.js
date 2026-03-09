/**
 * Routes SMC (Smart Money Concepts)
 * =================================
 */

const express = require('express');
const { body } = require('express-validator');
const smcController = require('../../controllers/smc.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

// Validation commune
const smcAnalysisValidation = [
  body('symbol')
    .isString()
    .isLength({ min: 3, max: 10 })
    .withMessage('Symbole invalide'),
  body('interval')
    .optional()
    .isIn(['1min', '5min', '15min', '30min', '60min', 'daily', 'weekly', 'monthly'])
    .withMessage('Intervalle invalide'),
  body('options')
    .optional()
    .isObject(),
];

// Routes protégées (nécessitent authentification)
router.post('/analyze', authenticate, smcAnalysisValidation, smcController.analyzeSMC);
router.post('/fvg', authenticate, smcAnalysisValidation, smcController.detectFVG);
router.post('/bos', authenticate, smcAnalysisValidation, smcController.detectBOS);
router.post('/choch', authenticate, smcAnalysisValidation, smcController.detectCHoCH);
router.post('/liquidity', authenticate, smcAnalysisValidation, smcController.detectLiquidity);
router.post('/trend', authenticate, smcAnalysisValidation, smcController.analyzeTrend);
router.post('/signal', authenticate, smcAnalysisValidation, smcController.getCurrentSignal);

module.exports = router;