import { create } from 'zustand'
import { authApi } from '../services/api'

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  init: async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      set({ isLoading: false })
      return
    }
    try {
      const res = await authApi.getProfile()
      set({ user: res.data.data, isAuthenticated: true, isLoading: false })
    } catch {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  login: async (email, password) => {
    const res = await authApi.login(email, password)
    const { user, tokens } = res.data.data
    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)
    set({ user, isAuthenticated: true })
    return user
  },

  register: async (data) => {
    const res = await authApi.register(data)
    const { user, tokens } = res.data.data
    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)
    set({ user, isAuthenticated: true })
    return user
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try { await authApi.logout(refreshToken) } catch {}
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ user: null, isAuthenticated: false })
  },

  updateUser: (data) => set((s) => ({ user: { ...s.user, ...data } })),
}))

export default useAuthStore
