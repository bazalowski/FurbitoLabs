import { Fragment, useEffect, useRef, useState } from 'react'
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

// ── Inline detail panel (shared) ─────────────────────────────
function BadgeDetailPanel({
  badgeKey,
  accentColor,
  onClose,
}: { badgeKey: string; accentColor: string; onClose: () => void }) {
  const def = BADGE_DEFS[badgeKey]
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [badgeKey])
  if (!def) return null
  return (
    <div
      ref={ref}
      className="rounded-m p-3 flex items-center gap-3 animate-pop relative"
      style={{ background: 'var(--card)', border: `1px solid ${accentColor}44` }}
    >
      <span className="text-3xl shrink-0">{def.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bebas text-base tracking-wider leading-tight" style={{ color: accentColor }}>
          {def.name}
        </p>
        <p className="text-xs leading-snug mt-0.5" style={{ color: 'var(--muted)' }}>
          {def.desc}
        </p>
        {def.xp > 0 && (
          <p className="text-[10px] font-bold mt-1" style={{ color: accentColor }}>
            +{def.xp} XP
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        aria-label="Cerrar"
        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-opacity hover:opacity-80 active:scale-95"
        style={{ color: 'var(--muted)', background: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        ✕
      </button>
    </div>
  )
}

// ── Inline grid with expandable detail anchored to the clicked row ──
interface BadgeInlineGridProps {
  keys: string[]
  cols: number
  accentColor?: string
  unlockedSet?: Set<string>
  /** When true, render unlocked as compact icon+name button (showcase style). When false, use BadgeChip size="md". */
  showcaseStyle?: boolean
}

export function BadgeInlineGrid({
  keys,
  cols,
  accentColor = 'var(--accent)',
  unlockedSet,
  showcaseStyle = false,
}: BadgeInlineGridProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const selIdx = selected ? keys.indexOf(selected) : -1
  const selRow = selIdx >= 0 ? Math.floor(selIdx / cols) : -1

  const rows: string[][] = []
  for (let i = 0; i < keys.length; i += cols) rows.push(keys.slice(i, i + cols))

  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row, rIdx) => (
        <Fragment key={rIdx}>
          {rIdx === selRow && selected && (
            <BadgeDetailPanel
              badgeKey={selected}
              accentColor={accentColor}
              onClose={() => setSelected(null)}
            />
          )}
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {row.map(key => {
              const def = BADGE_DEFS[key]
              if (!def) return null
              const unlocked = unlockedSet ? unlockedSet.has(key) : true
              const isSelected = key === selected
              const toggle = () => setSelected(s => (s === key ? null : key))

              if (showcaseStyle) {
                return unlocked ? (
                  <button
                    key={key}
                    onClick={toggle}
                    className="flex flex-col items-center gap-0.5 p-1.5 rounded-m text-center select-none min-h-[48px] transition-all active:scale-95"
                    style={{
                      background: 'var(--card)',
                      border: `1px solid ${isSelected ? accentColor : `${accentColor}44`}`,
                      boxShadow: isSelected ? `0 0 0 2px ${accentColor}55` : undefined,
                    }}
                  >
                    <span className="text-lg">{def.icon}</span>
                    <span className="text-[10px] font-bold leading-tight" style={{ color: 'var(--fg)' }}>
                      {def.name}
                    </span>
                  </button>
                ) : (
                  <div
                    key={key}
                    aria-disabled="true"
                    title={`${def.name} — bloqueada`}
                    className="flex flex-col items-center gap-0.5 p-1.5 rounded-m text-center select-none min-h-[48px]"
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      opacity: 0.4,
                      cursor: 'not-allowed',
                    }}
                  >
                    <span className="text-lg" aria-hidden="true">🔒</span>
                    <span className="text-[10px] font-bold leading-tight" style={{ color: 'var(--muted)' }}>
                      {def.name}
                    </span>
                  </div>
                )
              }

              return (
                <button
                  key={key}
                  onClick={toggle}
                  className="active:scale-95 transition-transform rounded-m"
                  style={{
                    boxShadow: isSelected ? `0 0 0 2px ${accentColor}` : undefined,
                  }}
                >
                  <BadgeChip badgeKey={key} size="md" />
                </button>
              )
            })}
          </div>
        </Fragment>
      ))}
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
  const allKeys = Object.keys(BADGE_DEFS)
  const cats: { label: string; prefixes: string[] }[] = [
    { label: 'Goles', prefixes: ['primer_gol', 'primer_doblete', 'hat_trick', 'poker', 'manita', 'doble_digito', 'goles_', 'gol_debut', 'gol_y_cero', 'gol_50_partidos', 'media_gol'] },
    { label: 'Asistencias', prefixes: ['primera_asistencia', 'doble_asist', 'triple_asist', 'asistencias_', 'gol_y_asist', 'asist_'] },
    { label: 'Hazañas', prefixes: ['chilena', 'olimpico', 'tacon', 'porteria_cero', 'parada_penalti', 'muro_', 'doble_hazana', 'triple_hazana', 'todo_cero', 'portero_goleador', 'parada_y_asist', 'gol_asist_hazana'] },
    { label: 'Partidos', prefixes: ['primer_partido', 'partidos_'] },
    { label: 'MVP', prefixes: ['primer_mvp', 'mvp_'] },
    { label: 'XP y Nivel', prefixes: ['xp_', 'nivel_'] },
    { label: 'Combos', prefixes: ['gol_50_mvp', 'partidos_100_goles', 'partido_perfecto', 'doble_doble', 'triple_doble', 'hat_trick_asist', 'mvp_hat_trick', 'gol_hat_asist', 'mvp_goleada', 'goles_asist_100', 'partidos_50_mvp', 'gol_100_asist'] },
    { label: 'Meta', prefixes: ['leyenda_'] },
    { label: 'Portero', prefixes: ['portero_', 'parada_'] },
    { label: 'Resultados', prefixes: ['goleada_', 'empate_', 'victoria_ajustada', 'muchos_goles', 'partido_epico'] },
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
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between py-2"
      >
        <span className="font-bebas text-xl tracking-wider">🏅 INSIGNIAS</span>
        <span className="text-xs font-bold" style={{ color: accentColor }}>
          {unlockedCount}/{totalBadges} desbloqueadas {expanded ? '▲' : '▼'}
        </span>
      </button>

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
              <BadgeInlineGrid
                keys={cat.keys}
                cols={4}
                accentColor={accentColor}
                unlockedSet={unlockedSet}
                showcaseStyle
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
