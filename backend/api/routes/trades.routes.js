/**
 * Routes des Trades
 * =================
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getAllTrades, getTradeById, createTrade,
  closeTrade, updateTrade, deleteTrade, getStats,
} = require('../../controllers/trades.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Validation rules for creating a trade
const createValidation = [
  body('symbol').notEmpty().isString().trim().toUpperCase(),
  body('type').isIn(['buy', 'sell']),
  body('volume').isFloat({ min: 0.01 }),
  body('entry_price').isFloat({ min: 0 }),
  body('stop_loss').optional().isFloat({ min: 0 }),
  body('take_profit').optional().isFloat({ min: 0 }),
  body('order_type').optional().isIn(['market', 'limit', 'stop']),
  body('strategy').optional().isString().trim(),
  body('timeframe').optional().isString().trim(),
  body('notes').optional().isString().trim().isLength({ max: 1000 }),
];

router.get('/stats', getStats);
router.get('/', getAllTrades);
router.get('/:id', getTradeById);
router.post('/', createValidation, createTrade);
router.patch('/:id/close', closeTrade);
router.put('/:id', updateTrade);
router.delete('/:id', deleteTrade);

module.exports = router;
