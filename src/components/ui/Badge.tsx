import { useState } from 'react'
import { BADGE_DEFS } from '@/lib/game/badges'
import { cn } from '@/lib/utils'

interface BadgeChipProps {
  badgeKey: string
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
}

const sizeStyles = {
  sm: { icon: 'text-lg', name: 'text-xs' },
  md: { icon: 'text-2xl', name: 'text-xs' },
  lg: { icon: 'text-4xl', name: 'text-sm' },
}

export function BadgeChip({ badgeKey, size = 'md', showName = false }: BadgeChipProps) {
  const def = BADGE_DEFS[badgeKey]
  if (!def) return null

  return (
    <div
      className={cn('flex flex-col items-center gap-1 p-2 rounded-m', showName && 'min-w-[60px]')}
      style={{ background: 'var(--card)', border: '1px solid var(--border-a)' }}
      title={`${def.name} — ${def.desc}`}
    >
      <span className={sizeStyles[size].icon}>{def.icon}</span>
      {showName && (
        <span className={cn('font-bold text-center leading-tight', sizeStyles[size].name)} style={{ color: 'var(--muted)' }}>
          {def.name}
        </span>
      )}
    </div>
  )
}

interface BadgeListProps {
  badges: string[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
}

export function BadgeList({ badges, max, size = 'sm' }: BadgeListProps) {
  const shown = max ? badges.slice(0, max) : badges
  const remaining = max && badges.length > max ? badges.length - max : 0

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map(key => (
        <BadgeChip key={key} badgeKey={key} size={size} />
      ))}
      {remaining > 0 && (
        <div
          className="flex items-center justify-center px-2 rounded-m text-xs font-bold"
          style={{ background: 'var(--card)', color: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}

// ── Badge Showcase (full catalog with locked/unlocked) ──────

interface BadgeShowcaseProps {
  unlockedKeys: string[]
  accentColor?: string
}

const BADGE_CATEGORIES: { label: string; keys: string[] }[] = buildCategories()

function buildCategories() {
  // Group badges by prefix pattern for a rough categorization
  const allKeys = Object.keys(BADGE_DEFS)
  const cats: { label: string; prefixes: string[] }[] = [
    { label: 'Goles', prefixes: ['primer_gol', 'primer_doblete', 'hat_trick', 'poker', 'manita', 'doble_digito', 'goles_', 'gol_debut', 'gol_y_cero', 'gol_50_partidos', 'media_gol'] },
    { label: 'Asistencias', prefixes: ['primera_asistencia', 'doble_asist', 'triple_asist', 'asistencias_', 'gol_y_asist', 'asist_'] },
    { label: 'Hazanas', prefixes: ['chilena', 'olimpico', 'tacon', 'porteria_cero', 'parada_penalti', 'muro_', 'doble_hazana', 'triple_hazana', 'todo_cero', 'portero_goleador', 'parada_y_asist', 'gol_asist_hazana'] },
    { label: 'Partidos', prefixes: ['primer_partido', 'partidos_'] },
    { label: 'MVP', prefixes: ['primer_mvp', 'mvp_'] },
    { label: 'XP y Nivel', prefixes: ['xp_', 'nivel_'] },
    { label: 'Combos', prefixes: ['gol_50_mvp', 'partidos_100_goles', 'partido_perfecto', 'doble_doble', 'triple_doble', 'zero_to_hero', 'vitrina_llena', 'hat_trick_asist', 'mvp_hat_trick', 'all_categories', 'gol_hat_asist', 'mvp_goleada', 'mvp_remontada', 'gol_todos_partidos', 'goles_asist_100', 'partidos_50_mvp', 'gol_100_asist'] },
    { label: 'Meta', prefixes: ['leyenda_total', 'leyenda_100', 'leyenda_150'] },
    { label: 'Portero', prefixes: ['portero_', 'parada_'] },
    { label: 'Rachas', prefixes: ['racha_'] },
    { label: 'Social', prefixes: ['primer_voto', 'votado_', 'rating_', 'votos_dados'] },
    { label: 'Pistas', prefixes: ['pista_', 'pistas_', 'jugar_'] },
    { label: 'Tiempo', prefixes: ['madrugador', 'nocturno', 'fin_de_semana', 'lunes_guerrero', 'navidad', 'nochevieja', 'ano_nuevo', 'mediodia', 'finde_', 'entre_semana'] },
    { label: 'Resultados', prefixes: ['goleada_', 'remontada', 'empate_', 'victoria_ajustada', 'muchos_goles', 'partido_epico'] },
  ]

  const used = new Set<string>()
  const result: { label: string; keys: string[] }[] = []

  for (const cat of cats) {
    const keys = allKeys.filter(k => {
      if (used.has(k)) return false
      return cat.prefixes.some(p => k === p || k.startsWith(p))
    })
    keys.forEach(k => used.add(k))
    if (keys.length > 0) result.push({ label: cat.label, keys })
  }

  // Anything left goes into "Otros"
  const remaining = allKeys.filter(k => !used.has(k))
  if (remaining.length > 0) result.push({ label: 'Otros', keys: remaining })

  return result
}

export function BadgeShowcase({ unlockedKeys, accentColor = 'var(--accent)' }: BadgeShowcaseProps) {
  const unlockedSet = new Set(unlockedKeys)
  const totalBadges = Object.keys(BADGE_DEFS).length
  const unlockedCount = unlockedKeys.filter(k => BADGE_DEFS[k]).length
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      {/* Section header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between py-2"
      >
        <span className="font-bebas text-xl tracking-wider">
          🏅 INSIGNIAS
        </span>
        <span className="text-xs font-bold" style={{ color: accentColor }}>
          {unlockedCount}/{totalBadges} desbloqueadas {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Progress bar */}
      <div className="xp-bar mb-3">
        <div
          className="xp-bar-fill"
          style={{ width: `${Math.round((unlockedCount / totalBadges) * 100)}%`, background: accentColor }}
        />
      </div>

      {expanded && (
        <div className="space-y-4">
          {BADGE_CATEGORIES.map(cat => (
            <div key={cat.label}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
                {cat.label} ({cat.keys.filter(k => unlockedSet.has(k)).length}/{cat.keys.length})
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {cat.keys.map(key => {
                  const def = BADGE_DEFS[key]
                  if (!def) return null
                  const unlocked = unlockedSet.has(key)
                  return (
                    <div
                      key={key}
                      className="flex flex-col items-center gap-0.5 p-1.5 rounded-m text-center"
                      style={{
                        background: 'var(--card)',
                        border: unlocked ? `1px solid ${accentColor}44` : '1px solid var(--border)',
                        opacity: unlocked ? 1 : 0.4,
                      }}
                      title={`${def.name} — ${def.desc}`}
                    >
                      <span className="text-lg">{unlocked ? def.icon : '🔒'}</span>
                      <span
                        className="text-[10px] font-bold leading-tight"
                        style={{ color: unlocked ? 'var(--fg)' : 'var(--muted)' }}
                      >
                        {def.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
