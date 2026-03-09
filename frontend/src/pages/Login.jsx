import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Eye, EyeOff, RefreshCw } from 'lucide-react'
import useAuthStore from '../stores/authStore'

export default function LoginPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { login, register } = useAuthStore()
  const navigate = useNavigate()

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        if (!form.first_name) { setError('Prénom requis'); setLoading(false); return }
        await register(form)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur d\'authentification')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 grid-bg">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 shadow-glow-primary">
            <TrendingUp size={30} className="text-background" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">TradeScan Pro</h1>
          <p className="text-text-secondary text-sm mt-2">
            Plateforme d'analyse Smart Money Concepts
          </p>
        </div>

        {/* Card */}
        <div className="card shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-surface-2 rounded-xl p-1 mb-6">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null) }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label mb-1.5 block">Prénom</label>
                  <input className="input" placeholder="Jean" value={form.first_name} onChange={update('first_name')} />
                </div>
                <div>
                  <label className="label mb-1.5 block">Nom</label>
                  <input className="input" placeholder="Dupont" value={form.last_name} onChange={update('last_name')} />
                </div>
              </div>
            )}

            <div>
              <label className="label mb-1.5 block">Email</label>
              <input
                type="email"
                className="input"
                placeholder="trader@example.com"
                value={form.email}
                onChange={update('email')}
                required
              />
            </div>

            <div>
              <label className="label mb-1.5 block">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={update('password')}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red text-sm bg-red/10 border border-red/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : null}
              {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-text-muted text-center">
              Mode démo : créez un compte pour tester toutes les fonctionnalités
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
