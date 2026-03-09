/**
 * Configuration de la base de données PostgreSQL
 * ===============================================
 */

const { Pool } = require('pg');
const logger = require('./logger');

// Configuration du pool de connexions
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'tradescan',
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || '774322'),

  // Configuration du pool
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,

  // SSL en production
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
};

const pool = new Pool(poolConfig);

// Gestion des événements du pool
pool.on('connect', (client) => {
  logger.debug('Nouveau client connecté à la base de données');
});

pool.on('error', (err, client) => {
  logger.error('Erreur inattendue sur le client PostgreSQL', err);
});

/**
 * Exécute une requête SQL
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Requête exécutée', {
      query: text.substring(0, 100),
      duration: `${duration}ms`,
      rows: result.rowCount,
    });
    return result;
  } catch (error) {
    logger.error('Erreur requête SQL', {
      query: text.substring(0, 100),
      error: error.message,
    });
    throw error;
  }
};

/**
 * Récupère un client du pool pour les transactions
 */
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);

  client.query = async (text, params) => {
    const start = Date.now();
    try {
      const result = await query(text, params);
      const duration = Date.now() - start;
      logger.debug('Requête transaction exécutée', {
        query: text.substring(0, 100),
        duration: `${duration}ms`,
      });
      return result;
    } catch (error) {
      logger.error('Erreur requête transaction', {
        query: text.substring(0, 100),
        error: error.message,
      });
      throw error;
    }
  };

  return client;
};

/**
 * Vérifie la connexion à la base de données
 */
const checkConnection = async () => {
  try {
    const result = await query('SELECT NOW() as current_time');
    logger.info('✅ Connexion à PostgreSQL établie', {
      time: result.rows[0].current_time,
    });
    return true;
  } catch (error) {
    logger.error('❌ Impossible de se connecter à PostgreSQL', error);
    return false;
  }
};

/**
 * Ferme proprement le pool de connexions
 */
const closePool = async () => {
  await pool.end();
  logger.info('Pool de connexions PostgreSQL fermé');
};

module.exports = {
  pool,
  query,
  getClient,
  checkConnection,
  closePool,
};