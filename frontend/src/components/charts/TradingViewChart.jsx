import { useEffect, useRef } from 'react'

const TV_SYMBOL_MAP = {
  EURUSD: 'FX:EURUSD', GBPUSD: 'FX:GBPUSD', USDJPY: 'FX:USDJPY',
  USDCHF: 'FX:USDCHF', AUDUSD: 'FX:AUDUSD', USDCAD: 'FX:USDCAD',
  NZDUSD: 'FX:NZDUSD', XAUUSD: 'OANDA:XAUUSD', XAGUSD: 'OANDA:XAGUSD',
  USOIL: 'TVC:USOIL', BTCUSD: 'BINANCE:BTCUSDT', ETHUSD: 'BINANCE:ETHUSDT',
  SPX: 'SP:SPX', NDX: 'NASDAQ:NDX', DJI: 'DJ:DJI',
}

export default function TradingViewChart({ symbol = 'EURUSD', interval = '1D', height = 500 }) {
  const containerRef = useRef(null)
  const widgetRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (!window.TradingView) return

    // Clear old widget
    containerRef.current.innerHTML = ''

    const tvSymbol = TV_SYMBOL_MAP[symbol] || symbol

    widgetRef.current = new window.TradingView.widget({
      autosize: true,
      symbol: tvSymbol,
      interval: interval,
      container_id: containerRef.current.id,
      library_path: '/charting_library/',
      locale: 'fr',
      theme: 'Dark',
      style: '1',
      toolbar_bg: '#0d1424',
      enable_publishing: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      save_image: false,
      backgroundColor: '#070b14',
      gridColor: 'rgba(30, 45, 69, 0.5)',
      hide_top_toolbar: false,
      timezone: 'Europe/Paris',
      studies: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies'],
    })

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [symbol, interval])

  // Fallback: use TradingView Advanced Chart embed if library not available
  const tvSymbol = TV_SYMBOL_MAP[symbol] || symbol
  const iframeSrc = `https://s.tradingview.com/widgetembed/?frameElementId=tv_chart&symbol=${encodeURIComponent(tvSymbol)}&interval=${interval}&hidesidetoolbar=0&hidetoptoolbar=0&symboledit=1&saveimage=0&toolbarbg=0d1424&theme=dark&style=1&timezone=Europe%2FParis&studies=RSI%40tv-basicstudies%7CMACD%40tv-basicstudies&locale=fr`

  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-border">
      <iframe
        src={iframeSrc}
        style={{ width: '100%', height: '100%', border: 'none' }}
        allowTransparency
        allowFullScreen
        scrolling="no"
        title={`TradingView ${symbol}`}
      />
    </div>
  )
}
