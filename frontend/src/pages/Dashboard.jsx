import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Zap, BarChart2, BookOpen,
  ChevronRight, Activity, DollarSign, Target, Award
} from 'lucide-react'
import useAuthStore from '../stores/authStore'
import useMarketStore from '../stores/marketStore'
import { tradesApi } from '../services/api'
import {
  formatPrice, formatPercent, formatPnl, getPnlColor,
  symbolToFlag, formatDate
} from '../utils/helpers'

function StatCard({ icon: Icon, label, value, sub, color = 'text-primary' }) {
  return (
    <div className="card flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <div className={`w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center ${color}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className={`text-2xl font-bold text-value ${color}`}>{value}</div>
      {sub && <div className="text-xs text-text-muted">{sub}</div>}
    </div>
  )
}

function WatchlistRow({ item }) {
  const positive = item.changePercent >= 0
  return (
    <Link to={`/chart?symbol=${item.symbol}`} className="flex items-center justify-between py-3 px-4 hover:bg-surface-2 rounded-lg transition-colors group">
      <div className="flex items-center gap-3">
        <span className="text-lg">{symbolToFlag(item.symbol)}</span>
        <div>
          <div className="text-sm font-semibold text-text-primary">{item.symbol}</div>
          <div className="text-xs text-text-muted">{item.name || item.symbol}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-value text-text-primary">
          {formatPrice(item.price)}
        </div>
        <div className={`text-xs font-medium text-value ${positive ? 'text-green' : 'text-red'}`}>
          {positive ? '▲' : '▼'} {formatPercent(item.changePercent)}
        </div>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const { watchlist, fetchWatchlist, isLoading } = useMarketStore()
  const [stats, setStats] = useState(null)
  const [recentTrades, setRecentTrades] = useState([])

  useEffect(() => {
    fetchWatchlist()
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [statsRes, tradesRes] = await Promise.all([
        tradesApi.getStats(),
        tradesApi.getAll({ limit: 5 }),
      ])
      setStats(statsRes.data.data)
      setRecentTrades(tradesRes.data.data?.trades || [])
    } catch {
      // No trades yet
    }
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {greeting}, <span className="gradient-text">{user?.first_name || 'Trader'}</span> 👋
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link to="/smc" className="btn-primary flex items-center gap-2">
          <Zap size={16} />
          Analyser le marché
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="P&L Total"
          value={stats ? `${formatPnl(stats.total_pnl)} $` : '—'}
          sub={`${stats?.closed_trades || 0} trades fermés`}
          color={stats?.total_pnl >= 0 ? 'text-green' : 'text-red'}
        />
        <StatCard
          icon={Target}
          label="Win Rate"
          value={stats ? `${Number(stats.win_rate || 0).toFixed(1)}%` : '—'}
          sub={`${stats?.winning_trades || 0}W / ${stats?.losing_trades || 0}L`}
          color="text-primary"
        />
        <StatCard
          icon={Activity}
          label="Positions ouvertes"
          value={stats?.open_trades || '0'}
          sub="Trades actifs"
          color="text-accent"
        />
        <StatCard
          icon={Award}
          label="Meilleur trade"
          value={stats ? `+${Number(stats.best_trade || 0).toFixed(2)} $` : '—'}
          sub={`Pire: ${Number(stats?.worst_trade || 0).toFixed(2)} $`}
          color="text-green"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Watchlist */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Watchlist</h2>
            <Link to="/chart" className="text-xs text-primary hover:underline flex items-center gap-1">
              Voir tout <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-1">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-14 skeleton rounded-lg" />
              ))
            ) : watchlist.length > 0 ? (
              watchlist.slice(0, 7).map((item) => (
                <WatchlistRow key={item.symbol} item={item} />
              ))
            ) : (
              <div className="text-center py-8 text-text-muted text-sm">
                Données non disponibles
              </div>
            )}
          </div>
        </div>

        {/* Recent Trades + Quick Links */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick links */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { to: '/chart', icon: TrendingUp, label: 'Graphique', color: 'from-primary/20 to-primary/5' },
              { to: '/smc', icon: Zap, label: 'Analyse SMC', color: 'from-secondary/20 to-secondary/5' },
              { to: '/academy', icon: BookOpen, label: 'Académie', color: 'from-accent/20 to-accent/5' },
            ].map(({ to, icon: Icon, label, color }) => (
              <Link
                key={to}
                to={to}
                className={`card bg-gradient-to-br ${color} hover:scale-105 transition-transform duration-200 flex flex-col items-center gap-2 py-5`}
              >
                <Icon size={24} className="text-primary" />
                <span className="text-sm font-semibold text-text-primary">{label}</span>
              </Link>
            ))}
          </div>

          {/* Recent Trades */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Trades Récents</h2>
              <Link to="/trades" className="text-xs text-primary hover:underline flex items-center gap-1">
                Voir tout <ChevronRight size={12} />
              </Link>
            </div>
            {recentTrades.length === 0 ? (
              <div className="text-center py-10">
                <BarChart2 size={32} className="mx-auto text-text-muted mb-3" />
                <p className="text-text-secondary text-sm">Aucun trade pour l'instant</p>
                <Link to="/trades" className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
                  <TrendingUp size={14} />
                  Ouvrir un trade
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentTrades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-2">
                    <div className="flex items-center gap-3">
                      <span className={`badge-${trade.type === 'buy' ? 'green' : 'red'} uppercase`}>
                        {trade.type}
                      </span>
                      <div>
                        <span className="text-sm font-semibold text-text-primary">{trade.symbol}</span>
                        <span className="text-xs text-text-muted ml-2">{formatDate(trade.opened_at, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold text-value ${getPnlColor(trade.pnl)}`}>
                        {trade.pnl ? formatPnl(trade.pnl) + ' $' : '—'}
                      </div>
                      <div className="text-xs text-text-muted capitalize">{trade.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
