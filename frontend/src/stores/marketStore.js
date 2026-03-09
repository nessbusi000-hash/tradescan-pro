import { create } from 'zustand'
import { marketApi } from '../services/api'

const useMarketStore = create((set, get) => ({
  watchlist: [],
  selectedSymbol: 'EURUSD',
  selectedInterval: '1D',
  isLoading: false,
  lastUpdate: null,

  setSymbol: (symbol) => set({ selectedSymbol: symbol }),
  setInterval: (interval) => set({ selectedInterval: interval }),

  fetchWatchlist: async () => {
    set({ isLoading: true })
    try {
      const res = await marketApi.getWatchlist()
      set({ watchlist: res.data.data, lastUpdate: new Date(), isLoading: false })
    } catch (err) {
      console.error('Watchlist error:', err)
      set({ isLoading: false })
    }
  },

  refreshWatchlist: () => {
    const { fetchWatchlist } = get()
    fetchWatchlist()
  },
}))

export default useMarketStore
