import { useState } from 'react'
import {
  Zap, TrendingUp, TrendingDown, AlertTriangle, RefreshCw,
  Target, Activity, ChevronDown, Info
} from 'lucide-react'
import { smcApi } from '../services/api'
import {
  formatPrice, confidenceToLabel, getSignalColor, cn
} from '../utils/helpers'

const SYMBOLS = ['EURUSD','GBPUSD','USDJPY','XAUUSD','BTCUSD','ETHUSD','AUDUSD','SPX','NDX']
const INTERVALS = [
  { value: '1min', label: '1m' },
  { value: '5min', label: '5m' },
  { value: '15min', label: '15m' },
  { value: '60min', label: '1h' },
  { value: 'daily', label: '1J' },
  { value: 'weekly', label: '1S' },
]

function PatternCard({ title, data, color = 'primary' }) {
  return (
    <div className="card">
      <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full bg-${color}`} />
        {title}
      </h3>
      <div className="space-y-2">
        {Object.entries(data).map(([key, val]) => (
          <div key={key} className="flex justify-between items-center">
            <span className="text-xs text-text-muted capitalize">{key.replace(/_/g, ' ')}</span>
            <span className="text-xs font-semibold text-value text-text-primary">{String(val)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SignalBadge({ signal }) {
  if (!signal) return null
  const isLong = signal.type === 'BUY'
  const conf = confidenceToLabel(signal.confidence)

  return (
    <div className={cn(
      'card border-2',
      isLong ? 'border-green/40 bg-green/5' : 'border-red/40 bg-red/5'
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {isLong
            ? <TrendingUp size={22} className="text-green" />
            : <TrendingDown size={22} className="text-red" />
          }
          <div>
            <div className={`text-xl font-bold ${getSignalColor(signal.type)}`}>
              {signal.type}
            </div>
            <div className="text-xs text-text-muted">{signal.strategy}</div>
          </div>
        </div>
        <div className={`text-right`}>
          <div className={`text-lg font-bold text-value ${conf.color}`}>{signal.confidence}%</div>
          <div className={`text-xs ${conf.color}`}>{conf.label}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Entrée', value: formatPrice(signal.entry), color: 'text-text-primary' },
          { label: 'Stop Loss', value: formatPrice(signal.stopLoss), color: 'text-red' },
          { label: 'Take Profit', value: formatPrice(signal.takeProfit), color: 'text-green' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface-2 rounded-lg p-3 text-center">
            <div className="text-xs text-text-muted mb-1">{label}</div>
            <div className={`text-sm font-bold text-value ${color}`}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TrendIndicator({ trend }) {
  if (!trend) return null
  const isUp = trend.overallTrend === 'bullish' || trend.direction === 'up'
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold',
        isUp ? 'bg-green/10 text-green border border-green/20' : 'bg-red/10 text-red border border-red/20'
      )}>
        {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {isUp ? 'HAUSSIER' : 'BAISSIER'}
      </div>
      {trend.strength && (
        <div className="text-xs text-text-muted">
          Force: <span className="text-text-primary font-semibold">{trend.strength}</span>
        </div>
      )}
    </div>
  )
}

export default function SMCPage() {
  const [symbol, setSymbol] = useState('EURUSD')
  const [interval, setInterval] = useState('daily')
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const analyze = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await smcApi.analyze(symbol, interval)
      setResult(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'analyse')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
          <Zap size={24} className="text-primary" />
          Analyse Smart Money Concepts
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Détection automatique des patterns SMC/ICT : FVG, BOS, CHoCH, Liquidité
        </p>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-32">
            <label className="label mb-2 block">Paire</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="input"
            >
              {SYMBOLS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-32">
            <label className="label mb-2 block">Timeframe</label>
            <div className="flex gap-1.5 flex-wrap">
              {INTERVALS.map((i) => (
                <button
                  key={i.value}
                  onClick={() => setInterval(i.value)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                    interval === i.value
                      ? 'bg-primary text-background shadow-glow-primary'
                      : 'bg-surface-2 text-text-secondary hover:text-text-primary border border-border'
                  )}
                >
                  {i.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={analyze}
              disabled={isLoading}
              className="btn-primary flex items-center gap-2 h-10"
            >
              {isLoading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Zap size={16} />
              )}
              {isLoading ? 'Analyse...' : 'Analyser'}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card border border-red/30 bg-red/5 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red flex-shrink-0" />
          <span className="text-red text-sm">{error}</span>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4">
          <div className="h-32 skeleton rounded-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => <div key={i} className="h-40 skeleton rounded-xl" />)}
          </div>
        </div>
      )}

      {/* Results */}
      {result && !isLoading && (
        <div className="space-y-6 animate-slide-up">
          {/* Summary bar */}
          <div className="card bg-gradient-to-r from-surface to-surface-2 flex flex-wrap items-center gap-4">
            <div>
              <div className="label mb-1">Symbole</div>
              <div className="font-bold text-text-primary text-lg">{result.symbol}</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <div className="label mb-1">Tendance</div>
              <TrendIndicator trend={result.trend} />
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <div className="label mb-1">Horodatage</div>
              <div className="text-sm text-text-primary">
                {new Date(result.timestamp).toLocaleTimeString('fr-FR')}
              </div>
            </div>
            {result.signals?.best && (
              <>
                <div className="w-px h-10 bg-border" />
                <div>
                  <div className="label mb-1">Meilleur signal</div>
                  <div className={`font-bold ${getSignalColor(result.signals.best.type)}`}>
                    {result.signals.best.type} — {result.signals.best.confidence}%
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Best signal */}
          {result.signals?.best && (
            <div>
              <h2 className="section-title mb-3">Signal Principal</h2>
              <SignalBadge signal={result.signals.best} />
            </div>
          )}

          {/* Pattern cards */}
          <div>
            <h2 className="section-title mb-3">Patterns Détectés</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <PatternCard
                title="Fair Value Gaps (FVG)"
                color="primary"
                data={{
                  Total: result.patterns.fvg.count,
                  Actifs: result.patterns.fvg.active,
                  Retestés: result.patterns.fvg.retested,
                  Rejetés: result.patterns.fvg.rejected,
                }}
              />
              <PatternCard
                title="Break of Structure (BOS)"
                color="green"
                data={{
                  Total: result.patterns.bos.count,
                  Haussiers: result.patterns.bos.bullish,
                  Baissiers: result.patterns.bos.bearish,
                }}
              />
              <PatternCard
                title="Change of Character (CHoCH)"
                color="accent"
                data={{
                  Total: result.patterns.choch.count,
                  Haussiers: result.patterns.choch.bullish,
                  Baissiers: result.patterns.choch.bearish,
                }}
              />
              <PatternCard
                title="Liquidité"
                color="red"
                data={{
                  Sweeps: result.patterns.liquidity.sweeps,
                  Récents: result.patterns.liquidity.recentSweeps?.length || 0,
                }}
              />
            </div>
          </div>

          {/* Alternative signals */}
          {result.signals?.all?.length > 1 && (
            <div>
              <h2 className="section-title mb-3">Signaux Alternatifs</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {result.signals.all.slice(1, 3).map((sig, i) => (
                  <div key={i} className="card-sm flex items-center justify-between">
                    <div>
                      <div className={`font-bold ${getSignalColor(sig.type)}`}>{sig.type}</div>
                      <div className="text-xs text-text-muted">{sig.strategy}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold text-value ${confidenceToLabel(sig.confidence).color}`}>
                        {sig.confidence}%
                      </div>
                      <div className="text-xs text-text-muted">{confidenceToLabel(sig.confidence).label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !isLoading && !error && (
        <div className="card text-center py-16">
          <Zap size={48} className="mx-auto text-text-muted mb-4" />
          <h3 className="text-text-primary font-semibold text-lg mb-2">Prêt à analyser</h3>
          <p className="text-text-secondary text-sm max-w-md mx-auto">
            Sélectionnez une paire et un timeframe, puis cliquez sur "Analyser" pour obtenir
            une analyse complète SMC avec détection des FVG, BOS, CHoCH et zones de liquidité.
          </p>
        </div>
      )}
    </div>
  )
}
