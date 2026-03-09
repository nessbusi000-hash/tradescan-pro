import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
          const { accessToken, refreshToken: newRefresh } = res.data.data
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefresh)
          original.headers.Authorization = `Bearer ${accessToken}`
          return api(original)
        } catch {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
}

// ── Market ────────────────────────────────────────────────────────────────────
export const marketApi = {
  getWatchlist: () => api.get('/market/watchlist'),
  getData: (symbol) => api.get(`/market/data/${symbol}`),
  getHistorical: (symbol, interval = 'daily') =>
    api.get(`/market/historical/${symbol}?interval=${interval}`),
  getPairs: () => api.get('/market/pairs'),
}

// ── SMC ───────────────────────────────────────────────────────────────────────
export const smcApi = {
  analyze: (symbol, interval = 'daily') =>
    api.post('/smc/analyze', { symbol, interval }),
  detectFVG: (symbol, interval = 'daily') =>
    api.post('/smc/fvg', { symbol, interval }),
  detectBOS: (symbol, interval = 'daily') =>
    api.post('/smc/bos', { symbol, interval }),
  detectCHoCH: (symbol, interval = 'daily') =>
    api.post('/smc/choch', { symbol, interval }),
  detectLiquidity: (symbol, interval = 'daily') =>
    api.post('/smc/liquidity', { symbol, interval }),
  analyzeTrend: (symbol, interval = 'daily') =>
    api.post('/smc/trend', { symbol, interval }),
  getSignal: (symbol, interval = 'daily') =>
    api.post('/smc/signal', { symbol, interval }),
}

// ── Trades ────────────────────────────────────────────────────────────────────
export const tradesApi = {
  getAll: (params) => api.get('/trades', { params }),
  getById: (id) => api.get(`/trades/${id}`),
  create: (data) => api.post('/trades', data),
  close: (id, exitPrice) => api.patch(`/trades/${id}/close`, { exit_price: exitPrice }),
  update: (id, data) => api.put(`/trades/${id}`, data),
  delete: (id) => api.delete(`/trades/${id}`),
  getStats: () => api.get('/trades/stats'),
}

// ── Lessons ───────────────────────────────────────────────────────────────────
export const lessonsApi = {
  getAll: (params) => api.get('/lessons', { params }),
  getBySlug: (slug) => api.get(`/lessons/${slug}`),
  getCategories: () => api.get('/lessons/categories'),
  saveProgress: (slug, data) => api.post(`/lessons/${slug}/progress`, data),
  getUserProgress: () => api.get('/lessons/progress'),
}

export default api
