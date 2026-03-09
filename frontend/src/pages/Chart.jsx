import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RefreshCw, ChevronDown } from 'lucide-react'
import TradingViewChart from '../components/charts/TradingViewChart'
import { symbolToFlag } from '../utils/helpers'

const PAIRS = [
  { symbol: 'EURUSD', name: 'EUR/USD', type: 'Forex' },
  { symbol: 'GBPUSD', name: 'GBP/USD', type: 'Forex' },
  { symbol: 'USDJPY', name: 'USD/JPY', type: 'Forex' },
  { symbol: 'USDCHF', name: 'USD/CHF', type: 'Forex' },
  { symbol: 'AUDUSD', name: 'AUD/USD', type: 'Forex' },
  { symbol: 'USDCAD', name: 'USD/CAD', type: 'Forex' },
  { symbol: 'XAUUSD', name: 'Or XAU/USD', type: 'Commodity' },
  { symbol: 'BTCUSD', name: 'Bitcoin', type: 'Crypto' },
  { symbol: 'ETHUSD', name: 'Ethereum', type: 'Crypto' },
  { symbol: 'SPX', name: 'S&P 500', type: 'Index' },
]

const INTERVALS = [
  { value: '1', label: '1m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '30', label: '30m' },
  { value: '60', label: '1h' },
  { value: '240', label: '4h' },
  { value: '1D', label: '1J' },
  { value: '1W', label: '1S' },
  { value: '1M', label: '1M' },
]

export default function ChartPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [symbol, setSymbol] = useState(searchParams.get('symbol') || 'EURUSD')
  const [interval, setInterval] = useState('1D')
  const [showPairs, setShowPairs] = useState(false)
  const [chartKey, setChartKey] = useState(0)

  const handleSymbolChange = (s) => {
    setSymbol(s)
    setSearchParams({ symbol: s })
    setShowPairs(false)
    setChartKey((k) => k + 1)
  }

  const handleIntervalChange = (i) => {
    setInterval(i)
    setChartKey((k) => k + 1)
  }

  const currentPair = PAIRS.find((p) => p.symbol === symbol)

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 bg-surface border-b border-border flex-shrink-0">
        {/* Symbol selector */}
        <div className="relative">
          <button
            onClick={() => setShowPairs((v) => !v)}
            className="flex items-center gap-2 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm hover:border-primary transition-colors"
          >
            <span>{symbolToFlag(symbol)}</span>
            <span className="font-semibold text-text-primary">{symbol}</span>
            <ChevronDown size={14} className="text-text-muted" />
          </button>
          {showPairs && (
            <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-xl shadow-xl z-30 w-56 overflow-hidden">
              {Object.entries(
                PAIRS.reduce((acc, p) => {
                  if (!acc[p.type]) acc[p.type] = []
                  acc[p.type].push(p)
                  return acc
                }, {})
              ).map(([type, pairs]) => (
                <div key={type}>
                  <div className="px-3 py-1.5 text-xs font-semibold text-text-muted bg-surface-2 uppercase tracking-wider">
                    {type}
                  </div>
                  {pairs.map((p) => (
                    <button
                      key={p.symbol}
                      onClick={() => handleSymbolChange(p.symbol)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-surface-2 transition-colors ${
                        symbol === p.symbol ? 'text-primary' : 'text-text-primary'
                      }`}
                    >
                      <span>{symbolToFlag(p.symbol)}</span>
                      <span className="font-medium">{p.symbol}</span>
                      <span className="text-text-muted text-xs ml-auto">{p.name}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interval buttons */}
        <div className="flex items-center gap-1 bg-surface-2 rounded-lg p-1 border border-border">
          {INTERVALS.map((i) => (
            <button
              key={i.value}
              onClick={() => handleIntervalChange(i.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                interval === i.value
                  ? 'bg-primary text-background shadow-glow-primary'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {i.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {currentPair && (
            <span className="text-xs text-text-secondary">{currentPair.name}</span>
          )}
          <button
            onClick={() => setChartKey((k) => k + 1)}
            className="btn-icon"
            title="Rafraîchir"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 p-0" onClick={() => setShowPairs(false)}>
        <TradingViewChart
          key={chartKey}
          symbol={symbol}
          interval={interval}
          height={1000}
        />
      </div>
    </div>
  )
}
