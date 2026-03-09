/**
 * Contrôleur des Trades
 * =====================
 */

const { validationResult } = require('express-validator');
const Trade = require('../models/trade.model');
const { asyncHandler, ValidationError, NotFoundError, ForbiddenError } = require('../middlewares/error.middleware');

/**
 * Récupère tous les trades de l'utilisateur connecté
 * GET /api/trades
 */
const getAllTrades = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status, symbol, page = 1, limit = 20 } = req.query;

  const result = await Trade.findByUserId(userId, {
    status,
    symbol,
    page: parseInt(page),
    limit: parseInt(limit),
  });

  res.status(200).json({
    success: true,
    data: {
      trades: result.trades.map((t) => t.toJSON()),
      pagination: result.pagination,
    },
  });
});

/**
 * Récupère un trade par ID
 * GET /api/trades/:id
 */
const getTradeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const trade = await Trade.findById(id);

  if (!trade) throw new NotFoundError('Trade non trouvé');
  if (trade.user_id !== userId) throw new ForbiddenError('Accès interdit');

  res.status(200).json({ success: true, data: trade.toJSON() });
});

/**
 * Crée un nouveau trade
 * POST /api/trades
 */
const createTrade = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ValidationError('Données invalides', errors.array());

  const userId = req.user.id;
  const { symbol, type, order_type, volume, entry_price, stop_loss, take_profit, strategy, timeframe, notes } = req.body;

  const trade = await Trade.create({
    user_id: userId,
    symbol,
    type,
    order_type,
    volume,
    entry_price,
    stop_loss,
    take_profit,
    strategy,
    timeframe,
    notes,
  });

  res.status(201).json({
    success: true,
    message: 'Trade ouvert',
    data: trade.toJSON(),
  });
});

/**
 * Ferme un trade
 * PATCH /api/trades/:id/close
 */
const closeTrade = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { exit_price, commission, swap } = req.body;

  if (!exit_price) throw new ValidationError('Prix de sortie requis');

  const trade = await Trade.findById(id);
  if (!trade) throw new NotFoundError('Trade non trouvé');
  if (trade.user_id !== userId) throw new ForbiddenError('Accès interdit');

  const closed = await Trade.close(id, { exit_price, commission, swap });

  res.status(200).json({
    success: true,
    message: 'Trade fermé',
    data: closed.toJSON(),
  });
});

/**
 * Met à jour un trade (SL/TP/notes)
 * PUT /api/trades/:id
 */
const updateTrade = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const trade = await Trade.findById(id);
  if (!trade) throw new NotFoundError('Trade non trouvé');
  if (trade.user_id !== userId) throw new ForbiddenError('Accès interdit');

  const updated = await Trade.update(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Trade mis à jour',
    data: updated.toJSON(),
  });
});

/**
 * Supprime un trade
 * DELETE /api/trades/:id
 */
const deleteTrade = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const trade = await Trade.findById(id);
  if (!trade) throw new NotFoundError('Trade non trouvé');
  if (trade.user_id !== userId) throw new ForbiddenError('Accès interdit');

  await Trade.delete(id);

  res.status(200).json({ success: true, message: 'Trade supprimé' });
});

/**
 * Récupère les statistiques de trading
 * GET /api/trades/stats
 */
const getStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const stats = await Trade.getStats(userId);

  res.status(200).json({ success: true, data: stats });
});

module.exports = {
  getAllTrades,
  getTradeById,
  createTrade,
  closeTrade,
  updateTrade,
  deleteTrade,
  getStats,
};
