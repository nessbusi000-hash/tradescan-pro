import { useState } from 'react'
import { Settings, User, Lock, Save, RefreshCw, CheckCircle } from 'lucide-react'
import { authApi } from '../services/api'
import useAuthStore from '../stores/authStore'

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore()

  const [profile, setProfile] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
  })

  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm: '',
  })

  const [profileLoading, setProfileLoading] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)
  const [pwMsg, setPwMsg] = useState(null)

  const saveProfile = async () => {
    setProfileLoading(true)
    setProfileMsg(null)
    try {
      const res = await authApi.updateProfile(profile)
      updateUser(res.data.data)
      setProfileMsg({ type: 'success', text: 'Profil mis à jour !' })
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Erreur' })
    } finally {
      setProfileLoading(false)
    }
  }

  const changePassword = async () => {
    if (passwords.new_password !== passwords.confirm) {
      setPwMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas' })
      return
    }
    setPwLoading(true)
    setPwMsg(null)
    try {
      await authApi.changePassword({
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      })
      setPasswords({ current_password: '', new_password: '', confirm: '' })
      setPwMsg({ type: 'success', text: 'Mot de passe changé !' })
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Erreur' })
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
        <Settings size={24} className="text-primary" />
        Paramètres
      </h1>

      {/* Profile */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <User size={20} />
          </div>
          <div>
            <h2 className="font-bold text-text-primary">Profil</h2>
            <p className="text-xs text-text-muted">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label mb-1.5 block">Prénom</label>
            <input
              className="input"
              value={profile.first_name}
              onChange={(e) => setProfile((f) => ({ ...f, first_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Nom</label>
            <input
              className="input"
              value={profile.last_name}
              onChange={(e) => setProfile((f) => ({ ...f, last_name: e.target.value }))}
            />
          </div>
        </div>

        {profileMsg && (
          <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
            profileMsg.type === 'success'
              ? 'bg-green/10 text-green border border-green/20'
              : 'bg-red/10 text-red border border-red/20'
          }`}>
            {profileMsg.type === 'success' && <CheckCircle size={14} />}
            {profileMsg.text}
          </div>
        )}

        <button onClick={saveProfile} disabled={profileLoading} className="btn-primary flex items-center gap-2 w-full justify-center">
          {profileLoading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          Sauvegarder
        </button>
      </div>

      {/* Password */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
            <Lock size={20} />
          </div>
          <h2 className="font-bold text-text-primary">Changer le mot de passe</h2>
        </div>

        {['current_password', 'new_password', 'confirm'].map((field) => (
          <div key={field}>
            <label className="label mb-1.5 block">
              {field === 'current_password' ? 'Mot de passe actuel'
                : field === 'new_password' ? 'Nouveau mot de passe'
                : 'Confirmer'}
            </label>
            <input
              type="password"
              className="input"
              value={passwords[field]}
              onChange={(e) => setPasswords((f) => ({ ...f, [field]: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
        ))}

        {pwMsg && (
          <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
            pwMsg.type === 'success'
              ? 'bg-green/10 text-green border border-green/20'
              : 'bg-red/10 text-red border border-red/20'
          }`}>
            {pwMsg.type === 'success' && <CheckCircle size={14} />}
            {pwMsg.text}
          </div>
        )}

        <button onClick={changePassword} disabled={pwLoading} className="btn-secondary flex items-center gap-2 w-full justify-center">
          {pwLoading ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
          Changer le mot de passe
        </button>
      </div>
    </div>
  )
}
