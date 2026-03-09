/**
 * Service de données marché
 * =========================
 * Gère la connexion à Alpha Vantage et le caching des données
 */

const axios = require('axios');
const logger = require('../config/logger');
const { ALPHA_VANTAGE_CONFIG, getAlphaVantageSymbol } = require('../config/api');

// Cache simple en mémoire
const cache = new Map();
const CACHE_DURATION = 60 * 1000; // 1 minute

/**
 * Récupère les données de cache ou null si expiré
 * @param {string} key - Clé de cache
 * @returns {any|null} Données en cache ou null
 */
const getFromCache = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
};

/**
 * Stocke des données en cache
 * @param {string} key - Clé de cache
 * @param {any} data - Données à stocker
 */
const setCache = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

/**
 * Récupère les données de marché pour un symbole
 * @param {string} symbol - Symbole de trading
 * @returns {Promise<Object>} Données de marché
 */
const getMarketData = async (symbol) => {
  const cacheKey = `market_${symbol}`;
  const cached = getFromCache(cacheKey);
  
  if (cached) {
    logger.debug(`Cache hit pour ${symbol}`);
    return cached;
  }

  try {
    const avSymbol = getAlphaVantageSymbol(symbol);
    
    const response = await axios.get(ALPHA_VANTAGE_CONFIG.baseUrl, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: avSymbol,
        apikey: ALPHA_VANTAGE_CONFIG.apiKey,
      },
      timeout: 10000,
    });

    const quote = response.data['Global Quote'];
    
    if (!quote || Object.keys(quote).length === 0) {
      throw new Error('Données non disponibles pour ce symbole');
    }

    const data = {
      symbol: symbol.toUpperCase(),
      price: parseFloat(quote['05. price']) || 0,
      change: parseFloat(quote['09. change']) || 0,
      changePercent: parseFloat(quote['10. change percent']?.replace('%', '')) || 0,
      volume: parseInt(quote['06. volume']) || 0,
      high: parseFloat(quote['03. high']) || 0,
      low: parseFloat(quote['04. low']) || 0,
      open: parseFloat(quote['02. open']) || 0,
      previousClose: parseFloat(quote['08. previous close']) || 0,
      lastUpdated: quote['07. latest trading day'],
    };

    setCache(cacheKey, data);
    return data;
  } catch (error) {
    logger.error('Erreur récupération données marché', {
      symbol,
      error: error.message,
    });
    
    // Retourne des données mockées en cas d'erreur (mode démo)
    return getMockMarketData(symbol);
  }
};

/**
 * Récupère les données historiques (candles)
 * @param {string} symbol - Symbole de trading
 * @param {string} interval - Intervalle (1min, 5min, 15min, 30min, 60min, daily, weekly, monthly)
 * @returns {Promise<Array>} Données historiques
 */
const getHistoricalData = async (symbol, interval = 'daily') => {
  const cacheKey = `historical_${symbol}_${interval}`;
  const cached = getFromCache(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const avSymbol = getAlphaVantageSymbol(symbol);
    
    let function_name;
    switch (interval) {
      case '1min':
      case '5min':
      case '15min':
      case '30min':
      case '60min':
        function_name = 'TIME_SERIES_INTRADAY';
        break;
      case 'weekly':
        function_name = 'TIME_SERIES_WEEKLY';
        break;
      case 'monthly':
        function_name = 'TIME_SERIES_MONTHLY';
        break;
      default:
        function_name = 'TIME_SERIES_DAILY';
    }

    const params = {
      function: function_name,
      symbol: avSymbol,
      apikey: ALPHA_VANTAGE_CONFIG.apiKey,
    };

    if (function_name === 'TIME_SERIES_INTRADAY') {
      params.interval = interval;
    }

    const response = await axios.get(ALPHA_VANTAGE_CONFIG.baseUrl, {
      params,
      timeout: 15000,
    });

    // Extraction des données selon la fonction
    let timeSeriesKey;
    if (function_name === 'TIME_SERIES_INTRADAY') {
      timeSeriesKey = `Time Series (${interval})`;
    } else if (function_name === 'TIME_SERIES_WEEKLY') {
      timeSeriesKey = 'Weekly Time Series';
    } else if (function_name === 'TIME_SERIES_MONTHLY') {
      timeSeriesKey = 'Monthly Time Series';
    } else {
      timeSeriesKey = 'Time Series (Daily)';
    }

    const timeSeries = response.data[timeSeriesKey];
    
    if (!timeSeries) {
      throw new Error('Données historiques non disponibles');
    }

    const candles = Object.entries(timeSeries)
      .map(([date, data]) => ({
        date,
        open: parseFloat(data['1. open']),
        high: parseFloat(data['2. high']),
        low: parseFloat(data['3. low']),
        close: parseFloat(data['4. close']),
        volume: parseInt(data['5. volume']),
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    setCache(cacheKey, candles);
    return candles;
  } catch (error) {
    logger.error('Erreur récupération données historiques', {
      symbol,
      interval,
      error: error.message,
    });
    
    // Retourne des données mockées
    return getMockHistoricalData(symbol, interval);
  }
};

/**
 * Récupère les données de plusieurs symboles
 * @param {Array<string>} symbols - Liste de symboles
 * @returns {Promise<Array>} Données de marché
 */
const getMultipleMarketData = async (symbols) => {
  const promises = symbols.map((symbol) => getMarketData(symbol));
  const results = await Promise.allSettled(promises);
  
  return results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);
};

/**
 * Génère des données de marché mockées (mode démo)
 * @param {string} symbol - Symbole
 * @returns {Object} Données mockées
 */
const getMockMarketData = (symbol) => {
  const basePrices = {
    'EURUSD': 1.0850,
    'GBPUSD': 1.2650,
    'USDJPY': 149.50,
    'USDCHF': 0.8850,
    'AUDUSD': 0.6550,
    'USDCAD': 1.3550,
    'NZDUSD': 0.6150,
    'XAUUSD': 2035.50,
    'XAGUSD': 22.85,
    'BTCUSD': 48500.00,
    'ETHUSD': 2650.00,
  };

  const basePrice = basePrices[symbol.toUpperCase()] || 100.00;
  const variation = (Math.random() - 0.5) * 0.01;
  const price = basePrice * (1 + variation);

  return {
    symbol: symbol.toUpperCase(),
    price: parseFloat(price.toFixed(5)),
    change: parseFloat((price * variation).toFixed(5)),
    changePercent: parseFloat((variation * 100).toFixed(2)),
    volume: Math.floor(Math.random() * 1000000) + 500000,
    high: parseFloat((price * 1.002).toFixed(5)),
    low: parseFloat((price * 0.998).toFixed(5)),
    open: parseFloat((price * (1 - variation)).toFixed(5)),
    previousClose: parseFloat((price * (1 - variation)).toFixed(5)),
    lastUpdated: new Date().toISOString().split('T')[0],
    isMock: true,
  };
};

/**
 * Génère des données historiques mockées
 * @param {string} symbol - Symbole
 * @param {string} interval - Intervalle
 * @returns {Array} Candles mockées
 */
const getMockHistoricalData = (symbol, interval) => {
  const mockData = getMockMarketData(symbol);
  const candles = [];
  const now = new Date();
  
  let periods = 100;
  let timeStep = 24 * 60 * 60 * 1000; // 1 jour par défaut
  
  if (interval.includes('min')) {
    const minutes = parseInt(interval);
    timeStep = minutes * 60 * 1000;
    periods = 200;
  } else if (interval === 'weekly') {
    timeStep = 7 * 24 * 60 * 60 * 1000;
    periods = 52;
  } else if (interval === 'monthly') {
    timeStep = 30 * 24 * 60 * 60 * 1000;
    periods = 24;
  }

  let currentPrice = mockData.price;

  for (let i = periods; i >= 0; i--) {
    const date = new Date(now.getTime() - i * timeStep);
    const volatility = 0.002;
    const change = (Math.random() - 0.5) * volatility;
    
    const open = currentPrice;
    const close = currentPrice * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
    
    candles.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(5)),
      high: parseFloat(high.toFixed(5)),
      low: parseFloat(low.toFixed(5)),
      close: parseFloat(close.toFixed(5)),
      volume: Math.floor(Math.random() * 100000) + 50000,
    });
    
    currentPrice = close;
  }

  return candles;
};

/**
 * Nettoie le cache
 */
const clearCache = () => {
  cache.clear();
  logger.info('Cache des données marché nettoyé');
};

module.exports = {
  getMarketData,
  getHistoricalData,
  getMultipleMarketData,
  getMockMarketData,
  getMockHistoricalData,
  clearCache,
};