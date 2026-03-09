import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price, decimals = 5) {
  if (price === null || price === undefined) return '—'
  return Number(price).toFixed(decimals)
}

export function formatPnl(pnl) {
  if (pnl === null || pnl === undefined) return '—'
  const sign = pnl >= 0 ? '+' : ''
  return `${sign}${Number(pnl).toFixed(2)}`
}

export function formatPercent(pct) {
  if (pct === null || pct === undefined) return '—'
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${Number(pct).toFixed(2)}%`
}

export function formatVolume(vol) {
  if (!vol) return '0'
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(2)}K`
  return String(vol)
}

export function formatDate(date, opts = {}) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...opts,
  }).format(new Date(date))
}

export function symbolToFlag(symbol) {
  const flags = {
    EURUSD: '🇪🇺🇺🇸',
    GBPUSD: '🇬🇧🇺🇸',
    USDJPY: '🇺🇸🇯🇵',
    USDCHF: '🇺🇸🇨🇭',
    AUDUSD: '🇦🇺🇺🇸',
    USDCAD: '🇺🇸🇨🇦',
    NZDUSD: '🇳🇿🇺🇸',
    XAUUSD: '🥇',
    XAGUSD: '⚪',
    BTCUSD: '₿',
    ETHUSD: 'Ξ',
    SPX: '📊',
    NDX: '📊',
  }
  return flags[symbol] || '📈'
}

export function getPnlColor(value) {
  if (!value) return 'text-text-secondary'
  return Number(value) >= 0 ? 'text-green' : 'text-red'
}

export function getPnlBg(value) {
  if (!value) return ''
  return Number(value) >= 0 ? 'bg-green/10' : 'bg-red/10'
}

export function getSignalColor(type) {
  if (!type) return 'text-text-secondary'
  return type === 'BUY' ? 'text-green' : 'text-red'
}

export function confidenceToLabel(score) {
  if (score >= 80) return { label: 'Très fort', color: 'text-green' }
  if (score >= 65) return { label: 'Fort', color: 'text-primary' }
  if (score >= 50) return { label: 'Modéré', color: 'text-accent' }
  return { label: 'Faible', color: 'text-red' }
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}
