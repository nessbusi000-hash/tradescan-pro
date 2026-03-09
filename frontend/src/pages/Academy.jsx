import { useState, useEffect } from 'react'
import { BookOpen, CheckCircle, Clock, ChevronRight, Search, Zap, BarChart2, TrendingUp } from 'lucide-react'
import { lessonsApi } from '../services/api'
import { cn } from '../utils/helpers'

const DIFFICULTY_COLORS = {
  beginner: 'badge-green',
  intermediate: 'badge-yellow',
  advanced: 'badge-red',
}

const DIFFICULTY_LABELS = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
}

const CATEGORY_ICONS = {
  smc: Zap,
  ict: TrendingUp,
  risk: BarChart2,
  default: BookOpen,
}

function LessonCard({ lesson, progress, onClick }) {
  const isCompleted = progress?.find((p) => p.lesson_id === lesson.id && p.completed)
  const Icon = CATEGORY_ICONS[lesson.category?.toLowerCase()] || CATEGORY_ICONS.default

  return (
    <div
      onClick={onClick}
      className="card cursor-pointer hover:border-primary/50 hover:bg-surface-2/50 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
          <Icon size={20} />
        </div>
        {isCompleted && (
          <CheckCircle size={18} className="text-green flex-shrink-0" />
        )}
      </div>

      <h3 className="font-bold text-text-primary text-sm mb-1 line-clamp-2">{lesson.title}</h3>
      <p className="text-text-muted text-xs line-clamp-2 mb-3">{lesson.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={DIFFICULTY_COLORS[lesson.difficulty] || 'badge-primary'}>
            {DIFFICULTY_LABELS[lesson.difficulty] || lesson.difficulty}
          </span>
          {lesson.duration_minutes && (
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Clock size={10} />
              {lesson.duration_minutes}m
            </span>
          )}
        </div>
        <ChevronRight size={14} className="text-text-muted group-hover:text-primary transition-colors" />
      </div>
    </div>
  )
}

function LessonModal({ lesson, onClose, onProgress }) {
  const [loading, setLoading] = useState(false)

  const markComplete = async () => {
    setLoading(true)
    try {
      await lessonsApi.saveProgress(lesson.slug, { completed: true, time_spent_seconds: 60 })
      onProgress()
    } catch {}
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <span className={`${DIFFICULTY_COLORS[lesson.difficulty]} mr-2`}>
              {DIFFICULTY_LABELS[lesson.difficulty]}
            </span>
            <span className="text-xs text-text-muted">{lesson.category?.toUpperCase()}</span>
          </div>
          <button onClick={onClose} className="btn-icon text-text-muted hover:text-text-primary">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-xl font-bold text-text-primary mb-2">{lesson.title}</h2>
          <p className="text-text-secondary text-sm mb-6">{lesson.description}</p>
          <div
            className="prose prose-sm prose-invert max-w-none text-text-secondary leading-relaxed"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {lesson.content}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Fermer</button>
          <button onClick={markComplete} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <CheckCircle size={16} />
            Marquer comme lu
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AcademyPage() {
  const [lessons, setLessons] = useState([])
  const [progress, setProgress] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedLesson, setSelectedLesson] = useState(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [lessonsRes, categoriesRes, progressRes] = await Promise.all([
        lessonsApi.getAll({ limit: 100 }),
        lessonsApi.getCategories(),
        lessonsApi.getUserProgress(),
      ])
      setLessons(lessonsRes.data.data?.lessons || lessonsRes.data.data || [])
      setCategories(categoriesRes.data.data || [])
      setProgress(progressRes.data.data || [])
    } catch {
      setLessons([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = lessons.filter((l) => {
    const matchCat = activeCategory === 'all' || l.category === activeCategory
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const completedCount = progress.filter((p) => p.completed).length

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <BookOpen size={24} className="text-primary" />
            Académie SMC
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Maîtrisez les Smart Money Concepts et la méthode ICT
          </p>
        </div>
        {lessons.length > 0 && (
          <div className="card-sm text-center">
            <div className="text-lg font-bold gradient-text">{completedCount}/{lessons.length}</div>
            <div className="label">Complétées</div>
          </div>
        )}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            className="input pl-9"
            placeholder="Rechercher une leçon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              activeCategory === 'all'
                ? 'bg-primary text-background'
                : 'bg-surface-2 text-text-secondary border border-border hover:text-text-primary'
            )}
          >
            Toutes
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all',
                activeCategory === cat
                  ? 'bg-primary text-background'
                  : 'bg-surface-2 text-text-secondary border border-border hover:text-text-primary'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      {lessons.length > 0 && (
        <div className="card-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-text-secondary">Progression globale</span>
            <span className="text-xs font-semibold text-primary">
              {Math.round((completedCount / lessons.length) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / lessons.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Lessons grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(9).fill(0).map((_, i) => (
            <div key={i} className="h-48 skeleton rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <BookOpen size={48} className="mx-auto text-text-muted mb-4" />
          <p className="text-text-secondary">
            {lessons.length === 0
              ? 'Aucune leçon disponible pour l\'instant'
              : 'Aucune leçon ne correspond à votre recherche'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              progress={progress}
              onClick={() => setSelectedLesson(lesson)}
            />
          ))}
        </div>
      )}

      {selectedLesson && (
        <LessonModal
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
          onProgress={() => { load(); setSelectedLesson(null) }}
        />
      )}
    </div>
  )
}
