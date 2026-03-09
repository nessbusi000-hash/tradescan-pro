/**
 * Configuration des API externes
 * ================================
 */

// Configuration Alpha Vantage API
const ALPHA_VANTAGE_CONFIG = {
  baseUrl: 'https://www.alphavantage.co/query',
  apiKey: process.env.ALPHA_VANTAGE_API_KEY || 'demo',
  rateLimitPerMinute: 5, // Limite gratuite : 5 appels par minute
  rateLimitPerDay: 500,  // Limite gratuite : 500 appels par jour
};

// Configuration TradingView (widget)
const TRADINGVIEW_CONFIG = {
  widgetUrl: 'https://s3.tradingview.com/tv.js',
  chartUrl: 'https://www.tradingview.com/chart',
  brokerConfig: {
    enabled: true,
    allowSymbolChange: true,
    showIntervalTabs: true,
    interval: '1D',
    timezone: 'Europe/Paris',
    theme: 'dark',
    style: '1', // Candlestick
    locale: 'fr',
    enablePublishing: false,
    allowSymbolChange: true,
    saveImage: true,
    calendar: false,
    supportHost: 'https://www.tradingview.com',
  },
};

// Paires de trading supportées
const SUPPORTED_PAIRS = [
  { symbol: 'EURUSD', name: 'EUR/USD', type: 'forex' },
  { symbol: 'GBPUSD', name: 'GBP/USD', type: 'forex' },
  { symbol: 'USDJPY', name: 'USD/JPY', type: 'forex' },
  { symbol: 'USDCHF', name: 'USD/CHF', type: 'forex' },
  { symbol: 'AUDUSD', name: 'AUD/USD', type: 'forex' },
  { symbol: 'USDCAD', name: 'USD/CAD', type: 'forex' },
  { symbol: 'NZDUSD', name: 'NZD/USD', type: 'forex' },
  { symbol: 'XAUUSD', name: 'Or', type: 'commodity' },
  { symbol: 'XAGUSD', name: 'Argent', type: 'commodity' },
  { symbol: 'USOIL', name: 'Pétrole brut', type: 'commodity' },
  { symbol: 'BTCUSD', name: 'Bitcoin', type: 'crypto' },
  { symbol: 'ETHUSD', name: 'Ethereum', type: 'crypto' },
  { symbol: 'SPX', name: 'S&P 500', type: 'index' },
  { symbol: 'NDX', name: 'NASDAQ 100', type: 'index' },
  { symbol: 'DJI', name: 'Dow Jones', type: 'index' },
];

// Timeframes supportés
const TIMEFRAMES = [
  { value: '1m', label: '1 Minute', seconds: 60 },
  { value: '5m', label: '5 Minutes', seconds: 300 },
  { value: '15m', label: '15 Minutes', seconds: 900 },
  { value: '30m', label: '30 Minutes', seconds: 1800 },
  { value: '1h', label: '1 Heure', seconds: 3600 },
  { value: '4h', label: '4 Heures', seconds: 14400 },
  { value: '1D', label: 'Journalier', seconds: 86400 },
  { value: '1W', label: 'Hebdomadaire', seconds: 604800 },
  { value: '1M', label: 'Mensuel', seconds: 2592000 },
];

// Mapping des symboles pour Alpha Vantage
const getAlphaVantageSymbol = (symbol) => {
  const mapping = {
    'EURUSD': 'EURUSD',
    'GBPUSD': 'GBPUSD',
    'USDJPY': 'USDJPY',
    'XAUUSD': 'XAUUSD',
    'XAGUSD': 'XAGUSD',
    'BTCUSD': 'BTCUSD',
    'ETHUSD': 'ETHUSD',
  };
  return mapping[symbol] || symbol;
};

// Mapping des symboles pour TradingView
const getTradingViewSymbol = (symbol) => {
  const mapping = {
    'EURUSD': 'FX:EURUSD',
    'GBPUSD': 'FX:GBPUSD',
    'USDJPY': 'FX:USDJPY',
    'USDCHF': 'FX:USDCHF',
    'AUDUSD': 'FX:AUDUSD',
    'USDCAD': 'FX:USDCAD',
    'NZDUSD': 'FX:NZDUSD',
    'XAUUSD': 'OANDA:XAUUSD',
    'XAGUSD': 'OANDA:XAGUSD',
    'USOIL': 'TVC:USOIL',
    'BTCUSD': 'BINANCE:BTCUSDT',
    'ETHUSD': 'BINANCE:ETHUSDT',
    'SPX': 'SP:SPX',
    'NDX': 'NASDAQ:NDX',
    'DJI': 'DJ:DJI',
  };
  return mapping[symbol] || symbol;
};

module.exports = {
  ALPHA_VANTAGE_CONFIG,
  TRADINGVIEW_CONFIG,
  SUPPORTED_PAIRS,
  TIMEFRAMES,
  getAlphaVantageSymbol,
  getTradingViewSymbol,
};