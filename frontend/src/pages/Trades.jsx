import { useState, useEffect, useCallback } from 'react'
import {
  Plus, TrendingUp, TrendingDown, X, Filter,
  BarChart2, DollarSign, Target, Award, RefreshCw
} from 'lucide-react'
import { tradesApi } from '../services/api'
import {
  formatPrice, formatPnl, formatDate, getPnlColor, getPnlBg, formatPercent, cn
} from '../utils/helpers'

const SYMBOLS = ['EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD','USDCAD','XAUUSD','XAGUSD','BTCUSD','ETHUSD','SPX','NDX']
const STRATEGIES = ['FVG_REJECTION','FVG_RETEST','BOS_PULLBACK','CHOCH_REVERSAL','LIQUIDITY_SWEEP','OTHER']
const TIMEFRAMES = ['1m','5m','15m','30m','1h','4h','1D','1W']

function NewTradeModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    symbol: 'EURUSD', type: 'buy', order_type: 'market',
    volume: '', entry_price: '', stop_loss: '', take_profit: '',
    strategy: '', timeframe: '1D', notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.volume || !form.entry_price) {
      setError('Volume et prix d\'entrée requis')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await tradesApi.create({
        ...form,
        volume: Number(form.volume),
        entry_price: Number(form.entry_price),
        stop_loss: form.stop_loss ? Number(form.stop_loss) : undefined,
        take_profit: form.take_profit ? Number(form.take_profit) : undefined,
      })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="section-title">Nouveau Trade</h2>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5 block">Paire</label>
              <select className="input" value={form.symbol} onChange={(e) => update('symbol', e.target.value)}>
                {SYMBOLS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label mb-1.5 block">Direction</label>
              <div className="flex gap-2">
                {['buy','sell'].map((t) => (
                  <button
                    key={t}
                    onClick={() => update('type', t)}
                    className={cn(
                      'flex-1 py-2.5 rounded-lg text-sm font-bold uppercase transition-all',
                      form.type === t
                        ? t === 'buy' ? 'bg-green text-background shadow-glow-green' : 'bg-red text-white shadow-glow-red'
                        : 'bg-surface-2 text-text-secondary border border-border'
                    )}
                  >
                    {t === 'buy' ? '▲ BUY' : '▼ SELL'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5 block">Volume (lots)</label>
              <input className="input" type="number" step="0.01" placeholder="0.10" value={form.volume} onChange={(e) => update('volume', e.target.value)} />
            </div>
            <div>
              <label className="label mb-1.5 block">Prix d'entrée</label>
              <input className="input" type="number" step="0.00001" placeholder="1.08500" value={form.entry_price} onChange={(e) => update('entry_price', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5 block">Stop Loss</label>
              <input className="input" type="number" step="0.00001" placeholder="Optionnel" value={form.stop_loss} onChange={(e) => update('stop_loss', e.target.value)} />
            </div>
            <div>
              <label className="label mb-1.5 block">Take Profit</label>
              <input className="input" type="number" step="0.00001" placeholder="Optionnel" value={form.take_profit} onChange={(e) => update('take_profit', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5 block">Stratégie</label>
              <select className="input" value={form.strategy} onChange={(e) => update('strategy', e.target.value)}>
                <option value="">— Choisir —</option>
                {STRATEGIES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label mb-1.5 block">Timeframe</label>
              <select className="input" value={form.timeframe} onChange={(e) => update('timeframe', e.target.value)}>
                {TIMEFRAMES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label mb-1.5 block">Notes</label>
            <textarea className="input h-20 resize-none" placeholder="Raison d'entrée, analyse..." value={form.notes} onChange={(e) => update('notes', e.target.value)} />
          </div>

          {error && <div className="text-red text-sm bg-red/10 border border-red/20 rounded-lg px-3 py-2">{error}</div>}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button onClick={submit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
            Ouvrir le trade
          </button>
        </div>
      </div>
    </div>
  )
}

function CloseTradeModal({ trade, onClose, onSuccess }) {
  const [exitPrice, setExitPrice] = useState(String(trade.entry_price))
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      await tradesApi.close(trade.id, Number(exitPrice))
      onSuccess()
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-sm shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="section-title">Fermer le trade</h2>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="card-sm bg-surface-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Paire</span>
              <span className="font-semibold text-text-primary">{trade.symbol}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-text-muted">Entrée</span>
              <span className="text-value text-text-primary">{formatPrice(trade.entry_price)}</span>
            </div>
          </div>
          <div>
            <label className="label mb-1.5 block">Prix de sortie</label>
            <input
              className="input text-lg font-semibold text-value"
              type="number" step="0.00001"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button onClick={submit} disabled={loading} className="btn-danger flex-1">
            {loading ? <RefreshCw size={14} className="animate-spin mx-auto" /> : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TradesPage() {
  const [trades, setTrades] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [closingTrade, setClosingTrade] = useState(null)
  const [filter, setFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [tradesRes, statsRes] = await Promise.all([
        tradesApi.getAll({ status: filter === 'all' ? undefined : filter }),
        tradesApi.getStats(),
      ])
      setTrades(tradesRes.data.data?.trades || [])
      setStats(statsRes.data.data)
    } catch {
      setTrades([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
          <BarChart2 size={24} className="text-primary" />
          Journal de Trading
        </h1>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Nouveau Trade
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'P&L Total', value: `${formatPnl(stats.total_pnl)} $`, color: Number(stats.total_pnl) >= 0 ? 'text-green' : 'text-red', icon: DollarSign },
            { label: 'Win Rate', value: `${Number(stats.win_rate || 0).toFixed(1)}%`, color: 'text-primary', icon: Target },
            { label: 'Total Trades', value: stats.total_trades, color: 'text-text-primary', icon: BarChart2 },
            { label: 'Ouverts', value: stats.open_trades, color: 'text-accent', icon: Award },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-primary">
                <Icon size={18} />
              </div>
              <div>
                <div className="label">{label}</div>
                <div className={`text-xl font-bold text-value ${color}`}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        {['all','open','closed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all',
              filter === f
                ? 'bg-primary text-background'
                : 'bg-surface-2 text-text-secondary hover:text-text-primary border border-border'
            )}
          >
            {f === 'all' ? 'Tous' : f === 'open' ? 'Ouverts' : 'Fermés'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                {['Paire','Direction','Volume','Entrée','Sortie','SL','TP','P&L','Statut','Stratégie','Ouvert le',''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 label whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array(12).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 skeleton rounded w-16" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : trades.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-16 text-text-muted">
                    <BarChart2 size={32} className="mx-auto mb-3 opacity-50" />
                    <p>Aucun trade trouvé</p>
                  </td>
                </tr>
              ) : (
                trades.map((trade) => (
                  <tr key={trade.id} className="border-b border-border/30 hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-text-primary">{trade.symbol}</td>
                    <td className="px-4 py-3">
                      <span className={trade.type === 'buy' ? 'badge-green' : 'badge-red'}>
                        {trade.type === 'buy' ? '▲ BUY' : '▼ SELL'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-value text-text-secondary">{trade.volume}</td>
                    <td className="px-4 py-3 text-value text-text-primary">{formatPrice(trade.entry_price)}</td>
                    <td className="px-4 py-3 text-value text-text-secondary">{trade.exit_price ? formatPrice(trade.exit_price) : '—'}</td>
                    <td className="px-4 py-3 text-value text-red/80">{trade.stop_loss ? formatPrice(trade.stop_loss) : '—'}</td>
                    <td className="px-4 py-3 text-value text-green/80">{trade.take_profit ? formatPrice(trade.take_profit) : '—'}</td>
                    <td className={`px-4 py-3 font-semibold text-value ${getPnlColor(trade.pnl)}`}>
                      {trade.pnl ? `${formatPnl(trade.pnl)} $` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'badge-primary capitalize',
                        trade.status === 'open' && 'badge-yellow',
                        trade.status === 'closed' && (trade.pnl >= 0 ? 'badge-green' : 'badge-red'),
                      )}>
                        {trade.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">{trade.strategy || '—'}</td>
                    <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                      {formatDate(trade.opened_at, { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      {trade.status === 'open' && (
                        <button
                          onClick={() => setClosingTrade(trade)}
                          className="btn-danger text-xs py-1 px-2"
                        >
                          Fermer
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showNew && (
        <NewTradeModal
          onClose={() => setShowNew(false)}
          onSuccess={() => { setShowNew(false); load() }}
        />
      )}
      {closingTrade && (
        <CloseTradeModal
          trade={closingTrade}
          onClose={() => setClosingTrade(null)}
          onSuccess={() => { setClosingTrade(null); load() }}
        />
      )}
    </div>
  )
}
