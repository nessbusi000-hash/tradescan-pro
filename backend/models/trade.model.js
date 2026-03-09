/**
 * Modèle Trade
 * ============
 * Gère les trades et positions des utilisateurs
 */

const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

class Trade {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.symbol = data.symbol;
    this.type = data.type; // 'buy' ou 'sell'
    this.order_type = data.order_type; // 'market', 'limit', 'stop'
    this.volume = data.volume;
    this.entry_price = data.entry_price;
    this.exit_price = data.exit_price;
    this.stop_loss = data.stop_loss;
    this.take_profit = data.take_profit;
    this.status = data.status; // 'open', 'closed', 'cancelled', 'pending'
    this.pnl = data.pnl;
    this.pnl_percent = data.pnl_percent;
    this.commission = data.commission;
    this.swap = data.swap;
    this.strategy = data.strategy;
    this.timeframe = data.timeframe;
    this.notes = data.notes;
    this.opened_at = data.opened_at;
    this.closed_at = data.closed_at;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Crée un nouveau trade
   * @param {Object} tradeData - Données du trade
   * @returns {Promise<Trade>} Trade créé
   */
  static async create(tradeData) {
    const {
      user_id,
      symbol,
      type,
      order_type = 'market',
      volume,
      entry_price,
      stop_loss,
      take_profit,
      strategy,
      timeframe,
      notes,
    } = tradeData;

    const id = uuidv4();
    const sql = `
      INSERT INTO trades (
        id, user_id, symbol, type, order_type, volume, entry_price, 
        stop_loss, take_profit, status, strategy, timeframe, notes, 
        opened_at, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), NOW())
      RETURNING *
    `;

    const values = [
      id,
      user_id,
      symbol.toUpperCase(),
      type,
      order_type,
      volume,
      entry_price,
      stop_loss,
      take_profit,
      'open',
      strategy,
      timeframe,
      notes,
    ];

    const result = await query(sql, values);
    logger.info(`Trade créé: ${id} - ${symbol} ${type}`);
    return new Trade(result.rows[0]);
  }

  /**
   * Trouve un trade par ID
   * @param {string} id - ID du trade
   * @returns {Promise<Trade|null>} Trade trouvé ou null
   */
  static async findById(id) {
    const sql = 'SELECT * FROM trades WHERE id = $1';
    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return new Trade(result.rows[0]);
  }

  /**
   * Trouve tous les trades d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options de filtrage
   * @returns {Promise<Object>} Liste des trades et métadonnées
   */
  static async findByUserId(userId, options = {}) {
    const { status, symbol, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE user_id = $1';
    const values = [userId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    if (symbol) {
      whereClause += ` AND symbol = $${paramIndex}`;
      values.push(symbol.toUpperCase());
      paramIndex++;
    }

    const countSql = `SELECT COUNT(*) FROM trades ${whereClause}`;
    const countResult = await query(countSql, values);
    const total = parseInt(countResult.rows[0].count);

    const sql = `
      SELECT * FROM trades 
      ${whereClause}
      ORDER BY opened_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);
    const result = await query(sql, values);

    return {
      trades: result.rows.map((row) => new Trade(row)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Ferme un trade
   * @param {string} id - ID du trade
   * @param {Object} closeData - Données de clôture
   * @returns {Promise<Trade>} Trade mis à jour
   */
  static async close(id, closeData) {
    const { exit_price, commission = 0, swap = 0 } = closeData;

    const trade = await this.findById(id);
    if (!trade) {
      throw new Error('Trade non trouvé');
    }

    if (trade.status !== 'open') {
      throw new Error('Ce trade est déjà fermé');
    }

    // Calcul du P&L
    const pipValue = 0.0001; // Simplifié, devrait varier selon la paire
    const priceDiff =
      trade.type === 'buy'
        ? exit_price - trade.entry_price
        : trade.entry_price - exit_price;
    const pnl = priceDiff * trade.volume * 100000 - commission - swap;
    const pnl_percent = (pnl / (trade.entry_price * trade.volume * 100000)) * 100;

    const sql = `
      UPDATE trades 
      SET exit_price = $1, 
          pnl = $2, 
          pnl_percent = $3, 
          commission = $4, 
          swap = $5, 
          status = 'closed', 
          closed_at = NOW(),
          updated_at = NOW()
      WHERE id = $6 
      RETURNING *
    `;

    const result = await query(sql, [
      exit_price,
      pnl,
      pnl_percent,
      commission,
      swap,
      id,
    ]);

    logger.info(`Trade fermé: ${id} - P&L: ${pnl}`);
    return new Trade(result.rows[0]);
  }

  /**
   * Met à jour un trade
   * @param {string} id - ID du trade
   * @param {Object} updates - Données à mettre à jour
   * @returns {Promise<Trade>} Trade mis à jour
   */
  static async update(id, updates) {
    const allowedFields = [
      'stop_loss',
      'take_profit',
      'notes',
      'strategy',
      'timeframe',
    ];
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClause.length === 0) {
      throw new Error('Aucun champ valide à mettre à jour');
    }

    setClause.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `
      UPDATE trades 
      SET ${setClause.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      throw new Error('Trade non trouvé');
    }

    return new Trade(result.rows[0]);
  }

  /**
   * Supprime un trade
   * @param {string} id - ID du trade
   * @returns {Promise<boolean>} Succès de l'opération
   */
  static async delete(id) {
    const sql = 'DELETE FROM trades WHERE id = $1 RETURNING id';
    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      throw new Error('Trade non trouvé');
    }

    logger.info(`Trade supprimé: ${id}`);
    return true;
  }

  /**
   * Récupère les statistiques de trading d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Statistiques
   */
  static async getStats(userId) {
    const sql = `
      SELECT 
        COUNT(*) as total_trades,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_trades,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_trades,
        COUNT(CASE WHEN pnl > 0 THEN 1 END) as winning_trades,
        COUNT(CASE WHEN pnl < 0 THEN 1 END) as losing_trades,
        COALESCE(SUM(pnl), 0) as total_pnl,
        COALESCE(AVG(pnl), 0) as avg_pnl,
        COALESCE(MAX(pnl), 0) as best_trade,
        COALESCE(MIN(pnl), 0) as worst_trade,
        COALESCE(
          (COUNT(CASE WHEN pnl > 0 THEN 1 END) * 100.0 / NULLIF(COUNT(CASE WHEN status = 'closed' THEN 1 END), 0)), 
          0
        ) as win_rate
      FROM trades 
      WHERE user_id = $1
    `;

    const result = await query(sql, [userId]);
    return result.rows[0];
  }

  /**
   * Récupère les trades ouverts d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array<Trade>>} Liste des trades ouverts
   */
  static async getOpenTrades(userId) {
    const result = await this.findByUserId(userId, { status: 'open', limit: 100 });
    return result.trades;
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      symbol: this.symbol,
      type: this.type,
      order_type: this.order_type,
      volume: this.volume,
      entry_price: this.entry_price,
      exit_price: this.exit_price,
      stop_loss: this.stop_loss,
      take_profit: this.take_profit,
      status: this.status,
      pnl: this.pnl,
      pnl_percent: this.pnl_percent,
      commission: this.commission,
      swap: this.swap,
      strategy: this.strategy,
      timeframe: this.timeframe,
      notes: this.notes,
      opened_at: this.opened_at,
      closed_at: this.closed_at,
      created_at: this.created_at,
    };
  }
}

module.exports = Trade;